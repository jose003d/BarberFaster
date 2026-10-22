// src/components/ClienteModal.jsx
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';

// Formulario modal para registrar un cliente o actualizar sus datos de contacto.
export const ClienteModal = ({ isOpen, onClose, clienteEditar, onSuccess }) => {
  // Conserva los campos del cliente junto con los estados de envío y error.
  const [form, setForm] = useState({
    dni: '',
    nombre: '',
    apellido: '',
    telefono: '',
    correo: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Precarga los datos seleccionados para editar o limpia el formulario para alta.
  useEffect(() => {
    if (clienteEditar) {
      setForm({
        dni: clienteEditar.dni || clienteEditar.id_cliente || '',
        nombre: clienteEditar.nombre || '',
        apellido: clienteEditar.apellido || '',
        telefono: clienteEditar.telefono || '',
        correo: clienteEditar.correo || ''
      });
    } else {
      setForm({ 
        dni: '', 
        nombre: '', 
        apellido: '', 
        telefono: '', 
        correo: '' 
      });
    }
  }, [clienteEditar, isOpen]);

  if (!isOpen) return null;

  // Envía los datos al endpoint de creación o actualización del cliente.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = clienteEditar ? 'clientes/editarc.php' : 'clientes/crearc.php';
    
    const payload = {
      dni: form.dni,
      nombre: form.nombre,
      apellido: form.apellido,
      telefono: form.telefono,
      correo: form.correo
    };

    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: payload
    });

    setLoading(false);

    if (res && res.status !== 'error') {
      onSuccess && onSuccess();
      onClose();
    } else {
      setError(res?.mensaje || 'Error al procesar el cliente.');
    }
  };

  // Dibuja el modal con los campos de identidad y contacto del cliente.
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
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpModal {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
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
        .erp-modal-input:disabled {
          background-color: #1f1f1f;
          color: #888;
          cursor: not-allowed;
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
            {clienteEditar ? 'Editar Cliente' : 'Registrar Cliente'}
          </h3>
          <button 
            type="button" 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#888', padding: '4px' }}
          >
            ✕
          </button>
        </div>

        {error && <div style={{ color: '#d9534f', marginBottom: '15px', fontSize: '0.9rem', background: '#fdf7f7', padding: '10px', borderRadius: '6px', border: '1px solid #f5c6cb' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>DNI / Cédula (Clave Principal):</label>
            <input 
              type="text" 
              value={form.dni} 
              onChange={e => setForm({ ...form, dni: e.target.value })} 
              placeholder="Número de documento único"
              required 
              disabled={Boolean(clienteEditar)}
              className="erp-modal-input"
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Nombre:</label>
              <input 
                type="text" 
                value={form.nombre} 
                onChange={e => setForm({ ...form, nombre: e.target.value })} 
                placeholder="Nombre"
                required 
                className="erp-modal-input"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Apellido:</label>
              <input 
                type="text" 
                value={form.apellido} 
                onChange={e => setForm({ ...form, apellido: e.target.value })} 
                placeholder="Apellido"
                className="erp-modal-input"
              />
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Teléfono:</label>
            <input 
              type="text" 
              value={form.telefono} 
              onChange={e => setForm({ ...form, telefono: e.target.value })} 
              placeholder="Número de contacto"
              className="erp-modal-input"
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.85rem' }}>Correo Electrónico:</label>
            <input 
              type="email" 
              value={form.correo} 
              onChange={e => setForm({ ...form, correo: e.target.value })} 
              placeholder="correo@ejemplo.com"
              className="erp-modal-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading} 
              style={{ padding: '10px 18px', background: '#e4e4e4', color: '#333', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.95rem', transition: 'background 0.2s' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              style={{ padding: '10px 20px', background: 'var(--bauhaus-cyan)', color: 'var(--bauhaus-ink)', border: '2px solid var(--bauhaus-ink)', borderRadius: '2px', cursor: 'pointer', fontWeight: '600', fontFamily: 'var(--font-ui)', fontSize: '0.95rem', transition: 'background 0.2s' }}
            >
              {loading ? 'Guardando...' : (clienteEditar ? 'Guardar Cambios' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};export default ClienteModal;