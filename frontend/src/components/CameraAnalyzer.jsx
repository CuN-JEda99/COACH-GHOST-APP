import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Activity, CheckCircle2, AlertTriangle, Upload, Download } from 'lucide-react';
import { POSICIONES, CONEXIONES, PUNTOS_CLAVE, calcularMetricas, REGLAS, puntuar, generarInforme } from '../utils/postureAnalysis';

/*
 * COACH GHOST - Entrenador con cámara
 *  1) Análisis de postura en vivo.
 *  2) Grabar una jugada (o subir un video), analizarla cuadro a cuadro y recibir un informe con qué mejorar.
 * Usa MediaPipe Pose (Tasks Vision) cargado desde CDN, sin instalar paquetes.
 * Todo corre en el dispositivo: el video NO se envía a ningún servidor.
 */

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const MAX_GRABACION_S = 15;  // duración máxima de una grabación
const MAX_ANALISIS_S = 30;   // duración máxima analizada de un video subido
const CUENTA_REGRESIVA_S = 3;

function dibujarEsqueleto(ctx, lm, w, h, grosor = 4) {
  ctx.lineWidth = grosor;
  ctx.strokeStyle = '#00FF88';
  CONEXIONES.forEach(([a, b]) => {
    if ((lm[a].visibility ?? 1) < 0.5 || (lm[b].visibility ?? 1) < 0.5) return;
    ctx.beginPath();
    ctx.moveTo(lm[a].x * w, lm[a].y * h);
    ctx.lineTo(lm[b].x * w, lm[b].y * h);
    ctx.stroke();
  });
  ctx.fillStyle = '#FFFFFF';
  PUNTOS_CLAVE.forEach((i) => {
    if ((lm[i].visibility ?? 1) < 0.5) return;
    ctx.beginPath();
    ctx.arc(lm[i].x * w, lm[i].y * h, grosor + 1, 0, Math.PI * 2);
    ctx.fill();
  });
}

const fmtT = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const colorScore = (s) => (s >= 75 ? '#00FF88' : s >= 40 ? '#FACC15' : '#F87171');

