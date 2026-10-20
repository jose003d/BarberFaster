import { useState } from 'react';

const AddServiceModal = ({ isOpen, onClose, onAdd }) => {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!nombre.trim() || !precio) {
      setError(true);
      return;
    }
    onAdd(nombre, parseInt(precio));
    setNombre('');
    setPrecio('');
    setError(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="brutalist-card-container p-0" style={{ width: '90%', maxWidth: '400px' }}>
        <div className="p-3 border-bottom border-dark" style={{ borderBottomWidth: "2px" }}>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="form-eyebrow m-0" style={{ color: "var(--bauhaus-cyan)" }}>AGREGAR SERVICIO</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-3">
            <label className="brutalist-label">Nombre del Servicio</label>
            <input 
              type="text" 
              className="brutalist-input w-100" 
              placeholder="Ej: Corte clásico" 
              value={nombre} 
              onChange={(e) => { setNombre(e.target.value); setError(false); }}
              style={{ borderColor: error && !nombre.trim() ? '#e05555' : '' }}
            />
          </div>
          <div className="mb-4">
            <label className="brutalist-label">Precio</label>
            <input 
              type="number" 
              className="brutalist-input w-100" 
              placeholder="Ej: 15000" 
              min="0" step="1000"
              value={precio} 
              onChange={(e) => { setPrecio(e.target.value); setError(false); }}
              style={{ borderColor: error && !precio ? '#e05555' : '' }}
            />
          </div>
          
          <div className="d-flex flex-column gap-2 mt-4">
            <button type="button" className="custom-btn w-100 m-0 text-center" onClick={handleAdd}>Agregar Servicio</button>
            <button type="button" className="custom-btn w-100 m-0 text-center" style={{ backgroundColor: "var(--bauhaus-neutral)", color: "var(--bauhaus-ink)" }} onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddServiceModal;