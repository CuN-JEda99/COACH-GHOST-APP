import React from 'react';
import { Check, Star, Zap } from 'lucide-react';

export default function Pricing({ onSelectPlan }) {
  const planes = [
    {
      id: 'Plan Jugador',
      nombre: 'Plan Jugador',
      precio: '$15.000',
      periodo: 'COP / mes',
      descripcion: 'Para atletas individuales que buscan perfeccionar su biomecánica posicional.',
      destacado: false,
      beneficios: [
        'Acceso completo al recomendador IA',
        'Rutinas de 3 ejercicios por posición',
        'Match con escuelas de tu barrio en Bogotá',
        'Guía biomecánica de alineación articular',
        'Soporte básico por WhatsApp'
      ],
      btnText: 'Seleccionar Jugador'
    },
    {
      id: 'Plan Escuela',
      nombre: 'Plan Escuela',
      precio: '$84.900',
      periodo: 'COP / mes',
      descripcion: 'Para formadores y escuelas de fútbol barriales en Bogotá.',
      destacado: true,
      badge: 'MÁS POPULAR • ÉLITE',
      beneficios: [
        'Hasta 30 perfiles de atletas registrados',
        'Acceso prioritario a matches por localidad',
        'Prescripción biomecánica avanzada para 4 posiciones',
        'Exportación de estadísticas de atletas en CSV',
        'Panel de administración protegido',
        'Asesoría técnica y soporte prioritario'
      ],
      btnText: 'Seleccionar Escuela'
    },
    {
      id: 'Plan Familiar',
      nombre: 'Plan Familiar',
      precio: '$109.900',
      periodo: 'COP / mes',
      descripcion: 'Para familias con varios jóvenes promesas del fútbol.',
      destacado: false,
      beneficios: [
        'Hasta 4 atletas del núcleo familiar',
        'Diagnósticos simultáneos por posición',
        'Match con escuelas de formación de fin de semana',
        'Seguimiento conjunto de evolución',
        'Descuentos en academias aliadas de Bogotá',
        'Soporte VIP personalizado'
      ],
      btnText: 'Seleccionar Familiar'
    }
  ];

  return (
    <section id="catalogo" style={{
      padding: '4rem 1.5rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
        <span className="nike-badge" style={{ marginBottom: '0.75rem' }}>
          CATÁLOGO OFICIAL 2024
        </span>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          margin: '0.5rem 0'
        }}>
          PLANES DE <span style={{ color: '#00FF88' }}>ENTRENAMIENTO</span>
        </h2>
        <p style={{ color: '#A1A1AA', maxWidth: '650px', margin: '0 auto', fontSize: '1rem' }}>
          Precios transparentes en moneda local (COP) sin cláusulas de permanencia.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '2rem',
        alignItems: 'stretch'
      }}>
        {planes.map((p) => (
          <div
            key={p.id}
            className="nike-card"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              backgroundColor: p.destacado ? '#1A211D' : '#18181B',
              borderColor: p.destacado ? '#00FF88' : '#27272A',
              transform: p.destacado ? 'scale(1.02)' : 'none',
              boxShadow: p.destacado ? '0 0 30px rgba(0, 255, 136, 0.15)' : 'none'
            }}
          >
            {p.badge && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#00FF88',
                color: '#000000',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 900,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                whiteSpace: 'nowrap'
              }}>
                <Zap size={14} fill="#000000" />
                {p.badge}
              </div>
            )}

            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 800,
              color: '#FFFFFF',
              margin: '0 0 0.5rem'
            }}>
              {p.nombre}
            </h3>

            <p style={{
              fontSize: '0.88rem',
              color: '#A1A1AA',
              minHeight: '44px',
              margin: '0 0 1.5rem',
              lineHeight: 1.5
            }}>
              {p.descripcion}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.5rem',
              marginBottom: '1.75rem'
            }}>
              <span style={{
                fontSize: '2.5rem',
                fontWeight: 900,
                color: p.destacado ? '#00FF88' : '#FFFFFF',
                letterSpacing: '-0.02em'
              }}>
                {p.precio}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#A1A1AA', fontWeight: 600 }}>
                {p.periodo}
              </span>
            </div>

            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: '0 0 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              flexGrow: 1
            }}>
              {p.beneficios.map((b, idx) => (
                <li key={idx} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.9rem',
                  color: '#D4D4D8'
                }}>
                  <div style={{
                    color: '#00FF88',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => onSelectPlan(p.nombre)}
              className={p.destacado ? 'nike-btn-neon' : ''}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: p.destacado ? '#00FF88' : '#000000',
                color: p.destacado ? '#000000' : '#FFFFFF',
                border: p.destacado ? 'none' : '1px solid #3F3F46'
              }}
            >
              {p.btnText}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
