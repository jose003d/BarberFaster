import { useState, useEffect } from 'react';
import { getCitasActivas } from '../../services/citasService';

const MisCitas = ({ userId }) => {
  const [citas, setCitas] = useState([]);

  useEffect(() => {
    if (userId) {
      setCitas(getCitasActivas(userId));
    }
  }, [userId]);

  const traducirEstado = (estado) => {
    switch (estado) {
      case 'pendiente': return { label: 'En espera', class: 'cita-badge--pendiente' };
      case 'aprobada': return { label: 'Aprobada', class: 'cita-badge--aprobada' };
      case 'pagada': return { label: 'Pagada', class: 'cita-badge--pagada' };
      default: return { label: estado, class: '' };
    }
  };

  return (
    <section id="mis-citas" className="mb-5 pt-4">
      <h2 className="form-title mb-4">Mis Citas Activas</h2>
      
      {citas.length === 0 ? (
        <div className="brutalist-empty-box text-center p-5">
          <i className="bi bi-calendar-x" style={{ fontSize: "3rem", color: "var(--bauhaus-ink)" }}></i>
          <h3 className="mt-3 form-title" style={{ fontSize: "1.5rem" }}>No tienes citas agendadas</h3>
          <p className="form-subtitle mb-0">
            Para agendar tu próxima cita visita los locales disponibles en la página principal.
          </p>
        </div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {citas.map(cita => {
            const statusInfo = traducirEstado(cita.estado);
            const total = cita.servicios?.reduce((acc, s) => acc + s.precio, 0) || 0;

            return (
              <div className="col" key={cita.id}>
                <div className="cita-brutalist-card">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <h5 className="cita-barberia m-0">{cita.barberiaNombre}</h5>
                    <span className={`cita-badge ${statusInfo.class}`}>{statusInfo.label}</span>
                  </div>
                  <div className="cita-info-row text-muted small mb-3">
                    <span><i className="bi bi-calendar-event me-1"></i> {cita.fecha}</span>
                    <span className="ms-3"><i className="bi bi-clock me-1"></i> {cita.hora}</span>
                    <span className="ms-3"><i className="bi bi-person me-1"></i> {cita.barbero}</span>
                  </div>
                  <div className="cita-divider"></div>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="fw-bold" style={{ color: "var(--bauhaus-ink)" }}>Total</span>
                    <span className="fw-bold" style={{ color: "var(--bauhaus-orange)", fontSize: "1.2rem" }}>
                      ${total.toLocaleString()}
                    </span>
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

export default MisCitas;