// src/components/UsuarioModal.jsx
import React, { useState, useEffect } from 'react';
import { apiFetch, obtenerBarberias } from '../services/api';

// Formulario modal para crear o editar barberos asociados a una barbería activa.
export const UsuarioModal = ({ isOpen, onClose, idBarberia, usuarioEditar, onSuccess }) => {
  // Resuelve la barbería activa desde la sesión demo o desde las propiedades recibidas.
  const obtenerBarberiaActivaId = () => {
    try {
      const stored = localStorage.getItem('barberia_demo_admin');
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.id_barberia || parsed.id || idBarberia || 1;
      }
    } catch (e) {
      const raw = localStorage.getItem('barberia_demo_admin');
      if (raw && !isNaN(raw)) return Number(raw);
    }
    return idBarberia || 1;
  };

  // Prepara el formulario y la interfaz según el barbero y barbería seleccionados.
  const [form, setForm] = useState({
    nombre: '',
    especialidad: '',
    id_barberia: obtenerBarberiaActivaId()
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      sincronizarBarberiaActiva();
    }
    if (usuarioEditar) {
      setForm({
        nombre: usuarioEditar.nombre || '',
        especialidad: usuarioEditar.especialidad || '',
        id_barberia: usuarioEditar.id_barberia || obtenerBarberiaActivaId()
      });
    } else {
      setForm({ 
        nombre: '', 
        especialidad: '', 
        id_barberia: obtenerBarberiaActivaId()
      });
    }
  }, [usuarioEditar, isOpen, idBarberia]);

  // Comprueba que la barbería activa siga disponible antes de guardar.
  const sincronizarBarberiaActiva = async () => {
    try {
      const barberias = await obtenerBarberias(true);
      const activeId = Number(obtenerBarberiaActivaId());
      const barberiaValida = barberias.find((barberia) => Number(barberia.id_barberia) === activeId) || barberias[0];

      if (barberiaValida) {
        const idValido = Number(barberiaValida.id_barberia);
        setForm((current) => ({ ...current, id_barberia: idValido }));
        localStorage.setItem('barberia_demo_admin', JSON.stringify(barberiaValida));
        return idValido;
      }
    } catch (err) {
      setError('No se pudo validar la barbería activa.');
    }
    return null;
  };

  if (!isOpen) return null;

  // Envía el alta o edición con el identificador de barbería validado.
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const idBarberiaValida = await sincronizarBarberiaActiva();
    if (!idBarberiaValida) {
      setLoading(false);
      setError('No hay una barbería activa válida para registrar el barbero.');
      return;
    }

    const endpoint = usuarioEditar ? 'barberos/actualizarb.php' : 'barberos/crearb.php';
    
    const payload = usuarioEditar
      ? { 
          id_barbero: usuarioEditar.id_barbero, 
          nombre: form.nombre, 
          especialidad: form.especialidad,
          id_barberia: idBarberiaValida
        }
      : { 
          id_barberia: idBarberiaValida, 
          nombre: form.nombre, 
          especialidad: form.especialidad
        };

    const res = await apiFetch(endpoint, {
      method: 'POST',
      body: payload
    });

    setLoading(false);

    if (res.status === 'success') {
      onSuccess && onSuccess();
      onClose();
    } else {
      setError(res.mensaje || 'Error al procesar el barbero.');
    }
  };

  // Renderiza el formulario modal y sus campos de barbero.
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
          padding: 11px 14px;
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
        maxWidth: '460px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
        boxSizing: 'border-box',
        animation: 'scaleUpModal 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
          <h3 style={{ margin: 0, color: '#393939', fontSize: '1.25rem', fontWeight: '400' }}>
            {usuarioEditar ? 'Editar Barbero' : 'Registrar Barbero'}
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
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.9rem' }}>Nombre:</label>
            <input 
              type="text" 
              value={form.nombre} 
              onChange={e => setForm({ ...form, nombre: e.target.value })} 
              placeholder="Nombre completo del barbero"
              required 
              className="erp-modal-input"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', color: '#444', fontSize: '0.9rem' }}>Especialidad:</label>
            <input 
              type="text" 
              placeholder="Ej: Fade, Barba, Corte Clásico"
              value={form.especialidad} 
              onChange={e => setForm({ ...form, especialidad: e.target.value })} 
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
              style={{ padding: '10px 20px', background: 'var(--bauhaus-cyan)', color: 'var(--bauhaus-ink)', border: '2px solid var(--bauhaus-ink)', borderRadius: '2px', cursor: 'pointer', fontWeight: '600', fontFamily: '"Chillax", Arial, sans-serif', fontSize: '0.95rem', transition: 'background 0.2s' }}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};