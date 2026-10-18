/*
 * COACH GHOST - Lógica de análisis de postura y generación del informe de una jugada.
 * Archivo sin React: recibe los puntos del cuerpo (MediaPipe Pose) y devuelve métricas e informe.
 */

export const POSICIONES = ['Delantero', 'Defensa', 'Medio', 'Arquero'];

// Conexiones del esqueleto (índices de MediaPipe Pose)
export const CONEXIONES = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32]
];
export const PUNTOS_CLAVE = [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28];

const L = { HOMBRO_I: 11, HOMBRO_D: 12, MUNECA_I: 15, MUNECA_D: 16, CADERA_I: 23, CADERA_D: 24, RODILLA_I: 25, RODILLA_D: 26, TOBILLO_I: 27, TOBILLO_D: 28 };

// ---------- Utilidades ----------
export const angulo = (a, b, c) => {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const m = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (!m) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180) / Math.PI;
};

const punto = (lm, i, w, h) => ({ x: lm[i].x * w, y: lm[i].y * h, v: lm[i].visibility ?? 1 });
const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const promedio = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const percentil = (a, p) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(p * (s.length - 1))))];
};
const desviacion = (a) => {
  const m = promedio(a);
  return Math.sqrt(promedio(a.map((x) => (x - m) ** 2)));
};

// ---------- Métricas de un cuadro ----------
export function calcularMetricas(lm, w, h) {
  const P = (i) => punto(lm, i, w, h);
  const hI = P(L.HOMBRO_I), hD = P(L.HOMBRO_D), cI = P(L.CADERA_I), cD = P(L.CADERA_D);
  const rI = P(L.RODILLA_I), rD = P(L.RODILLA_D), tI = P(L.TOBILLO_I), tD = P(L.TOBILLO_D);
  const mI = P(L.MUNECA_I), mD = P(L.MUNECA_D);

  if ([hI, hD, cI, cD, rI, rD, tI, tD].some((p) => p.v < 0.5)) return null; // cuerpo no visible completo

  const rodillaI = angulo(cI, rI, tI);
  const rodillaD = angulo(cD, rD, tD);
  const hombros = medio(hI, hD);
  const caderas = medio(cI, cD);
  const tronco = (Math.atan2(Math.abs(hombros.x - caderas.x), Math.abs(caderas.y - hombros.y)) * 180) / Math.PI;
  const anchoHombros = Math.hypot(hI.x - hD.x, hI.y - hD.y) || 1;
  const torso = Math.hypot(hombros.x - caderas.x, hombros.y - caderas.y) || 1;
  // Escala equivalente al ancho de hombros aunque la persona esté de perfil
  const escala = Math.max(anchoHombros, 0.8 * torso);

  return {
    rodilla: (rodillaI + rodillaD) / 2,
    rodillaI,
    rodillaD,
    tronco,
    base: Math.abs(tI.x - tD.x) / escala,
    manos: Math.abs(mI.x - mD.x) / escala,
    frontal: anchoHombros / torso >= 0.5,
    manosFrente: mI.v >= 0.5 && mD.v >= 0.5 && mI.y < caderas.y && mD.y < caderas.y,
    torso,
    cx: caderas.x,
    cy: caderas.y,
    anchoFirmado: hI.x - hD.x
  };
}

