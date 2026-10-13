// src/pages/BarberoWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

// Muestra la agenda diaria del barbero y permite actualizar el estado de sus citas.
export const BarberoWorkspace = ({ idBarbero }) => {
  // Recarga las citas cuando cambia el barbero o la fecha seleccionada.
  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (idBarbero) {
      cargarCitas();
    }
  }, [idBarbero, fecha]);

  // Obtiene las citas asignadas al barbero para el día elegido.
  const cargarCitas = async () => {
    setLoading(true);
    const res = await apiFetch(`agenda/listar_citas.php?id_barbero=${idBarbero}&fecha=${fecha}`);
    setLoading(false);

    if (res.status === 'success') {
      setCitas(res.datos);
    }
  };

  // Marca la cita como completada o cancelada y actualiza la tabla al tener éxito.
  const cambiarEstado = async (idCita, nuevoEstado) => {
    const endpoint = nuevoEstado === 'COMPLETADA' ? 'citas/completar.php' : 'citas/cancelar.php';
    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: { id_cita: idCita }
    });

    if (res.status === 'success') {
      cargarCitas();
    }
  };

  // Presenta el selector de fecha, el estado de carga y la tabla de citas.
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

      {loading ? (
        <p>Cargando citas...</p>
      ) : (
        <table className="tabla-citas">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Servicios</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No hay citas agendadas para este día.</td>
              </tr>
            ) : (
              citas.map(c => (
                <tr key={c.id_cita} className={`estado-${c.estado.toLowerCase()}`}>
                  <td>{c.hora_inicio.substring(0, 5)} - {c.hora_fin.substring(0, 5)}</td>
                  <td>{c.nombre_cliente}</td>
                  <td>{c.telefono_cliente}</td>
                  <td>{c.servicios_nombres || 'General'}</td>
                  <td>${parseFloat(c.precio_total).toLocaleString()}</td>
                  <td><span className={`badge ${c.estado.toLowerCase()}`}>{c.estado}</span></td>
                  <td>
                    {c.estado === 'PENDIENTE' && (
                      <>
                        <button onClick={() => cambiarEstado(c.id_cita, 'COMPLETADA')} className="btn-success">Finalizar</button>
                        <button onClick={() => cambiarEstado(c.id_cita, 'CANCELADA')} className="btn-danger">Cancelar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};