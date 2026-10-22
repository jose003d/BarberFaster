// src/pages/BarberoWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

// Lee la identidad demo del barbero sin romper la vista si el JSON está dañado.
function getStoredBarberoId() {
  const stored = localStorage.getItem('barbero_demo_sesion');
  if (!stored) return null;

  try {
    return JSON.parse(stored)?.id_barbero || null;
  } catch (error) {
    console.error('No se pudo leer la sesión demo del barbero:', error);
    return null;
  }
}

// Muestra la agenda diaria del barbero y refresca sus citas periódicamente.
export const BarberoWorkspace = ({ idBarbero }) => {
  // Resuelve el barbero activo desde la sesión demo si la ruta no pasa un ID.
  const idBarberoActivo = idBarbero || getStoredBarberoId();
  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().slice(0, 10);
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consulta las citas al abrir, al cambiar el día y cada 15 segundos.
  useEffect(() => {
    if (!idBarberoActivo) {
      setError('No se encontró el identificador del barbero activo.');
      setLoading(false);
      return undefined;
    }

    let mounted = true;
    const cargarCitas = async () => {
      try {
        const res = await apiFetch(
          `citas/listar_barbero_perfil.php?id_barbero=${idBarberoActivo}`,
          { cache: 'no-store' }
        );
        if (res.status !== 'success' || !Array.isArray(res.datos)) {
          throw new Error(res.mensaje || 'No se pudieron cargar las citas.');
        }
        if (mounted) {
          setCitas(res.datos.filter((cita) => cita.fecha === fecha));
          setError('');
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message || 'No se pudieron cargar las citas.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    setLoading(true);
    cargarCitas();
    const intervalId = window.setInterval(cargarCitas, 15000);
    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, [idBarberoActivo, fecha]);

  // Presenta la agenda y deja sus acciones en pausa hasta validar la sesión.
  return (
    <div className="workspace-container">
      <header className="workspace-header">
        <h2>Mi Agenda</h2>
        <input 
          type="date" 
          value={fecha} 
          onChange={e => setFecha(e.target.value)} 
        />
      </header>

      <p className="appointment-readonly-notice">
        Las acciones para cancelar, reagendar o completar estarán disponibles cuando se configure la autenticación segura del barbero.
      </p>
      {error && <p className="status error" role="alert">{error}</p>}

      {loading ? (
        <p>Cargando citas...</p>
      ) : (
        <table className="tabla-citas">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Servicios</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {citas.length === 0 ? (
              <tr><td colSpan="3" style={{ textAlign: 'center' }}>No hay citas agendadas para este día.</td></tr>
            ) : (
              citas.map(c => (
                <tr key={c.id_cita} className={`estado-${c.estado.toLowerCase()}`}>
                  <td>{c.hora_inicio.substring(0, 5)} - {c.hora_fin.substring(0, 5)}</td>
                  <td>{c.servicios || 'General'}</td>
                  <td><span className={`badge ${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};