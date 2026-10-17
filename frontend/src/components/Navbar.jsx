import React, { useState } from 'react';
import { Zap, Shield, Menu, X, Lock } from 'lucide-react';

export default function Navbar({ onNavigateAdmin, onNavigateHome, isAdminView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.92)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #27272A'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand / Logo */}
        <div 
          onClick={onNavigateHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer'
          }}
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            backgroundColor: '#00FF88',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000000',
            fontWeight: 900
          }}>
            <Zap size={22} strokeWidth={2.5} />
          </div>
          <div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#FFFFFF'
            }}>
              COACH <span style={{ color: '#00FF88' }}>GHOST</span>
            </span>
            <div style={{ fontSize: '0.65rem', color: '#A1A1AA', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              High Performance Football
            </div>
          </div>
        </div>

        {/* Desktop Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2rem'
        }} className="desktop-nav">
          <a href="#inicio" onClick={onNavigateHome} style={{ color: '#FFFFFF', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Inicio</a>
          <a href="#como-funciona" onClick={onNavigateHome} style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Cómo Funciona</a>
          <a href="#catalogo" onClick={onNavigateHome} style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Planes</a>
          <a href="#ia-recomendar" onClick={onNavigateHome} style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>IA Biomecánica</a>
          <a href="#contacto" onClick={onNavigateHome} style={{ color: '#A1A1AA', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Match Escuelas</a>

          <button
            onClick={isAdminView ? onNavigateHome : onNavigateAdmin}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: isAdminView ? '1px solid #00FF88' : '1px solid #3F3F46',
              backgroundColor: isAdminView ? '#00FF88' : '#18181B',
              color: isAdminView ? '#000000' : '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Lock size={15} />
            {isAdminView ? 'Ver Plataforma' : 'Panel Admin'}
          </button>
        </nav>

        {/* Mobile Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="mobile-toggle"
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'none'
          }}
          aria-label="Abrir menú"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div style={{
          backgroundColor: '#18181B',
          borderTop: '1px solid #27272A',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <a href="#inicio" onClick={() => { onNavigateHome(); setMenuOpen(false); }} style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 600 }}>Inicio</a>
          <a href="#como-funciona" onClick={() => { onNavigateHome(); setMenuOpen(false); }} style={{ color: '#A1A1AA', textDecoration: 'none', fontWeight: 600 }}>Cómo Funciona</a>
          <a href="#catalogo" onClick={() => { onNavigateHome(); setMenuOpen(false); }} style={{ color: '#A1A1AA', textDecoration: 'none', fontWeight: 600 }}>Planes</a>
          <a href="#ia-recomendar" onClick={() => { onNavigateHome(); setMenuOpen(false); }} style={{ color: '#A1A1AA', textDecoration: 'none', fontWeight: 600 }}>IA Biomecánica</a>
          <a href="#contacto" onClick={() => { onNavigateHome(); setMenuOpen(false); }} style={{ color: '#A1A1AA', textDecoration: 'none', fontWeight: 600 }}>Match Escuelas</a>
          <button
            onClick={() => {
              if (isAdminView) onNavigateHome(); else onNavigateAdmin();
              setMenuOpen(false);
            }}
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              backgroundColor: '#00FF88',
              color: '#000000',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Lock size={16} />
            {isAdminView ? 'Volver al Inicio' : 'Acceso Admin (/admin)'}
          </button>
        </div>
      )}
    </header>
  );
}
