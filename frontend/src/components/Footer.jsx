import React from 'react';
import { Zap, Heart, Shield } from 'lucide-react';

export default function Footer({ onNavigateAdmin }) {
  return (
    <footer style={{
      borderTop: '1px solid #27272A',
      backgroundColor: '#0A0A0A',
      padding: '3rem 1.5rem 2rem',
      marginTop: '4rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '2rem'
      }}>
        {/* Brand */}
        <div style={{ maxWidth: '350px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '6px',
              backgroundColor: '#00FF88',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000'
            }}>
              <Zap size={18} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', color: '#FFFFFF', letterSpacing: '0.05em' }}>
              COACH <span style={{ color: '#00FF88' }}>GHOST</span>
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#71717A', lineHeight: 1.6, margin: 0 }}>
            Plataforma deportiva Full Stack de alto impacto para escuelas y atletas en Bogotá. Desarrollada con React, Express, MongoDB e IA biomecánica.
          </p>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Secciones</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a href="#inicio" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Inicio</a>
              <a href="#como-funciona" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Metodología</a>
              <a href="#catalogo" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Catálogo de Planes</a>
              <a href="#ia-recomendar" style={{ color: '#A1A1AA', textDecoration: 'none' }}>IA Biomecánica</a>
              <a href="#contacto" style={{ color: '#A1A1AA', textDecoration: 'none' }}>Match en Bogotá</a>
            </div>
          </div>

          <div>
            <div style={{ color: '#FFFFFF', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>Sistema</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={onNavigateAdmin}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#00FF88',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Panel Admin (/admin)
              </button>
              <span style={{ color: '#71717A' }}>API Port: 5000</span>
              <span style={{ color: '#71717A' }}>JWT Token 8h</span>
              <span style={{ color: '#71717A' }}>CUN 2024 / 2026</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto 0',
        paddingTop: '1.5rem',
        borderTop: '1px solid #18181B',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        fontSize: '0.8rem',
        color: '#71717A'
      }}>
        <div>
          © {new Date().getFullYear()} COACH GHOST. Todos los derechos reservados.
        </div>
        <div>
          Inspirado en la estética oficial Nike Training Pro.
        </div>
      </div>
    </footer>
  );
}
