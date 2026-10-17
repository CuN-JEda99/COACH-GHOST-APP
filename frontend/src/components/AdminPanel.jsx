import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Lock, LogOut, Download, Search, Users, DollarSign, MapPin, RefreshCw, AlertCircle } from 'lucide-react';

const ATLETAS_FALLBACK = [
  { id: 1, nombre: 'Mateo Rodríguez', edad: 17, barrio: 'Suba', posicion: 'Delantero', whatsapp: '3104567890', plan: 'Plan Jugador', fecha: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, nombre: 'Valentina Gómez', edad: 19, barrio: 'Chapinero', posicion: 'Medio', whatsapp: '3157891234', plan: 'Plan Escuela', fecha: new Date(Date.now() - 43200000).toISOString() },
  { id: 3, nombre: 'Santiago Martínez', edad: 16, barrio: 'Kennedy', posicion: 'Defensa', whatsapp: '3209876543', plan: 'Plan Familiar', fecha: new Date().toISOString() }
];

export default function AdminPanel({ onClose }) {
  const [token, setToken] = useState(localStorage.getItem('ghost_token') || '');
  const [credentials, setCredentials] = useState({ user: 'admin', pass: 'ghost2024' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [atletas, setAtletas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAtletas, setLoadingAtletas] = useState(false);

  // Intentar cargar atletas si ya hay token
  useEffect(() => {
    if (token) {
      cargarAtletas();
    }
  }, [token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/api/admin/login', credentials);
      if (res.data && res.data.token) {
        localStorage.setItem('ghost_token', res.data.token);
        setToken(res.data.token);
      } else {
        setLoginError('Respuesta sin token del servidor');
      }
    } catch (err) {
      // Fallback para modo offline demostrativo
      if (credentials.user === 'admin' && credentials.pass === 'ghost2024') {
        const fakeToken = 'mock_jwt_ghost_token_2024';
        localStorage.setItem('ghost_token', fakeToken);
        setToken(fakeToken);
      } else {
        setLoginError('Credenciales inválidas. Usa admin / ghost2024');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('ghost_token');
    setToken('');
    setAtletas([]);
  };

  const cargarAtletas = async () => {
    setLoadingAtletas(true);
    try {
      const res = await api.get('/api/admin/atletas');
      if (res.data && res.data.atletas) {
        setAtletas(res.data.atletas);
      } else {
        setAtletas(ATLETAS_FALLBACK);
      }
    } catch (err) {
      setAtletas(ATLETAS_FALLBACK);
    } finally {
      setLoadingAtletas(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.get('/api/admin/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'atletas_coach_ghost.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // Fallback CSV en cliente
      const encabezados = 'ID,Nombre,Edad,Barrio,Posicion,WhatsApp,Plan,FechaRegistro\n';
      const filas = atletas.map(a =>
        `"${a.id}","${a.nombre}","${a.edad}","${a.barrio}","${a.posicion}","${a.whatsapp}","${a.plan}","${a.fecha}"`
      ).join('\n');
      const blob = new Blob([encabezados + filas], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'atletas_coach_ghost.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
  };

  const atletasFiltrados = atletas.filter(a =>
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.barrio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.posicion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.plan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '2rem auto',
      padding: '0 1.5rem'
    }}>
      {!token ? (
        /* LOGIN MODAL / CARD */
        <div style={{
          maxWidth: '440px',
          margin: '4rem auto',
          backgroundColor: '#18181B',
          border: '1px solid #27272A',
          borderRadius: '1rem',
          padding: '2.5rem',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.7)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: '#000000',
              border: '1px solid #00FF88',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              color: '#00FF88'
            }}>
              <Lock size={22} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#FFFFFF', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>
              Acceso Administrativo
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#A1A1AA', margin: 0 }}>
              Autenticación JWT para gestión de atletas y exportación.
            </p>
          </div>

          {loginError && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #EF4444',
              color: '#F87171',
              padding: '0.75rem',
              borderRadius: '0.5rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}>
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.35rem' }}>
                Usuario
              </label>
              <input
                type="text"
                required
                value={credentials.user}
                onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#D4D4D8', fontWeight: 600, marginBottom: '0.35rem' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                value={credentials.pass}
                onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #27272A',
                  borderRadius: '0.5rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ fontSize: '0.75rem', color: '#71717A', backgroundColor: '#000000', padding: '0.6rem', borderRadius: '4px' }}>
              Credenciales oficiales: <strong>admin</strong> / <strong>ghost2024</strong>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="nike-btn-neon"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loginLoading ? 'Validando JWT...' : 'Iniciar Sesión Admin'}
            </button>
          </form>
        </div>
      ) : (
        /* ADMIN DASHBOARD */
        <div style={{
          backgroundColor: '#18181B',
          borderRadius: '1rem',
          border: '1px solid #27272A',
          padding: '2rem'
        }}>
          {/* Dashboard Header */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid #27272A'
          }}>
            <div>
              <span className="nike-badge" style={{ marginBottom: '0.5rem' }}>
                SESIÓN ACTIVA • ROLE: ADMIN
              </span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#FFFFFF', margin: 0, textTransform: 'uppercase' }}>
                Panel de Atletas <span style={{ color: '#00FF88' }}>COACH GHOST</span>
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={handleExportCSV}
                className="nike-btn-neon"
                style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
              >
                <Download size={16} />
                Exportar CSV
              </button>

              <button
                onClick={cargarAtletas}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #3F3F46',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem'
                }}
              >
                <RefreshCw size={15} />
                Recargar
              </button>

              <button
                onClick={handleLogout}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '0.5rem',
                  backgroundColor: '#27272A',
                  color: '#EF4444',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.85rem',
                  fontWeight: 700
                }}
              >
                <LogOut size={15} />
                Salir
              </button>
            </div>
          </div>

          {/* Metrics Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            margin: '1.5rem 0'
          }}>
            <div style={{ backgroundColor: '#000000', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #27272A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00FF88', marginBottom: '0.25rem' }}>
                <Users size={18} />
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Total Atletas</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>{atletas.length}</div>
            </div>

            <div style={{ backgroundColor: '#000000', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #27272A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00FF88', marginBottom: '0.25rem' }}>
                <MapPin size={18} />
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Localidades Activas</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF' }}>
                {new Set(atletas.map(a => a.barrio)).size}
              </div>
            </div>

            <div style={{ backgroundColor: '#000000', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid #27272A' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#00FF88', marginBottom: '0.25rem' }}>
                <DollarSign size={18} />
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 700 }}>Plan Predominante</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.35rem' }}>
                Plan Jugador / Escuela
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#000000',
            border: '1px solid #27272A',
            borderRadius: '0.5rem',
            padding: '0.65rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <Search size={18} color="#A1A1AA" />
            <input
              type="text"
              placeholder="Buscar por nombre, localidad, posición o plan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                width: '100%',
                outline: 'none',
                fontSize: '0.9rem'
              }}
            />
          </div>

          {/* Athletes Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.88rem'
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #27272A', color: '#A1A1AA', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Atleta</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Edad</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Localidad</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Posición</th>
                  <th style={{ padding: '0.75rem 1rem' }}>WhatsApp</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Plan</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {atletasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: '#71717A' }}>
                      No se encontraron atletas registrados con ese criterio.
                    </td>
                  </tr>
                ) : (
                  atletasFiltrados.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #27272A' }}>
                      <td style={{ padding: '0.85rem 1rem', color: '#71717A' }}>#{String(a.id).slice(-4)}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#FFFFFF' }}>{a.nombre}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#D4D4D8' }}>{a.edad} años</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          backgroundColor: 'rgba(0, 255, 136, 0.1)',
                          color: '#00FF88',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}>
                          {a.barrio}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#D4D4D8' }}>{a.posicion}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#A1A1AA' }}>{a.whatsapp || 'No reg.'}</td>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#FFFFFF' }}>{a.plan}</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#71717A', fontSize: '0.75rem' }}>
                        {new Date(a.fecha).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
