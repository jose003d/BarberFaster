import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

// Formulario modal para registrar un local o actualizar los datos existentes.
export const BarberiaModal = ({ isOpen, onClose, barberiaEditar, onSuccess }) => {
  // Estado del formulario para guardar los datos de la barbería.
  const [form, setForm] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    ciudad: '',
    hora_apertura: '08:00',
    hora_cierre: '20:00'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sincroniza los campos con el local editado o los valores iniciales de alta.
  useEffect(() => {
    if (barberiaEditar) {
      setForm({
        nombre: barberiaEditar.nombre || '',
        direccion: barberiaEditar.direccion || '',
        telefono: barberiaEditar.telefono || '',
        ciudad: barberiaEditar.ciudad || '',
        hora_apertura: barberiaEditar.hora_apertura || '08:00',
        hora_cierre: barberiaEditar.hora_cierre || '20:00'
      });
    } else {
      setForm({
        nombre: '',
        direccion: '',
        telefono: '',
        ciudad: '',
        hora_apertura: '08:00',
        hora_cierre: '20:00'
      });
    }
  }, [barberiaEditar, isOpen]);

  if (!isOpen) return null;

  // Envía el formulario al endpoint correspondiente y notifica el resultado.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = barberiaEditar ? 'barberias/editarb.php' : 'barberias/crearb.php';
    
    const payload = barberiaEditar
      ? { id_barberia: barberiaEditar.id_barberia, ...form }
      : form;

    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: payload
    });

    setLoading(false);

    if (res && res.status !== 'error') {
      onSuccess && onSuccess();
      onClose();
    } else {
      setError(res?.mensaje || 'Error al procesar la barbería.');
    }
  };

  // Presenta los datos del local, horarios de atención y acciones del formulario.
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 9999,
      animation: 'fadeInOverlay 0.25s ease-out forwards'
    }}>
      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUpModal { from { opacity: 0; transform: scale(0.92) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .erp-modal-input {
          width: 100%;
          padding: 10px 14px;
          background-color: #ffffff;
          border: 1px solid #cdcdcf;
          color: #393939;
          border-radius: 2px;
          font-size: 0.95rem;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .erp-modal-input:focus {
          border-color: #147d7d;
          box-shadow: 0 0 0 3px rgba(43, 207, 206, 0.32);
        }
      `}</style>

      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#393939', fontSize: '1.25rem', fontWeight: '400' }}>
            {barberiaEditar ? 'Editar Barbería' : 'Registrar Barbería'}
          </h3>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888' }}>✕</button>
        </div>

        {error && <div style={{ color: '#d9534f', marginBottom: '15px', fontSize: '0.9rem', background: '#fdf7f7', padding: '10px', borderRadius: '6px', border: '1px solid #f5c6cb' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Nombre del Local:</label>
            <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: BarberFaster Central" required className="erp-modal-input" />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Ciudad:</label>
              <input type="text" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} placeholder="Ej: Sonsón" className="erp-modal-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Teléfono:</label>
              <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="Contacto" className="erp-modal-input" />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Dirección:</label>
            <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Ubicación física" className="erp-modal-input" />
          </div>

          {/* ASIGNACIÓN DE HORARIOS */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Hora de Apertura:</label>
              <input type="time" value={form.hora_apertura} onChange={e => setForm({ ...form, hora_apertura: e.target.value })} required className="erp-modal-input" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Hora de Cierre:</label>
              <input type="time" value={form.hora_cierre} onChange={e => setForm({ ...form, hora_cierre: e.target.value })} required className="erp-modal-input" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} disabled={loading} style={{ padding: '10px 18px', background: '#e4e4e4', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Cancelar</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#2bcfce', color: '#393939', border: '2px solid #393939', borderRadius: '2px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-ui)' }}>
              {loading ? 'Guardando...' : (barberiaEditar ? 'Guardar Cambios' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};