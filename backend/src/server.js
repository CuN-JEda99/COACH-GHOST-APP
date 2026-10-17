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