// ---------- Reglas por posición ----------
export const REGLAS = {
  Delantero: (m) => [
    { nombre: 'Flexión de rodillas', ok: m.rodilla >= 120 && m.rodilla <= 160, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 160 ? 'Flexiona más las rodillas para ganar impulso.' : 'Estás demasiado bajo para arrancar; sube un poco.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 5 && m.tronco <= 30, valor: `${m.tronco.toFixed(0)}°`, tip: m.tronco < 5 ? 'Inclina el pecho hacia adelante, sobre el balón.' : 'Estás muy inclinado; mantén el pecho firme.' },
    { nombre: 'Base de apoyo', ok: m.base >= 0.8 && m.base <= 1.6, valor: `${m.base.toFixed(1)}x`, tip: m.base < 0.8 ? 'Separa más los pies (al ancho de hombros).' : 'Pies demasiado abiertos para salir rápido.' }
  ],
  Defensa: (m) => [
    { nombre: 'Centro de gravedad bajo', ok: m.rodilla >= 100 && m.rodilla <= 145, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 145 ? 'Baja la cadera: flexiona más las rodillas.' : 'Demasiado bajo; no podrás reaccionar rápido.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 10 && m.tronco <= 35, valor: `${m.tronco.toFixed(0)}°`, tip: m.tronco < 10 ? 'Inclínate un poco hacia adelante.' : 'Levanta el pecho y mantén la vista en el atacante.' },
    { nombre: 'Base amplia', ok: m.base >= 1.2 && m.base <= 2.2, valor: `${m.base.toFixed(1)}x`, tip: m.base < 1.2 ? 'Abre los pies: necesitas una base más amplia.' : 'Base excesiva; reduce un poco la separación.' }
  ],
  Medio: (m) => [
    { nombre: 'Rodillas listas', ok: m.rodilla >= 135 && m.rodilla <= 165, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 165 ? 'No bloquees las piernas: mantén flexión suave.' : 'Súbete un poco para girar con facilidad.' },
    { nombre: 'Tronco erguido', ok: m.tronco <= 20, valor: `${m.tronco.toFixed(0)}°`, tip: 'Levanta el torso para ver el campo (escaneo 360°).' },
    { nombre: 'Base de apoyo', ok: m.base >= 0.9 && m.base <= 1.6, valor: `${m.base.toFixed(1)}x`, tip: 'Pies al ancho de hombros para orientar el cuerpo.' },
    { nombre: 'Brazos abiertos (equilibrio)', aplica: m.frontal, ok: m.manos >= 1.2, valor: `${m.manos.toFixed(1)}x`, tip: 'Abre un poco los brazos para equilibrar al recibir.' }
  ],
  Arquero: (m) => [
    { nombre: 'Posición base (rodillas)', ok: m.rodilla >= 110 && m.rodilla <= 150, valor: `${m.rodilla.toFixed(0)}°`, tip: m.rodilla > 150 ? 'Flexiona las rodillas: pesa sobre las puntas.' : 'Sube un poco para poder desplazarte.' },
    { nombre: 'Inclinación del tronco', ok: m.tronco >= 10 && m.tronco <= 30, valor: `${m.tronco.toFixed(0)}°`, tip: 'Inclina el pecho hacia el balón, espalda recta.' },
    { nombre: 'Manos al frente', ok: m.manosFrente, valor: m.manosFrente ? 'Sí' : 'No', tip: 'Sube las manos al frente, por encima de la cadera.' },
    { nombre: 'Base de apoyo', ok: m.base >= 1.1 && m.base <= 1.8, valor: `${m.base.toFixed(1)}x`, tip: 'Pies un poco más anchos que los hombros.' }
  ]
};

// Ejercicio sugerido según la regla que más falló
const EJERCICIOS = {
  'Flexión de rodillas': 'Sentadilla con pausa de 2 s (3x10) y saltos al cajón (3x8).',
  'Inclinación del tronco': 'Arranques de 10 m con el pecho sobre las rodillas (6 repeticiones) y planchas (3x30 s).',
  'Base de apoyo': 'Pasos laterales con mini-banda (4x12 por lado), cuidando el ancho de los pies.',
  'Centro de gravedad bajo': 'Desplazamientos defensivos en cuclillas, 4 series de 15 s con pausa de 30 s.',
  'Base amplia': 'Deslizamientos laterales entre conos (5 m), con base más ancha que los hombros.',
  'Rodillas listas': 'Saltitos de pies rápidos sobre el sitio (4x20 s) manteniendo rodillas suaves.',
  'Tronco erguido': 'Pases con escaneo: gira la cabeza antes de recibir, 3 series de 2 min.',
  'Brazos abiertos (equilibrio)': 'Recepciones con giro: abre los brazos al recibir, 3x8 por lado.',
  'Posición base (rodillas)': 'Posición base con desplazamientos cortos de 2 pasos (5x10).',
  'Manos al frente': 'Reacciones con balón de tenis: manos siempre al frente (4x10).'
};

// Puntaje 0-100: porcentaje de reglas aplicables que se cumplen
export const puntuar = (reglas) => {
  const aplicables = reglas.filter((r) => r.aplica !== false);
  if (!aplicables.length) return 0;
  return Math.round((100 * aplicables.filter((r) => r.ok).length) / aplicables.length);
};

const nota = (cond, textoSi, textoNo) => (cond ? textoSi : textoNo);

// ---------- Informe de una jugada ----------
export function generarInforme(posicion, frames, totalFrames) {
  const val = frames.filter((f) => f.m);
  const cobertura = totalFrames ? val.length / totalFrames : 0;
  if (val.length < 8 || cobertura < 0.2) {
    return { ok: false, cobertura: Math.round(cobertura * 100) };
  }

  const duracion = val[val.length - 1].t - val[0].t;
  const scores = val.map((f) => f.score);
  const scoreProm = Math.round(promedio(scores));
  const buenaPct = Math.round((100 * val.filter((f) => f.score >= 75).length) / val.length);

  const positivos = [];
  const mejoras = [];

  // 1) Reglas de postura: porcentaje del tiempo que cada una estuvo bien
  const nReglas = val[0].r.length;
  for (let i = 0; i < nReglas; i++) {
    const nombre = val[0].r[i].nombre;
    const aplicables = val.filter((f) => f.r[i].aplica !== false);
    if (aplicables.length < 5) continue; // no se pudo medir (p. ej. brazos de perfil)
    const ok = aplicables.filter((f) => f.r[i].ok).length;
    const pct = Math.round((100 * ok) / aplicables.length);
    if (pct >= 75) {
      positivos.push({ titulo: nombre, detalle: `Correcto durante el ${pct}% de la jugada.` });
    } else {
      const conteo = {};
      aplicables.forEach((f) => { if (!f.r[i].ok) conteo[f.r[i].tip] = (conteo[f.r[i].tip] || 0) + 1; });
      const tip = Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a])[0] || '';
      mejoras.push({ titulo: nombre, detalle: `Solo estuvo bien el ${pct}% del tiempo. ${tip}`, ejercicio: EJERCICIOS[nombre], prioridad: 100 - pct });
    }
  }

  // 2) Movimiento: se normaliza por el largo del torso para no depender de la distancia a la cámara
  const torsoMed = percentil(val.map((f) => f.m.torso), 0.5) || 1;
  const ts = val.map((f) => f.t);
  const xs = val.map((f) => f.m.cx / torsoMed);
  const ys = val.map((f) => f.m.cy / torsoMed);

  const vel = [];
  for (let i = 0; i < val.length; i++) {
    let j = i + 1;
    while (j < val.length && ts[j] - ts[i] < 0.25) j++;
    if (j < val.length) vel.push(Math.abs(xs[j] - xs[i]) / (ts[j] - ts[i]));
  }
  const vPico = percentil(vel, 0.95);
  const alturaBase = percentil(ys, 0.5);
  const salto = Math.max(0, alturaBase - percentil(ys, 0.05));
  const variacionAltura = desviacion(ys);
  const pctManos = Math.round((100 * val.filter((f) => f.m.manosFrente).length) / val.length);

  const metricas = [
    { label: 'Duración analizada', valor: `${duracion.toFixed(1)} s` },
    { label: 'Rodilla (promedio)', valor: `${promedio(val.map((f) => f.m.rodilla)).toFixed(0)}°` },
    { label: 'Flexión máxima de rodilla', valor: `${Math.min(...val.map((f) => f.m.rodilla)).toFixed(0)}°` },
    { label: 'Tronco (promedio)', valor: `${promedio(val.map((f) => f.m.tronco)).toFixed(0)}°` },
    { label: 'Velocidad pico (relativa)', valor: `${vPico.toFixed(1)} torsos/s` }
  ];

  if (posicion === 'Delantero') {
    metricas.push({ label: 'Arranque', valor: nota(vPico >= 8, 'Explosivo', nota(vPico >= 4, 'Moderado', 'Bajo')) });
    if (vPico < 4) mejoras.push({ titulo: 'Explosividad de arranque', detalle: 'No se aprecia una aceleración fuerte. Si fue una carrera, ataca el balón con más agresividad en los primeros 3 pasos.', ejercicio: 'Arranques de 10 m desde posición base (8 repeticiones, descanso de 45 s).', prioridad: 70 });
    else if (vPico >= 8) positivos.push({ titulo: 'Explosividad de arranque', detalle: 'Se nota una aceleración fuerte en la jugada.' });
    const rapidos = val.filter((f, i) => vel[i] !== undefined && vel[i] >= vPico * 0.6);
    if (rapidos.length >= 5) {
      const t = promedio(rapidos.map((f) => f.m.tronco));
      if (t < 5) mejoras.push({ titulo: 'Inclinación al acelerar', detalle: `Al acelerar corres casi erguido (${t.toFixed(0)}°). Inclina el pecho entre 10° y 30° para empujar mejor.`, ejercicio: 'Trineo o arranques inclinados 6x10 m.', prioridad: 65 });
    }
  }

  if (posicion === 'Defensa') {
    metricas.push({ label: 'Variación de altura', valor: `${(variacionAltura * 100).toFixed(0)}%` });
    if (variacionAltura > 0.15) mejoras.push({ titulo: 'Altura constante de la cadera', detalle: 'Subes y bajas la cadera durante la jugada. Mantén el centro de gravedad bajo y estable al defender.', ejercicio: 'Desplazamientos laterales en cuclillas con balón sobre la espalda (4x20 s).', prioridad: 60 });
    else positivos.push({ titulo: 'Altura constante de la cadera', detalle: 'Mantuviste el centro de gravedad estable.' });
  }

  if (posicion === 'Medio') {
    const ref = percentil(val.map((f) => Math.abs(f.m.anchoFirmado)), 0.95);
    if (ref / torsoMed >= 0.5) {
      let giros = 0, girando = false;
      val.forEach((f) => {
        const c = Math.max(-1, Math.min(1, f.m.anchoFirmado / ref));
        const theta = (Math.acos(c) * 180) / Math.PI;
        if (!girando && theta > 40) { giros++; girando = true; }
        if (girando && theta < 20) girando = false;
      });
      metricas.push({ label: 'Giros de cuerpo detectados', valor: `${giros}` });
      if (duracion >= 4 && giros === 0) mejoras.push({ titulo: 'Escaneo del entorno', detalle: 'No se detectaron giros del cuerpo. Un medio debe revisar su entorno antes de recibir.', ejercicio: 'Pases en triángulo con escaneo obligatorio antes de cada recepción (3x2 min).', prioridad: 55 });
    } else {
      metricas.push({ label: 'Giros de cuerpo', valor: 'Graba de frente para medirlos' });
    }
  }

  if (posicion === 'Arquero') {
    metricas.push({ label: 'Salto máximo (relativo)', valor: `${(salto * 100).toFixed(0)}% del torso` });
    metricas.push({ label: 'Tiempo con manos al frente', valor: `${pctManos}%` });
    if (salto < 0.15 && duracion >= 3) mejoras.push({ titulo: 'Elevación en la salida', detalle: 'Casi no hay elevación. Si fue una salida aérea o una atajada alta, impúlsate con más fuerza.', ejercicio: 'Saltos con balón en mano (4x6) y salidas aéreas con pausa en el punto alto.', prioridad: 50 });
  }

  mejoras.sort((a, b) => b.prioridad - a.prioridad);

  // 3) Serie en el tiempo y momentos clave (suavizado de 5 cuadros)
  const suav = scores.map((_, i) => promedio(scores.slice(Math.max(0, i - 2), i + 3)));
  const iPeor = suav.indexOf(Math.min(...suav));
  const iMejor = suav.indexOf(Math.max(...suav));
  const paso = Math.max(1, Math.ceil(val.length / 120));
  const serie = val.filter((_, i) => i % paso === 0).map((f) => ({ t: f.t, score: f.score }));

  const veredicto = scoreProm >= 80 ? 'Muy buena ejecución' : scoreProm >= 60 ? 'Buena base, con detalles por corregir' : 'Necesitas trabajar la postura';

  return {
    ok: true,
    posicion,
    veredicto,
    duracion,
    cobertura: Math.round(cobertura * 100),
    scoreProm,
    buenaPct,
    positivos,
    mejoras,
    metricas,
    serie,
    peor: { t: val[iPeor].t, score: Math.round(suav[iPeor]) },
    mejor: { t: val[iMejor].t, score: Math.round(suav[iMejor]) }
  };
}