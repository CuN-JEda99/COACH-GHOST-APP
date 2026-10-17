import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Cpu, Zap, Activity, CheckCircle2 } from 'lucide-react';

const POSICIONES = ['Delantero', 'Defensa', 'Medio', 'Arquero'];

// Datos locales de respaldo en caso de que el backend esté temporalmente apagado
const EJERCICIOS_FALLBACK = {
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

export default function IaRecommender() {
  const [posicion, setPosicion] = useState('Delantero');
  const [ejercicios, setEjercicios] = useState(EJERCICIOS_FALLBACK['Delantero']);
  const [loading, setLoading] = useState(false);

  const consultarIa = async (pos) => {
    setPosicion(pos);
    setLoading(true);
    try {
      const res = await api.post('/api/ia/recomendar', { posicion: pos });
      if (res.data && res.data.ejercicios && res.data.ejercicios.length > 0) {
        setEjercicios(res.data.ejercicios);
      } else {
        setEjercicios(EJERCICIOS_FALLBACK[pos] || EJERCICIOS_FALLBACK['Delantero']);
      }
    } catch (err) {
      console.warn('API no disponible localmente, utilizando motor biomecánico cliente:', err.message);
      setEjercicios(EJERCICIOS_FALLBACK[pos] || EJERCICIOS_FALLBACK['Delantero']);
    } finally {
      setTimeout(() => setLoading(false), 250);
    }
  };

  useEffect(() => {
    consultarIa('Delantero');
  }, []);

  return (
    <section id="ia-recomendar" style={{
      padding: '4rem 1.5rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        backgroundColor: '#18181B',
        borderRadius: '1.25rem',
        border: '1px solid rgba(0, 255, 136, 0.25)',
        padding: '2.5rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', marginBottom: '0.75rem' }}>
            <span className="nike-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Cpu size={14} color="#00FF88" />
              MOTOR BIOMECÁNICO NEURONAL
            </span>
          </div>
          <h2 style={{
            fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
            fontWeight: 900,
            color: '#FFFFFF',
            margin: '0 0 0.5rem',
            textTransform: 'uppercase'
          }}>
            IA RECOMENDADOR <span style={{ color: '#00FF88' }}>DEPORTIVO</span>
          </h2>
          <p style={{ color: '#A1A1AA', fontSize: '0.95rem', margin: 0, maxWidth: '700px' }}>
            Selecciona tu demarcación en el terreno de juego. El algoritmo prescribirá 3 ejercicios biomecánicos con carga neuromuscular adaptada.
          </p>
        </div>

        {/* Position Selectors */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '2rem'
        }}>
          {POSICIONES.map((p) => {
            const activo = posicion === p;
            return (
              <button
                key={p}
                onClick={() => consultarIa(p)}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: activo ? '#00FF88' : '#000000',
                  color: activo ? '#000000' : '#A1A1AA',
                  border: activo ? '1px solid #00FF88' : '1px solid #27272A',
                  boxShadow: activo ? '0 0 15px rgba(0, 255, 136, 0.3)' : 'none'
                }}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Drill Cards */}
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4rem 1rem',
            gap: '1rem'
          }}>
            <div className="spinner-neon"></div>
            <span style={{ color: '#A1A1AA', fontSize: '0.85rem', fontWeight: 600 }}>
              Calculando vector biomecánico para {posicion}...
            </span>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {ejercicios.map((ej, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#000000',
                  borderRadius: '0.75rem',
                  border: '1px solid #27272A',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'border-color 0.2s ease'
                }}
              >
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: ej.intensidad === 'Máxima' ? '#FF453A' : '#00FF88',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      textTransform: 'uppercase'
                    }}>
                      ⚡ Intensidad: {ej.intensidad}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#71717A', fontWeight: 600 }}>
                      {ej.series}
                    </span>
                  </div>

                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                    margin: '0 0 0.5rem'
                  }}>
                    {ej.nombre}
                  </h3>

                  <p style={{
                    fontSize: '0.9rem',
                    color: '#A1A1AA',
                    lineHeight: 1.5,
                    margin: '0 0 1.25rem'
                  }}>
                    {ej.descripcion}
                  </p>
                </div>

                <div style={{
                  paddingTop: '0.85rem',
                  borderTop: '1px solid #18181B',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.82rem',
                  color: '#00FF88',
                  fontWeight: 600
                }}>
                  <CheckCircle2 size={16} />
                  <span>Clave Biomecánica: <strong style={{ color: '#FFFFFF' }}>{ej.clave}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
