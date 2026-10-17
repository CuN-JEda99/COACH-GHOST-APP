import React from 'react';
import { Cpu, Compass, Trophy } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      icon: <Cpu size={28} color="#00FF88" />,
      titulo: 'Diagnóstico Biomecánico IA',
      descripcion: 'Selecciona tu posición en cancha. Nuestro motor de IA prescribe los 3 ejercicios clave con intensidades y correcciones biomecánicas de élite.'
    },
    {
      num: '02',
      icon: <Compass size={28} color="#00FF88" />,
      titulo: 'Match Local en Bogotá',
      descripcion: 'Registra tu barrio (Suba, Kennedy, Chapinero, etc.) y conecta al instante con academias y escuelas de fútbol avaladas en tu sector.'
    },
    {
      num: '03',
      icon: <Trophy size={28} color="#00FF88" />,
      titulo: 'Evolución y Rendimiento Nike',
      descripcion: 'Adquiere tu plan mensual adaptado a tus metas deportivas y acelera tu transición hacia el fútbol formativo de alto impacto.'
    }
  ];

  return (
    <section id="como-funciona" style={{
      padding: '4rem 1.5rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span className="nike-badge" style={{ marginBottom: '0.75rem' }}>
          METODOLOGÍA DEPORTIVA
        </span>
        <h2 style={{
          fontSize: 'clamp(2rem, 4vw, 2.75rem)',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '-0.02em',
          color: '#FFFFFF',
          margin: '0.5rem 0'
        }}>
          ¿CÓMO FUNCIONA <span style={{ color: '#00FF88' }}>COACH GHOST</span>?
        </h2>
        <p style={{ color: '#A1A1AA', maxWidth: '650px', margin: '0 auto', fontSize: '1rem' }}>
          Un sistema de tres fases diseñado para transformar el talento barrial de Bogotá en rendimiento futbolístico profesional.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem'
      }}>
        {steps.map((st, i) => (
          <div
            key={i}
            className="nike-card"
            style={{
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Background Step Number */}
            <span style={{
              position: 'absolute',
              top: '1rem',
              right: '1.25rem',
              fontSize: '3.5rem',
              fontWeight: 900,
              color: 'rgba(255, 255, 255, 0.05)',
              userSelect: 'none'
            }}>
              {st.num}
            </span>

            <div style={{
              width: '54px',
              height: '54px',
              borderRadius: '12px',
              backgroundColor: '#000000',
              border: '1px solid #27272A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem'
            }}>
              {st.icon}
            </div>

            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#FFFFFF',
              marginBottom: '0.75rem',
              textTransform: 'uppercase'
            }}>
              {st.titulo}
            </h3>

            <p style={{
              fontSize: '0.95rem',
              color: '#A1A1AA',
              lineHeight: 1.6,
              margin: 0
            }}>
              {st.descripcion}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
