import { useState } from 'react';
import { getHistorialCitas } from '../../services/citasService';

const HistorialCitas = ({ userId }) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [historial, setHistorial] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    setError('');

    if (!fechaInicio || !fechaFin) {
      setError('Por favor, selecciona ambas fechas.');
      return;
    }

    const start = new Date(fechaInicio);
    const end = new Date(fechaFin);

    if (start > end) {
      setError('La fecha de inicio no puede ser mayor a la fecha de fin.');
      return;
    }

    // Validación de máximo 1 año de diferencia
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Ms > S > M > H
    
    if (diffDays > 365) {
      setError('El rango de búsqueda no puede superar 1 año (365 días).');
      return;
    }

    setHistorial(getHistorialCitas(userId, fechaInicio, fechaFin));
    setHasSearched(true);
  };

  const traducirEstado = (estado) => {
    return estado === 'cancelada' 
      ? { label: 'Cancelada', class: 'cita-badge--cancelada' } 
      : { label: 'Realizada', class: 'cita-badge--realizada' };
  };

  return (
    <section id="historial-citas" className="mb-5 pt-4">
      <h2 className="form-title mb-4">Historial de Citas</h2>
      
      <div className="brutalist-card-container p-4 mb-4" style={{ maxWidth: '100%' }}>
        <form onSubmit={handleSearch} className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="brutalist-label">Fecha de inicio</label>
            <input 
              type="date" 
              className="brutalist-input" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)} 
            />
          </div>
          <div className="col-md-4">
            <label className="brutalist-label">Fecha de fin</label>
            <input 
              type="date" 
              className="brutalist-input" 
              value={fechaFin} 
              onChange={(e) => setFechaFin(e.target.value)} 
            />
          </div>
          <div className="col-md-4">
            <button type="submit" className="custom-btn w-100" style={{ padding: "0.75rem" }}>
              Buscar Historial
            </button>
          </div>
        </form>
        {error && <div className="text-danger mt-2 fw-bold" style={{ fontSize: '0.85rem' }}>{error}</div>}
      </div>

      {!hasSearched ? (
        <p className="text-muted text-center py-4">Ingresa un rango de fechas para ver tu historial.</p>
      ) : historial.length === 0 ? (
        <p className="text-muted text-center py-4">No se encontraron citas en este rango de fechas.</p>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {historial.map(cita => {
            const statusInfo = traducirEstado(cita.estado);
            return (
              <div className="col" key={cita.id}>
                <div className="cita-brutalist-card" style={{ backgroundColor: 'var(--bauhaus-neutral)' }}>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="cita-barberia m-0" style={{ color: "var(--bauhaus-ink)" }}>{cita.barberiaNombre}</h5>
                    <span className={`cita-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                  </div>
                  <div className="text-muted small">
                    <i className="bi bi-calendar-check me-1"></i> {cita.fecha}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default HistorialCitas;