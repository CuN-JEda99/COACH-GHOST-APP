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

// Autenticación de Admin con JWT
app.post('/api/admin/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === (process.env.ADMIN_USER || 'admin') && pass === (process.env.ADMIN_PASS || 'ghost2024')) {
    const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(Backend COACH GHOST activo en puerto ));
}

module.exports = app;
