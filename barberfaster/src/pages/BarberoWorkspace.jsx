// src/pages/BarberoWorkspace.jsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

export const BarberoWorkspace = ({ idBarbero }) => {
  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (idBarbero) {
      cargarCitas();
    }
  }, [idBarbero, fecha]);

  const cargarCitas = async () => {
    setLoading(true);
    const res = await apiFetch(`agenda/listar_citas.php?id_barbero=${idBarbero}&fecha=${fecha}`);
    setLoading(false);

    if (res.status === 'success') {
      setCitas(res.datos);
    }
  };

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