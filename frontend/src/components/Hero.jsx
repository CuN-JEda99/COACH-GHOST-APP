import React from 'react';
import { Target, MapPin, Award, ArrowRight, Activity, Flame } from 'lucide-react';

export default function Hero({ onStartIA, onExplorePlans }) {
  return (
    <section id="inicio" style={{
      position: 'relative',
      padding: '4.5rem 1.5rem 3.5rem',
      maxWidth: '1200px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {/* Top Banner Tag */}
      <div style={{ display: 'inline-flex', marginBottom: '1.5rem' }}>
        <span className="nike-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <Flame size={14} color="#00FF88" />
          ECOSISTEMA DE ALTO RENDIMIENTO • BOGOTÁ D.C.
        </span>
      </div>

      {/* Main Title */}
      <h1 style={{
        fontSize: 'clamp(2.3rem, 5.5vw, 4.2rem)',
        fontWeight: 900,
        lineHeight: 1.08,
        letterSpacing: '-0.03em',
        textTransform: 'uppercase',
        margin: '0 auto 1.25rem',
        maxWidth: '980px',
        color: '#FFFFFF'
      }}>
        DOMINA EL CAMPO CON <br />
        <span style={{
          color: '#00FF88',
          textShadow: '0 0 35px rgba(0, 255, 136, 0.45)'
        }}>
          INTELIGENCIA BIOMECÁNICA
        </span>
      </h1>

      {/* Subtitle */}
      <p style={{
        fontSize: 'clamp(1rem, 2vw, 1.25rem)',
        color: '#A1A1AA',
        maxWidth: '750px',
        margin: '0 auto 2.25rem',
        lineHeight: 1.6
      }}>
        Optimiza tu técnica posicional con prescripciones biomecánicas avanzadas y 
        conecta con las mejores academias formativas en las localidades de Bogotá.
      </p>

      {/* Badges Comunitarios de Bogotá */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '0.85rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <MapPin size={16} color="#00FF88" />
          <span>+500 Atletas en Bogotá</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <Target size={16} color="#00FF88" />
          <span>6 Localidades Bogotá: Suba, Kennedy, Engativá, Chapinero, Bosa, Usaquén</span>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '9999px',
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          color: '#FFFFFF',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <Award size={16} color="#00FF88" />
          <span>Match Inmediato con Escuelas</span>
        </div>
      </div>

      {/* Call to Actions */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '1rem',
        marginBottom: '3.5rem'
      }}>
        <a
          href="#ia-recomendar"
          onClick={onStartIA}
          className="nike-btn-neon"
          style={{ textDecoration: 'none' }}
        >
          <span>Activar Recomendador IA</span>
          <ArrowRight size={18} />
        </a>

        <a
          href="#catalogo"
          onClick={onExplorePlans}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.85rem 1.75rem',
            borderRadius: '0.5rem',
            backgroundColor: '#18181B',
            color: '#FFFFFF',
            border: '1px solid #3F3F46',
            fontWeight: 700,
            textDecoration: 'none',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
        >
          <span>Explorar Planes COP</span>
        </a>
      </div>

      {/* Stats Quick Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.25rem',
        marginTop: '1rem',
        textAlign: 'left'
      }}>
        <div className="nike-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#00FF88', marginBottom: '0.4rem' }}>
            <Activity size={24} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF' }}>98.4%</div>
          <div style={{ fontSize: '0.85rem', color: '#A1A1AA' }}>Alineación Biomecánica</div>
        </div>

        <div className="nike-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#00FF88', marginBottom: '0.4rem' }}>
            <MapPin size={24} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF' }}>12+ Barrios</div>
          <div style={{ fontSize: '0.85rem', color: '#A1A1AA' }}>Cobertura Total Bogotá</div>
        </div>

        <div className="nike-card" style={{ padding: '1.25rem' }}>
          <div style={{ color: '#00FF88', marginBottom: '0.4rem' }}>
            <Award size={24} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF' }}>$15.000 COP</div>
          <div style={{ fontSize: '0.85rem', color: '#A1A1AA' }}>Plan Atleta Accesible</div>
        </div>
      </div>
    </section>
  );
}
