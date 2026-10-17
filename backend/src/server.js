const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Permitir peticiones desde localhost y la URL pública de GitHub Pages
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://cun-jeda99.github.io'],
  credentials: true
}));

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_ghost2024';

// Base de datos en memoria para atletas registrados con datos iniciales
const atletasRegistrados = [
  {
    id: 1,
    nombre: 'Mateo Rodríguez',
    edad: 17,
    barrio: 'Suba',
    posicion: 'Delantero',
    whatsapp: '3104567890',
    plan: 'Plan Jugador',
    fecha: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 2,
    nombre: 'Valentina Gómez',
    edad: 19,
    barrio: 'Chapinero',
    posicion: 'Medio',
    whatsapp: '3157891234',
    plan: 'Plan Escuela',
    fecha: new Date(Date.now() - 43200000).toISOString()
  },
  {
    id: 3,
    nombre: 'Santiago Martínez',
    edad: 16,
    barrio: 'Kennedy',
    posicion: 'Defensa',
    whatsapp: '3209876543',
    plan: 'Plan Familiar',
    fecha: new Date().toISOString()
  }
];

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Token no proporcionado' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token inválido o expirado' });
  }
};

// Endpoint de la IA: Recomendador Deportivo por Posición
app.post('/api/ia/recomendar', (req, res) => {
  const { posicion } = req.body;
  const ejerciciosMap = {
    Delantero: [
      { nombre: 'Primer toque en carrera', descripcion: 'Control orientado con tiro cruzado', intensidad: 'Alta', series: '4x8 reps', clave: 'Codo alineado' },
      { nombre: '1v1 con recorte', descripcion: 'Desborde hacia el perfil hábil', intensidad: 'Máxima', series: '5x5 reps', clave: 'Impulso de rodilla' },
      { nombre: 'Volea de sobrepique', descripcion: 'Impacto en punto máximo de bote', intensidad: 'Media-Alta', series: '3x10 reps', clave: 'Postura fija' }
    ],
    Defensa: [
      { nombre: 'Retardo en 1v1', descripcion: 'Perfilamiento defensivo y cierre de carril', intensidad: 'Alta', series: '4x6 reps', clave: 'Centro de gravedad bajo' },
      { nombre: 'Anticipación de espaldas', descripcion: 'Paso de ataque ante pase filtrado', intensidad: 'Alta', series: '5x5 reps', clave: 'Reacción rápida' },
      { nombre: 'Cobertura escalonada', descripcion: 'Relevo con perfil de despeje', intensidad: 'Media', series: '4x8 reps', clave: 'Visión 360' }
    ],
    Medio: [
      { nombre: 'Head-check 360°', descripcion: 'Escanear entorno antes de recibir', intensidad: 'Alta', series: '4x10 reps', clave: 'Giro de cabeza' },
      { nombre: 'Cambio de orientación', descripcion: 'Pase largo hacia banda opuesta', intensidad: 'Media', series: '4x8 reps', clave: 'Empeine limpio' },
      { nombre: 'Presión tras pérdida', descripcion: 'Acoso de 3 segundos post-error', intensidad: 'Máxima', series: '6x5 reps', clave: 'Sprint inmediato' }
    ],
    Arquero: [
      { nombre: 'Doble remate a quemarropa', descripcion: 'Bloqueo inicial y reincorporación', intensidad: 'Máxima', series: '5x4 reps', clave: 'Manos firmes' },
      { nombre: 'Achique en cruz', descripcion: 'Reducción de ángulo en mano a mano', intensidad: 'Alta', series: '4x6 reps', clave: 'Caída controlada' },
      { nombre: 'Salida aérea en córner', descripcion: 'Atrape en punto más alto', intensidad: 'Alta', series: '4x8 reps', clave: 'Salto unipodal' }
    ]
  };

  res.json({ posicion, ejercicios: ejerciciosMap[posicion] || ejerciciosMap['Delantero'] });
});

// Endpoint de Contacto con Match de Escuelas por Barrio
app.post('/api/contacto', (req, res) => {
  const { nombre, edad, barrio, posicion, whatsapp, plan } = req.body;
  
  const nuevoAtleta = {
    id: Date.now(),
    nombre: nombre || 'Atleta Sin Nombre',
    edad: Number(edad) || 18,
    barrio: barrio || 'Suba',
    posicion: posicion || 'Delantero',
    whatsapp: whatsapp || '',
    plan: plan || 'Plan Jugador',
    fecha: new Date().toISOString()
  };
  atletasRegistrados.unshift(nuevoAtleta);

  const escuelasPorBarrio = {
    Suba: [
      { nombre: 'Escuela Deportivo Suba Tibabuyes', telefono: '300 123 4567', sede: 'Parque Mirador Suba' },
      { nombre: 'Academia Talentos Suba Rincón', telefono: '311 987 6543', sede: 'Canchas La Gaitana' }
    ],
    Kennedy: [
      { nombre: 'Club Deportivo Roma Kennedy', telefono: '312 456 7890', sede: 'Parque Timiza' },
      { nombre: 'Academia Duros del Balón Kennedy', telefono: '318 654 3210', sede: 'Parque Bellavista' }
    ],
    Engativá: [
      { nombre: 'Escuela Real Engativá', telefono: '314 555 1234', sede: 'Parque San Andrés' },
      { nombre: 'Club Formativo Álamos Norte', telefono: '316 777 8899', sede: 'Canchas El Salitre' }
    ],
    Chapinero: [
      { nombre: 'Academia Élite Chapinero Alto', telefono: '301 222 3344', sede: 'Canchas Calle 63' },
      { nombre: 'Club Deportivo Javeriano', telefono: '310 999 0011', sede: 'Parque Nacional' }
    ],
    Bosa: [
      { nombre: 'Semillero Bosa Carbonell', telefono: '315 444 3322', sede: 'Parque Zonal Bosa' },
      { nombre: 'Academia Fortaleza Bosa', telefono: '321 888 7766', sede: 'Canchas Porvenir' }
    ],
    Usaquén: [
      { nombre: 'Club Deportivo Usaquén Norte', telefono: '317 333 2211', sede: 'Parque Country Club' },
      { nombre: 'Academia Cantera Cedritos', telefono: '302 444 5566', sede: 'Canchas Calle 140' }
    ]
  };

  const escuelas = escuelasPorBarrio[barrio] || [
    { nombre: Escuela Deportivo , telefono: '300 123 4567', sede: 'Sede Principal Bogotá' },
    { nombre: Academia Talentos , telefono: '311 987 6543', sede: 'Centro de Alto Rendimiento' }
  ];

  res.json({
    success: true,
    mensaje: Cliente  registrado exitosamente,
    escuelas,
    atleta: nuevoAtleta
  });
});

// Autenticación de Admin con JWT
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === (process.env.ADMIN_USER || 'admin') && pass === (process.env.ADMIN_PASS || 'ghost2024')) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

// Obtener listado de atletas (Protegido con JWT)
app.get('/api/admin/atletas', verificarToken, (req, res) => {
  res.json({ success: true, total: atletasRegistrados.length, atletas: atletasRegistrados });
});

// Exportar atletas a CSV (Protegido con JWT)
app.get('/api/admin/export-csv', verificarToken, (req, res) => {
  const encabezados = 'ID,Nombre,Edad,Barrio,Posicion,WhatsApp,Plan,FechaRegistro\n';
  const filas = atletasRegistrados.map(a => 
    "","","","","","","",""
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="atletas_coach_ghost.csv"');
  res.send(encabezados + filas);
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(Backend COACH GHOST activo en puerto ));
}

module.exports = app;
