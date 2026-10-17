const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());

// Permitir peticiones desde localhost y la URL pública de GitHub Pages
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'https://cun-jeda99.github.io'],
  credentials: true
}));

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(Backend COACH GHOST activo en puerto ));
}

module.exports = app;