export default function CameraAnalyzer() {
  const videoRef = useRef(null);        // cámara en vivo
  const playRef = useRef(null);         // reproducción del video grabado / subido
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const ultimoUiRef = useRef(0);
  const historialRef = useRef([]);
  const posicionRef = useRef('Delantero');
  const grabadorRef = useRef(null);
  const chunksRef = useRef([]);
  const timersRef = useRef([]);
  const duracionGrabRef = useRef(0);
  const urlRef = useRef(null);

  const [posicion, setPosicion] = useState('Delantero');
  const [camara, setCamara] = useState('user');
  const [estado, setEstado] = useState('inactivo'); // inactivo | cargando | activo | grabando | analizando | informe | error
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);
  const [promedio, setPromedio] = useState(null);
  const [cuenta, setCuenta] = useState(null);
  const [segGrab, setSegGrab] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [informe, setInforme] = useState(null);
  const [snapshots, setSnapshots] = useState({ mejor: null, peor: null });
  const [videoUrl, setVideoUrl] = useState(null);

  useEffect(() => { posicionRef.current = posicion; }, [posicion]);

  const limpiarTimers = () => { timersRef.current.forEach((t) => { clearTimeout(t); clearInterval(t); }); timersRef.current = []; };

  const detener = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
  }, []);

  useEffect(() => () => {
    limpiarTimers();
    detener();
    if (grabadorRef.current && grabadorRef.current.state !== 'inactive') { try { grabadorRef.current.stop(); } catch { /* noop */ } }
    if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch { /* noop */ } landmarkerRef.current = null; }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, [detener]);

  // ---------- Modelo ----------
  const cargarModelo = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    const vision = await import(/* @vite-ignore */ VISION_URL);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const opciones = (delegate) => ({ baseOptions: { modelAssetPath: MODEL_URL, delegate }, runningMode: 'VIDEO', numPoses: 1 });
    try {
      landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, opciones('GPU'));
    } catch {
      landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, opciones('CPU'));
    }
    return landmarkerRef.current;
  };

  const dibujarEnCanvas = (lm, w, h) => {
    const c = canvasRef.current;
    if (!c) return;
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    if (lm) dibujarEsqueleto(ctx, lm, w, h);
  };

  // ---------- Análisis en vivo ----------
  const bucleVivo = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) { rafRef.current = requestAnimationFrame(bucleVivo); return; }
    const w = video.videoWidth, h = video.videoHeight;
    const res = landmarker.detectForVideo(video, performance.now());
    const lm = res && res.landmarks && res.landmarks[0];
    dibujarEnCanvas(lm || null, w, h);

    const ahora = performance.now();
    if (ahora - ultimoUiRef.current > 300) {
      ultimoUiRef.current = ahora;
      const m = lm ? calcularMetricas(lm, w, h) : null;
      if (m) {
        const reglas = REGLAS[posicionRef.current](m);
        const score = puntuar(reglas);
        historialRef.current.push(score);
        if (historialRef.current.length > 200) historialRef.current.shift();
        const hs = historialRef.current;
        setPromedio(Math.round(hs.reduce((a, b) => a + b, 0) / hs.length));
        setResultado({ score, reglas, visible: true });
      } else if (lm) {
        setResultado({ score: 0, reglas: [], visible: false });
      }
    }
    rafRef.current = requestAnimationFrame(bucleVivo);
  };

  const iniciar = async (facing = camara) => {
    setError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setEstado('error');
      setError('Tu navegador no permite usar la cámara aquí. Abre la página con https (o localhost) en Chrome, Edge, Safari o Firefox actualizados. Puedes usar "Subir video".');
      return;
    }
    setEstado('cargando');
    try {
      detener();
      await cargarModelo();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      video.srcObject = stream;
      await video.play();
      historialRef.current = [];
      setPromedio(null);
      setResultado(null);
      setInforme(null);
      setEstado('activo');
      rafRef.current = requestAnimationFrame(bucleVivo);
    } catch (e) {
      detener();
      setEstado('error');
      if (e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) setError('Permiso de cámara denegado. Pulsa el candado junto a la dirección, permite la cámara y vuelve a intentar.');
      else if (e && e.name === 'NotFoundError') setError('No se encontró ninguna cámara en este dispositivo.');
      else setError('No se pudo iniciar el análisis (' + (e && e.message ? e.message : 'error desconocido') + '). Revisa tu conexión: el modelo se descarga la primera vez.');
    }
  };

  const cambiarCamara = () => {
    const nueva = camara === 'user' ? 'environment' : 'user';
    setCamara(nueva);
    if (estado === 'activo') iniciar(nueva);
  };

  const apagar = () => { limpiarTimers(); detener(); setEstado('inactivo'); setResultado(null); setCuenta(null); };

  // ---------- Grabación ----------
  const empezarCuenta = () => {
    if (typeof MediaRecorder === 'undefined') {
      setError('Este navegador no puede grabar video. Graba con la cámara de tu celular y usa "Subir video".');
      return;
    }
    setError('');
    let n = CUENTA_REGRESIVA_S;
    setCuenta(n);
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(iv); setCuenta(null); comenzarGrabacion(); } else setCuenta(n);
    }, 1000);
    timersRef.current.push(iv);
  };

  const comenzarGrabacion = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const tipo = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'].find((t) => MediaRecorder.isTypeSupported(t));
    let rec;
    try { rec = new MediaRecorder(stream, tipo ? { mimeType: tipo, videoBitsPerSecond: 2500000 } : undefined); }
    catch { setError('No se pudo iniciar la grabación en este navegador. Usa "Subir video".'); return; }
    chunksRef.current = [];
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunksRef.current.push(e.data); };
    rec.onstop = () => {
      limpiarTimers();
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'video/webm' });
      detener();
      analizarVideo(blob, duracionGrabRef.current);
    };
    grabadorRef.current = rec;
    rec.start(250);
    const inicio = performance.now();
    setSegGrab(0);
    setEstado('grabando');
    const iv = setInterval(() => {
      const s = (performance.now() - inicio) / 1000;
      duracionGrabRef.current = s;
      setSegGrab(s);
      if (s >= MAX_GRABACION_S) detenerGrabacion();
    }, 200);
    timersRef.current.push(iv);
  };

  const detenerGrabacion = () => {
    const rec = grabadorRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
  };

  // ---------- Subir video ----------
  const alElegirArchivo = async (e) => {
    const archivo = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!archivo) return;
    setError('');
    try {
      apagar();
      setEstado('cargando');
      await cargarModelo();
      await analizarVideo(archivo, 0);
    } catch (err) {
      setEstado('error');
      setError('No se pudo cargar el modelo de IA (' + (err && err.message ? err.message : 'error') + '). Revisa tu conexión.');
    }
  };

  // ---------- Análisis del video grabado ----------
  const analizarVideo = async (blob, duracionConocida) => {
    const pos = posicionRef.current;
    setEstado('analizando');
    setProgreso(0);
    setInforme(null);
    setSnapshots({ mejor: null, peor: null });
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(blob);
    urlRef.current = url;

    try {
      const landmarker = await cargarModelo();
      const v = playRef.current;
      v.controls = false;
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      await new Promise((res, rej) => {
        v.onloadedmetadata = () => res();
        v.onerror = () => rej(new Error('No se pudo leer el video (formato no compatible).'));
      });

      const frames = [];
      let total = 0;
      let mejorScore = -1, peorScore = 101;
      const snaps = { mejor: null, peor: null };
      const off = document.createElement('canvas');

      const capturar = (lm, w, h) => {
        const esc = Math.min(1, 520 / w);
        off.width = Math.round(w * esc);
        off.height = Math.round(h * esc);
        const ctx = off.getContext('2d');
        ctx.drawImage(v, 0, 0, off.width, off.height);
        dibujarEsqueleto(ctx, lm, off.width, off.height, 3);
        return off.toDataURL('image/jpeg', 0.75);
      };

      const procesar = (t) => {
        const w = v.videoWidth, h = v.videoHeight;
        if (!w || !h) return;
        const res = landmarker.detectForVideo(v, performance.now());
        const lm = res && res.landmarks && res.landmarks[0];
        total++;
        dibujarEnCanvas(lm || null, w, h);
        if (!lm) return;
        const m = calcularMetricas(lm, w, h);
        if (!m) return;
        const r = REGLAS[pos](m);
        const score = puntuar(r);
        frames.push({ t, m, r, score });
        if (score > mejorScore) { mejorScore = score; snaps.mejor = { src: capturar(lm, w, h), t, score }; }
        if (score < peorScore) { peorScore = score; snaps.peor = { src: capturar(lm, w, h), t, score }; }
      };

      await new Promise((resolve) => {
        let fin = false;
        const terminar = () => { if (fin) return; fin = true; try { v.pause(); } catch { /* noop */ } resolve(); };
        v.onended = terminar;
        const paso = (_ahora, meta) => {
          if (fin) return;
          const t = meta && meta.mediaTime != null ? meta.mediaTime : v.currentTime;
          procesar(t);
          const dur = Number.isFinite(v.duration) ? v.duration : (duracionConocida || MAX_ANALISIS_S);
          setProgreso(Math.min(100, Math.round((t / Math.max(0.1, Math.min(dur, MAX_ANALISIS_S))) * 100)));
          if (t >= MAX_ANALISIS_S) { terminar(); return; }
          programar();
        };
        const programar = () => {
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(paso);
          else requestAnimationFrame(() => paso(0, null));
        };
        programar();
        v.play().catch(() => terminar());
      });

      const inf = generarInforme(pos, frames, total);
      setInforme(inf);
      setSnapshots(snaps);
      setVideoUrl(url);
      const c = canvasRef.current;
      if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
      v.onended = null;
      v.src = url;
      v.controls = true;
      v.muted = false;
      setEstado('informe');
    } catch (e) {
      setEstado('error');
      setError('No se pudo analizar el video: ' + (e && e.message ? e.message : 'error desconocido'));
    }
  };

  const nuevaJugada = () => { setInforme(null); setVideoUrl(null); setSnapshots({ mejor: null, peor: null }); iniciar(); };

  // ---------- Estilos ----------
  const enVivo = estado === 'activo' || estado === 'grabando';
  const espejo = enVivo && camara === 'user' ? 'scaleX(-1)' : 'none';
  const tips = resultado && resultado.reglas ? resultado.reglas.filter((r) => r.aplica !== false && !r.ok) : [];
  const btn = (activo) => ({
    padding: '0.6rem 1.1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.08em',
    textTransform: 'uppercase', cursor: 'pointer', border: activo ? '1px solid #00FF88' : '1px solid #27272A',
    backgroundColor: activo ? '#00FF88' : '#000000', color: activo ? '#000000' : '#A1A1AA',
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem'
  });
  const caja = { backgroundColor: '#000', borderRadius: '0.9rem', border: '1px solid #27272A', padding: '1.25rem' };
  const ocupado = estado === 'cargando' || estado === 'analizando' || estado === 'grabando' || cuenta !== null;

  // ---------- Gráfica de puntaje en el tiempo ----------
  const Grafica = ({ inf }) => {
    const W = 300, H = 90, t0 = inf.serie[0].t, t1 = inf.serie[inf.serie.length - 1].t || 1;
    const x = (t) => ((t - t0) / Math.max(0.001, t1 - t0)) * W;
    const y = (s) => H - (s / 100) * H;
    const pts = inf.serie.map((p) => `${x(p.t).toFixed(1)},${y(p.score).toFixed(1)}`).join(' ');
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Puntaje de postura durante la jugada" style={{ display: 'block' }}>
        <line x1="0" x2={W} y1={y(75)} y2={y(75)} stroke="#3F3F46" strokeDasharray="4 4" />
        <polyline points={pts} fill="none" stroke="#00FF88" strokeWidth="2" />
        <circle cx={x(inf.peor.t)} cy={y(inf.peor.score)} r="4" fill="#F87171" />
        <circle cx={x(inf.mejor.t)} cy={y(inf.mejor.score)} r="4" fill="#00FF88" stroke="#000" />
      </svg>
    );
  };

  return (
    <section id="ia-camara" style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#18181B', borderRadius: '1.25rem', border: '1px solid rgba(0, 255, 136, 0.25)', padding: '2.5rem' }}>
        <span className="nike-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Camera size={14} color="#00FF88" /> ENTRENADOR CON CÁMARA
        </span>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF', margin: '0 0 0.5rem' }}>
          Graba tu jugada y la IA te <span style={{ color: '#00FF88' }}>dice qué mejorar</span>
        </h2>
        <p style={{ color: '#A1A1AA', maxWidth: '760px', margin: '0 0 1rem' }}>
          Elige tu posición, enciende la cámara y graba hasta {MAX_GRABACION_S} segundos (o sube un video). La IA revisa tu cuerpo cuadro a cuadro y te entrega un informe con
          lo que hiciste bien, lo que debes corregir y ejercicios sugeridos. El video se procesa en tu dispositivo y no se envía a ningún servidor.
        </p>
        <p style={{ color: '#71717A', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
          Para mejores resultados: cámara fija (apoya el celular), cuerpo completo visible, de lado o a 45°, buena luz y a 3–4 metros.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {POSICIONES.map((p) => (
            <button key={p} disabled={ocupado} onClick={() => { setPosicion(p); historialRef.current = []; setPromedio(null); }} style={{ ...btn(posicion === p), opacity: ocupado ? 0.6 : 1 }}>{p}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* ---- Video ---- */}
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '0.9rem', overflow: 'hidden', border: '1px solid #27272A', aspectRatio: '4 / 3' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'contain', transform: espejo, display: enVivo ? 'block' : 'none' }} />
              <video ref={playRef} playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', display: estado === 'analizando' || estado === 'informe' ? 'block' : 'none' }} />
              <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', transform: espejo, display: enVivo || estado === 'analizando' ? 'block' : 'none', pointerEvents: 'none' }} />

              {estado === 'grabando' && (
                <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(0,0,0,0.7)', padding: '0.3rem 0.7rem', borderRadius: '999px', color: '#fff', fontWeight: 800, fontSize: '0.8rem' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#EF4444' }} /> REC {segGrab.toFixed(1)} s / {MAX_GRABACION_S} s
                </div>
              )}
              {cuenta !== null && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)', fontSize: '6rem', fontWeight: 900, color: '#00FF88' }}>{cuenta}</div>
              )}
              {estado === 'analizando' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0.6rem 0.9rem', backgroundColor: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: '0.8rem' }}>
                  Analizando tu jugada… {progreso}%
                  <div style={{ height: 4, backgroundColor: '#27272A', borderRadius: 2, marginTop: 6 }}><div style={{ width: `${progreso}%`, height: '100%', backgroundColor: '#00FF88', borderRadius: 2 }} /></div>
                </div>
              )}
              {!enVivo && estado !== 'analizando' && estado !== 'informe' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '1rem' }}>
                  {estado === 'cargando' ? (<><div className="spinner-neon" /><span>Cargando modelo de IA… (la primera vez tarda unos segundos)</span></>) : (<><CameraOff size={40} /><span>Cámara apagada</span></>)}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              {estado === 'activo' && cuenta === null && (
                <button onClick={empezarCuenta} style={{ ...btn(true), backgroundColor: '#EF4444', borderColor: '#EF4444', color: '#fff' }}>● Grabar jugada</button>
              )}
              {estado === 'grabando' && (
                <button onClick={detenerGrabacion} style={btn(true)}>■ Detener y analizar</button>
              )}
              {(estado === 'inactivo' || estado === 'error') && (
                <button onClick={() => iniciar()} style={btn(true)}><Camera size={16} /> Encender cámara</button>
              )}
              {estado === 'informe' && (
                <button onClick={nuevaJugada} style={btn(true)}><Camera size={16} /> Grabar otra jugada</button>
              )}
              {estado === 'activo' && cuenta === null && (
                <button onClick={apagar} style={btn(false)}><CameraOff size={16} /> Apagar</button>
              )}
              {(estado === 'activo' || estado === 'inactivo' || estado === 'error') && cuenta === null && (
                <button onClick={cambiarCamara} style={btn(false)}><RefreshCw size={16} /> {camara === 'user' ? 'Cámara trasera' : 'Cámara frontal'}</button>
              )}
              {!ocupado && (
                <label style={{ ...btn(false), cursor: 'pointer' }}>
                  <Upload size={16} /> Subir video
                  <input type="file" accept="video/*" onChange={alElegirArchivo} style={{ display: 'none' }} />
                </label>
              )}
              {estado === 'informe' && videoUrl && (
                <a href={videoUrl} download="jugada-coach-ghost.webm" style={{ ...btn(false), textDecoration: 'none' }}><Download size={16} /> Descargar video</a>
              )}
            </div>

            {error && (
              <div style={{ marginTop: '0.9rem', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #F87171', color: '#FCA5A5', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} /> <span>{error}</span>
              </div>
            )}
          </div>

          {/* ---- Panel derecho ---- */}
          <div style={caja}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A1A1AA', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <Activity size={16} color="#00FF88" /> {estado === 'informe' ? 'Informe de tu jugada' : 'Análisis en vivo'} · {posicion}
            </div>

            {(estado === 'inactivo' || estado === 'error' || estado === 'cargando') && (
              <p style={{ color: '#A1A1AA', margin: 0 }}>Enciende la cámara para ver tu postura en vivo y grabar tu jugada, o sube un video que ya tengas.</p>
            )}
            {estado === 'analizando' && <p style={{ color: '#A1A1AA', margin: 0 }}>La IA está revisando tu jugada cuadro a cuadro. En unos segundos verás el informe.</p>}

            {enVivo && !resultado && <p style={{ color: '#A1A1AA', margin: 0 }}>Buscando tu cuerpo… colócate de cuerpo completo frente a la cámara.</p>}
            {enVivo && resultado && !resultado.visible && (
              <p style={{ color: '#FACC15', margin: 0 }}>No te veo completo. Aléjate un poco para que se vean hombros, caderas, rodillas y tobillos.</p>
            )}
            {enVivo && resultado && resultado.visible && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 900, color: colorScore(resultado.score), lineHeight: 1 }}>{resultado.score}</span>
                  <span style={{ color: '#A1A1AA' }}>/ 100 postura actual{promedio !== null ? ` · promedio: ${promedio}` : ''}</span>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {resultado.reglas.filter((r) => r.aplica !== false).map((r) => (
                    <div key={r.nombre} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.55rem 0.8rem', borderRadius: '0.5rem', backgroundColor: '#18181B', border: `1px solid ${r.ok ? 'rgba(0,255,136,0.35)' : '#3F3F46'}` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFFFFF', fontSize: '0.88rem' }}>
                        {r.ok ? <CheckCircle2 size={16} color="#00FF88" /> : <AlertTriangle size={16} color="#FACC15" />} {r.nombre}
                      </span>
                      <span style={{ color: r.ok ? '#00FF88' : '#FACC15', fontWeight: 700 }}>{r.valor}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', color: '#E4E4E7', fontSize: '0.9rem' }}>
                  {tips.length === 0 ? (<strong style={{ color: '#00FF88' }}>¡Postura correcta! Mantén la posición.</strong>) : (
                    <><strong style={{ color: '#FACC15' }}>Corrige:</strong><ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>{tips.map((t) => <li key={t.nombre}>{t.tip}</li>)}</ul></>
                  )}
                </div>
              </>
            )}

            {estado === 'informe' && informe && !informe.ok && (
              <div style={{ color: '#FACC15' }}>
                <strong>No pude ver tu cuerpo completo en el video</strong> (solo en el {informe.cobertura}% de los cuadros).
                <ul style={{ color: '#E4E4E7', paddingLeft: '1.1rem' }}>
                  <li>Graba más lejos, de modo que se vean cabeza, manos y pies.</li>
                  <li>Usa buena luz y ropa que contraste con el fondo.</li>
                  <li>Mantén la cámara fija y evita que otra persona tape tu cuerpo.</li>
                </ul>
              </div>
            )}

            {estado === 'informe' && informe && informe.ok && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 900, color: colorScore(informe.scoreProm), lineHeight: 1 }}>{informe.scoreProm}</span>
                  <span style={{ color: '#E4E4E7', fontWeight: 700 }}>{informe.veredicto}</span>
                </div>
                <p style={{ color: '#A1A1AA', fontSize: '0.82rem', margin: '0.4rem 0 1rem' }}>
                  Postura correcta durante el {informe.buenaPct}% de la jugada ({informe.duracion.toFixed(1)} s). Tu cuerpo se vio completo en el {informe.cobertura}% del video.
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <Grafica inf={informe} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717A', fontSize: '0.7rem' }}>
                    <span><span style={{ color: '#F87171' }}>●</span> punto más débil: {fmtT(informe.peor.t)}</span>
                    <span><span style={{ color: '#00FF88' }}>●</span> mejor momento: {fmtT(informe.mejor.t)}</span>
                  </div>
                </div>

                {(snapshots.peor || snapshots.mejor) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                    {snapshots.peor && (<figure style={{ margin: 0 }}><img src={snapshots.peor.src} alt="Momento a corregir" style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #F87171' }} /><figcaption style={{ color: '#FCA5A5', fontSize: '0.72rem', marginTop: 4 }}>A corregir · {fmtT(snapshots.peor.t)} · {snapshots.peor.score}/100</figcaption></figure>)}
                    {snapshots.mejor && (<figure style={{ margin: 0 }}><img src={snapshots.mejor.src} alt="Mejor momento" style={{ width: '100%', borderRadius: '0.5rem', border: '1px solid #00FF88' }} /><figcaption style={{ color: '#86EFAC', fontSize: '0.72rem', marginTop: 4 }}>Mejor momento · {fmtT(snapshots.mejor.t)} · {snapshots.mejor.score}/100</figcaption></figure>)}
                  </div>
                )}

                <h4 style={{ color: '#FACC15', margin: '0 0 0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Para mejorar</h4>
                {informe.mejoras.length === 0 ? (
                  <p style={{ color: '#86EFAC', margin: '0 0 1rem' }}>No encontré fallas importantes en esta jugada.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1rem' }}>
                    {informe.mejoras.map((m) => (
                      <div key={m.titulo} style={{ padding: '0.7rem 0.9rem', borderRadius: '0.5rem', backgroundColor: '#18181B', border: '1px solid #3F3F46' }}>
                        <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem', display: 'flex', gap: '0.4rem', alignItems: 'center' }}><AlertTriangle size={15} color="#FACC15" /> {m.titulo}</div>
                        <div style={{ color: '#D4D4D8', fontSize: '0.84rem', marginTop: 4 }}>{m.detalle}</div>
                        {m.ejercicio && <div style={{ color: '#00FF88', fontSize: '0.8rem', marginTop: 6 }}>Ejercicio: {m.ejercicio}</div>}
                      </div>
                    ))}
                  </div>
                )}

                {informe.positivos.length > 0 && (
                  <>
                    <h4 style={{ color: '#00FF88', margin: '0 0 0.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lo que hiciste bien</h4>
                    <ul style={{ margin: '0 0 1rem', paddingLeft: 0, listStyle: 'none', display: 'grid', gap: '0.4rem' }}>
                      {informe.positivos.map((p) => (
                        <li key={p.titulo} style={{ color: '#E4E4E7', fontSize: '0.85rem', display: 'flex', gap: '0.45rem' }}><CheckCircle2 size={16} color="#00FF88" style={{ flexShrink: 0, marginTop: 2 }} /> <span><strong>{p.titulo}.</strong> {p.detalle}</span></li>
                      ))}
                    </ul>
                  </>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                  {informe.metricas.map((m) => (
                    <div key={m.label} style={{ padding: '0.5rem 0.7rem', borderRadius: '0.5rem', backgroundColor: '#18181B' }}>
                      <div style={{ color: '#71717A', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                      <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>{m.valor}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <p style={{ color: '#71717A', fontSize: '0.72rem', margin: '1rem 0 0' }}>
              Análisis aproximado de postura y movimiento con visión por computador. No ve el balón ni el resultado de la jugada, y no reemplaza a un entrenador profesional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}