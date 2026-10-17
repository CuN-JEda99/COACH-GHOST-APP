import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { MapPin, Phone, CheckCircle, Send, Users, ShieldAlert } from 'lucide-react';

const ESCUELAS_FALLBACK = {
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

export default function ContactForm({ selectedPlan = 'Plan Jugador' }) {
  const [formData, setFormData] = useState({
    nombre: '',
    edad: 18,
    barrio: 'Suba',
    posicion: 'Delantero',
    whatsapp: '',
    plan: selectedPlan
  });

  const [escuelas, setEscuelas] = useState([]);
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  useEffect(() => {
    if (selectedPlan) {
      setFormData(prev => ({ ...prev, plan: selectedPlan }));
    }
  }, [selectedPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/api/contacto', formData);
      if (res.data && res.data.escuelas) {
        setEscuelas(res.data.escuelas);
        setMensajeExito(res.data.mensaje || `¡Registro completado para ${formData.nombre}!`);
      } else {
        setEscuelas(ESCUELAS_FALLBACK[formData.barrio] || ESCUELAS_FALLBACK['Suba']);
        setMensajeExito(`¡Atleta ${formData.nombre} pre-registrado en COACH GHOST!`);
      }
      setEnviado(true);
    } catch (err) {
      console.warn('API local no responde, aplicando match directo:', err.message);
      setEscuelas(ESCUELAS_FALLBACK[formData.barrio] || ESCUELAS_FALLBACK['Suba']);
      setMensajeExito(`¡Registro completado localmente para ${formData.nombre}!`);
      setEnviado(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contacto" style={{
      padding: '4rem 1.5rem',
      maxWidth: '750px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: '#18181B',
        borderRadius: '1.25rem',
        border: '1px solid #27272A',
        padding: '2.5rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span className="nike-badge" style={{ marginBottom: '0.75rem' }}>
            REGISTRO FORMATIVO REAL
          </span>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
            fontWeight: 900,
            textTransform: 'uppercase',
            color: '#FFFFFF',
            margin: '0.5rem 0'
          }}>
            MATCH DE ESCUELAS EN <span style={{ color: '#00FF88' }}>BOGOTÁ</span>
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.9rem', margin: 0 }}>
            Ingresa tus datos y conectaremos tu perfil deportivo con los clubes de fútbol de tu localidad.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
              Nombre Completo del Atleta *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Andrés Camilo Rojas"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: '1px solid #27272A',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
                Edad (14 a 24 años) *
              </label>
              <input
                type="number"
                min="14"
                max="24"
                required
                value={formData.edad}
                onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
                Localidad / Barrio Bogotá *
              </label>
              <select
                value={formData.barrio}
                onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {['Suba', 'Kennedy', 'Engativá', 'Chapinero', 'Bosa', 'Usaquén'].map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
                Posición Principal *
              </label>
              <select
                value={formData.posicion}
                onChange={(e) => setFormData({ ...formData, posicion: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                {['Delantero', 'Defensa', 'Medio', 'Arquero'].map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
                Plan Seleccionado *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  fontSize: '0.95rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              >
                <option value="Plan Jugador">Plan Jugador ($15.000 COP)</option>
                <option value="Plan Escuela">Plan Escuela ($84.900 COP)</option>
                <option value="Plan Familiar">Plan Familiar ($109.900 COP)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.4rem' }}>
              Número de WhatsApp para Notificaciones *
            </label>
            <input
              type="tel"
              required
              placeholder="Ej. 300 123 4567"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: '1px solid #27272A',
                borderRadius: '0.5rem',
                fontSize: '0.95rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="nike-btn-neon"
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {submitting ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner-neon" style={{ width: '18px', height: '18px' }}></span>
                Procesando Match...
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Send size={18} />
                Completar Registro y Ver Escuelas
              </span>
            )}
          </button>
        </form>

        {/* Results Block */}
        {enviado && (
          <div style={{
            marginTop: '2rem',
            padding: '1.75rem',
            backgroundColor: '#000000',
            borderRadius: '0.75rem',
            border: '1px solid #00FF88',
            boxShadow: '0 0 25px rgba(0, 255, 136, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00FF88', marginBottom: '0.75rem' }}>
              <CheckCircle size={22} />
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {mensajeExito}
              </h3>
            </div>
            <p style={{ color: '#D4D4D8', fontSize: '0.88rem', margin: '0 0 1rem' }}>
              Hemos encontrado <strong>{escuelas.length} academias de fútbol</strong> con cupos abiertos para tu categoría en <strong>{formData.barrio}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {escuelas.map((esc, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#18181B',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    border: '1px solid #27272A',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#FFFFFF', fontSize: '0.95rem' }}>
                    <Users size={16} color="#00FF88" />
                    <span>{esc.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.82rem', color: '#A1A1AA' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={14} color="#00FF88" />
                      {esc.telefono}
                    </span>
                    {esc.sede && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} color="#00FF88" />
                        {esc.sede}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
