import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, RefreshCw, Activity, CheckCircle2, AlertTriangle } from 'lucide-react';

/*
 * COACH GHOST - Entrenador con cámara (análisis de postura en vivo)
 * Usa MediaPipe Pose (Tasks Vision) cargado desde CDN, sin instalar paquetes.
 * Todo el análisis corre en el dispositivo: el video NO se envía a ningún servidor.
 */

const VISION_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const POSICIONES = ['Delantero', 'Defensa', 'Medio', 'Arquero'];

// Conexiones del esqueleto (índices de MediaPipe Pose)
const CONEXIONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32]
];

const L = { NARIZ: 0, HOMBRO_I: 11, HOMBRO_D: 12, MUNECA_I: 15, MUNECA_D: 16, CADERA_I: 23, CADERA_D: 24, RODILLA_I: 25, RODILLA_D: 26, TOBILLO_I: 27, TOBILLO_D: 28 };

// ---------- Geometría ----------
const angulo = (a, b, c) => {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!m) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
};

const punto = (lm, i, w, h) => ({ x: lm[i].x * w, y: lm[i].y * h, v: lm[i].visibility ?? 1 });
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

// Reglas por posición: cada una devuelve {ok, valor, ok_msg, tip}
const REGLAS = {
  Delantero: (m) => [
    { nombre: 'Flexión de rodillas', ok: m.rodilla >= 120 && m.rodilla <= 160, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 160 ? 'Flexiona más las rodillas para ganar impulso.' : 'Sube un poco: estás demasiado bajo para arrancar.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 5 && m.tronco <= 30, valor: `${m.tronco.toFixed(0)}°`, tip: m.tronco < 5 ? 'Inclina el pecho hacia adelante, sobre el balón.' : 'Estás muy inclinado; mantén el pecho firme.' },
    { nombre: 'Base de apoyo', ok: m.base >= 0.8 && m.base <= 1.6, valor: `${m.base.toFixed(1)}x`, tip: m.base < 0.8 ? 'Separa más los pies (al ancho de hombros).' : 'Pies demasiado abiertos para salir rápido.' }
  ],
  Defensa: (m) => [
    { nombre: 'Centro de gravedad bajo', ok: m.rodilla >= 100 && m.rodilla <= 145, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 145 ? 'Baja la cadera: flexiona más las rodillas.' : 'Demasiado bajo; no podrás reaccionar rápido.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 10 && m.tronco <= 35, valor: `${m.tronco.toFixed(0)}°`, tip: m.tronco < 10 ? 'Inclínate un poco hacia adelante.' : 'Levanta el pecho, mantén la vista en el atacante.' },
    { nombre: 'Base amplia', ok: m.base >= 1.2 && m.base <= 2.2, valor: `${m.base.toFixed(1)}x`, tip: m.base < 1.2 ? 'Abre los pies: necesitas una base más amplia.' : 'Base excesiva; reduce un poco la separación.' }
  ],
  Medio: (m) => [
    { nombre: 'Rodillas listas', ok: m.rodilla >= 135 && m.rodilla <= 165, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 165 ? 'No bloquees las piernas: mantén flexión suave.' : 'Súbete un poco para girar con facilidad.' },
    { nombre: 'Tronco erguido', ok: m.tronco <= 20, valor: `${m.tronco.toFixed(0)}°`, tip: 'Levanta el torso para ver el campo (escaneo 360°).' },
    { nombre: 'Base de apoyo', ok: m.base >= 0.9 && m.base <= 1.6, valor: `${m.base.toFixed(1)}x`, tip: 'Pies al ancho de hombros para orientar el cuerpo.' },
    { nombre: 'Brazos abiertos (equilibrio)', ok: m.manos >= 1.2, valor: `${m.manos.toFixed(1)}x`, tip: 'Abre un poco los brazos para equilibrar al recibir.' }
  ],
  Arquero: (m) => [
    { nombre: 'Posición base (rodillas)', ok: m.rodilla >= 110 && m.rodilla <= 150, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 150 ? 'Flexiona las rodillas: pesa sobre las puntas.' : 'Sube un poco para poder desplazarte.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 10 && m.tronco <= 30, valor: `${m.tronco.toFixed(0)}°`, tip: 'Inclina el pecho hacia el balón, espalda recta.' },
    { nombre: 'Manos al frente', ok: m.manosFrente, valor: m.manosFrente ? 'Sí' : 'No', tip: 'Sube las manos al frente, por encima de la cadera.' },
    { nombre: 'Base de apoyo', ok: m.base >= 1.1 && m.base <= 1.8, valor: `${m.base.toFixed(1)}x`, tip: 'Pies un poco más anchos que los hombros.' }
  ]
};

function calcularMetricas(lm, w, h) {
  const P = (i) => punto(lm, i, w, h);
  const hI = P(L.HOMBRO_I), hD = P(L.HOMBRO_D), cI = P(L.CADERA_I), cD = P(L.CADERA_D);
  const rI = P(L.RODILLA_I), rD = P(L.RODILLA_D), tI = P(L.TOBILLO_I), tD = P(L.TOBILLO_D);
  const mI = P(L.MUNECA_I), mD = P(L.MUNECA_D);

  const claves = [hI, hD, cI, cD, rI, rD, tI, tD];
  if (claves.some((p) => p.v < 0.5)) return null; // cuerpo no visible completo

  const rodilla = (angulo(cI, rI, tI) + angulo(cD, rD, tD)) / 2;
  const hombros = medio(hI, hD);
  const caderas = medio(cI, cD);
  const tronco = (Math.atan2(Math.abs(hombros.x - caderas.x), Math.abs(caderas.y - hombros.y)) * 180) / Math.PI;
  const anchoHombros = Math.hypot(hI.x - hD.x, hI.y - hD.y) || 1;
  const base = Math.abs(tI.x - tD.x) / anchoHombros;
  const manos = Math.abs(mI.x - mD.x) / anchoHombros;
  const manosFrente = mI.y < caderas.y && mD.y < caderas.y;

  return { rodilla, tronco, base, manos, manosFrente };
}

export default function CameraAnalyzer() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const landmarkerRef = useRef(null);
  const rafRef = useRef(null);
  const ultimoUiRef = useRef(0);
  const historialRef = useRef([]);
  const posicionRef = useRef('Delantero');

  const [posicion, setPosicion] = useState('Delantero');
  const [camara, setCamara] = useState('user'); // 'user' = frontal, 'environment' = trasera
  const [estado, setEstado] = useState('inactivo'); // inactivo | cargando | activo | error
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null); // {score, reglas}
  const [promedio, setPromedio] = useState(null);

  useEffect(() => { posicionRef.current = posicion; }, [posicion]);

  const detener = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    const c = canvasRef.current;
    if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
  }, []);

  useEffect(() => () => {
    detener();
    if (landmarkerRef.current) { try { landmarkerRef.current.close(); } catch { /* noop */ } landmarkerRef.current = null; }
  }, [detener]);

  const cargarModelo = async () => {
    if (landmarkerRef.current) return landmarkerRef.current;
    const vision = await import(/* @vite-ignore */ VISION_URL);
    const fileset = await vision.FilesetResolver.forVisionTasks(WASM_URL);
    const opciones = (delegate) => ({
      baseOptions: { modelAssetPath: MODEL_URL, delegate },
      runningMode: 'VIDEO',
      numPoses: 1
    });
    try {
      landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, opciones('GPU'));
    } catch {
      landmarkerRef.current = await vision.PoseLandmarker.createFromOptions(fileset, opciones('CPU'));
    }
    landmarkerRef.current.__vision = vision;
    return landmarkerRef.current;
  };

  const dibujar = (lm, w, h) => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#00FF88';
    CONEXIONES.forEach(([a, b]) => {
      if ((lm[a].visibility ?? 1) < 0.5 || (lm[b].visibility ?? 1) < 0.5) return;
      ctx.beginPath();
      ctx.moveTo(lm[a].x * w, lm[a].y * h);
      ctx.lineTo(lm[b].x * w, lm[b].y * h);
      ctx.stroke();
    });
    ctx.fillStyle = '#FFFFFF';
    [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((i) => {
      if ((lm[i].visibility ?? 1) < 0.5) return;
      ctx.beginPath();
      ctx.arc(lm[i].x * w, lm[i].y * h, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const bucle = () => {
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(bucle);
      return;
    }
    const w = video.videoWidth, h = video.videoHeight;
    const canvas = canvasRef.current;
    if (canvas && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; }

    const res = landmarker.detectForVideo(video, performance.now());
    const lm = res && res.landmarks && res.landmarks[0];

    if (lm) {
      dibujar(lm, w, h);
      const m = calcularMetricas(lm, w, h);
      const ahora = performance.now();
      if (m && ahora - ultimoUiRef.current > 300) {
        ultimoUiRef.current = ahora;
        const reglas = REGLAS[posicionRef.current](m);
        const score = Math.round((reglas.filter((r) => r.ok).length / reglas.length) * 100);
        historialRef.current.push(score);
        if (historialRef.current.length > 200) historialRef.current.shift();
        const h2 = historialRef.current;
        setPromedio(Math.round(h2.reduce((a, b) => a + b, 0) / h2.length));
        setResultado({ score, reglas, visible: true });
      } else if (!m && ahora - ultimoUiRef.current > 300) {
        ultimoUiRef.current = ahora;
        setResultado({ score: 0, reglas: [], visible: false });
      }
    } else {
      const c = canvasRef.current;
      if (c) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    }
    rafRef.current = requestAnimationFrame(bucle);
  };

  const iniciar = async (facing = camara) => {
    setError('');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setEstado('error');
      setError('Tu navegador no permite usar la cámara aquí. Abre la página con https (o localhost) en Chrome, Edge, Safari o Firefox actualizados.');
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
      setEstado('activo');
      rafRef.current = requestAnimationFrame(bucle);
    } catch (e) {
      detener();
      setEstado('error');
      if (e && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')) {
        setError('Permiso de cámara denegado. Pulsa el candado junto a la dirección, permite la cámara y vuelve a intentar.');
      } else if (e && e.name === 'NotFoundError') {
        setError('No se encontró ninguna cámara en este dispositivo.');
      } else {
        setError('No se pudo iniciar el análisis (' + (e && e.message ? e.message : 'error desconocido') + '). Revisa tu conexión: el modelo se descarga la primera vez.');
      }
    }
  };

  const cambiarCamara = () => {
    const nueva = camara === 'user' ? 'environment' : 'user';
    setCamara(nueva);
    if (estado === 'activo') iniciar(nueva);
  };

  const apagar = () => { detener(); setEstado('inactivo'); setResultado(null); };

  const espejo = camara === 'user' ? 'scaleX(-1)' : 'none';
  const color = (s) => (s >= 75 ? '#00FF88' : s >= 40 ? '#FACC15' : '#F87171');
  const tips = resultado && resultado.reglas ? resultado.reglas.filter((r) => !r.ok) : [];

  const btn = (activo) => ({
    padding: '0.6rem 1.1rem', borderRadius: '0.5rem', fontWeight: 800, fontSize: '0.8rem',
    letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
    border: activo ? '1px solid #00FF88' : '1px solid #27272A',
    backgroundColor: activo ? '#00FF88' : '#000000', color: activo ? '#000000' : '#A1A1AA'
  });

  return (
    <section id="ia-camara" style={{ padding: '4rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#18181B', borderRadius: '1.25rem', border: '1px solid rgba(0, 255, 136, 0.25)', padding: '2.5rem' }}>
        <span className="nike-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
          <Camera size={14} color="#00FF88" /> ENTRENADOR CON CÁMARA
        </span>
        <h2 style={{ fontSize: '2.25rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF', margin: '0 0 0.5rem' }}>
          IA que te <span style={{ color: '#00FF88' }}>corrige en vivo</span>
        </h2>
        <p style={{ color: '#A1A1AA', maxWidth: '720px', margin: '0 0 1.5rem' }}>
          Elige tu posición, enciende la cámara y colócate de cuerpo completo a 2–3 metros. La IA detecta tus articulaciones y te dice
          qué corregir mientras te mueves. El video se procesa en tu dispositivo y no se envía a ningún servidor.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {POSICIONES.map((p) => (
            <button key={p} onClick={() => { setPosicion(p); historialRef.current = []; setPromedio(null); }} style={btn(posicion === p)}>{p}</button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          {/* Cámara */}
          <div>
            <div style={{ position: 'relative', backgroundColor: '#000', borderRadius: '0.9rem', overflow: 'hidden', border: '1px solid #27272A', aspectRatio: '4 / 3' }}>
              <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: espejo, display: estado === 'activo' ? 'block' : 'none' }} />
              <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: espejo, display: estado === 'activo' ? 'block' : 'none', pointerEvents: 'none' }} />
              {estado !== 'activo' && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: '#A1A1AA', textAlign: 'center', padding: '1rem' }}>
                  {estado === 'cargando' ? (<><div className="spinner-neon" /><span>Cargando modelo de IA… (la primera vez tarda unos segundos)</span></>) : (<><CameraOff size={40} /><span>Cámara apagada</span></>)}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.9rem', flexWrap: 'wrap' }}>
              {estado !== 'activo' ? (
                <button onClick={() => iniciar()} disabled={estado === 'cargando'} style={{ ...btn(true), display: 'inline-flex', alignItems: 'center', gap: '0.4rem', opacity: estado === 'cargando' ? 0.6 : 1 }}>
                  <Camera size={16} /> Encender cámara
                </button>
              ) : (
                <button onClick={apagar} style={{ ...btn(false), display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CameraOff size={16} /> Apagar
                </button>
              )}
              <button onClick={cambiarCamara} style={{ ...btn(false), display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                <RefreshCw size={16} /> {camara === 'user' ? 'Usar cámara trasera' : 'Usar cámara frontal'}
              </button>
            </div>
            {error && (
              <div style={{ marginTop: '0.9rem', padding: '0.8rem 1rem', borderRadius: '0.6rem', border: '1px solid #F87171', color: '#FCA5A5', fontSize: '0.85rem', display: 'flex', gap: '0.5rem' }}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} /> <span>{error}</span>
              </div>
            )}
          </div>

          {/* Resultados */}
          <div style={{ backgroundColor: '#000', borderRadius: '0.9rem', border: '1px solid #27272A', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#A1A1AA', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              <Activity size={16} color="#00FF88" /> Análisis en vivo · {posicion}
            </div>

            {estado !== 'activo' && <p style={{ color: '#A1A1AA', margin: 0 }}>Enciende la cámara para empezar el análisis.</p>}

            {estado === 'activo' && !resultado && <p style={{ color: '#A1A1AA', margin: 0 }}>Buscando tu cuerpo… colócate de cuerpo completo frente a la cámara.</p>}

            {estado === 'activo' && resultado && !resultado.visible && (
              <p style={{ color: '#FACC15', margin: 0 }}>No te veo completo. Aléjate un poco para que se vean hombros, caderas, rodillas y tobillos.</p>
            )}

            {estado === 'activo' && resultado && resultado.visible && (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 900, color: color(resultado.score), lineHeight: 1 }}>{resultado.score}</span>
                  <span style={{ color: '#A1A1AA' }}>/ 100 puntaje de postura{promedio !== null ? ` · promedio de la sesión: ${promedio}` : ''}</span>
                </div>
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {resultado.reglas.map((r) => (
                    <div key={r.nombre} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', padding: '0.55rem 0.8rem', borderRadius: '0.5rem', backgroundColor: '#18181B', border: `1px solid ${r.ok ? 'rgba(0,255,136,0.35)' : '#3F3F46'}` }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#FFFFFF', fontSize: '0.88rem' }}>
                        {r.ok ? <CheckCircle2 size={16} color="#00FF88" /> : <AlertTriangle size={16} color="#FACC15" />} {r.nombre}
                      </span>
                      <span style={{ color: r.ok ? '#00FF88' : '#FACC15', fontWeight: 700 }}>{r.valor}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '1rem', color: '#E4E4E7', fontSize: '0.9rem' }}>
                  {tips.length === 0 ? (
                    <strong style={{ color: '#00FF88' }}>¡Postura correcta! Mantén la posición.</strong>
                  ) : (
                    <>
                      <strong style={{ color: '#FACC15' }}>Corrige:</strong>
                      <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.1rem' }}>
                        {tips.map((t) => <li key={t.nombre}>{t.tip}</li>)}
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
            <p style={{ color: '#71717A', fontSize: '0.72rem', margin: '1rem 0 0' }}>
              Análisis aproximado de postura con visión por computador. No reemplaza a un entrenador profesional.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}