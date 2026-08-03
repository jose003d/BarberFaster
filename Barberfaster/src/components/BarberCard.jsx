export default function BarberCard({ barbero }) {
  return (
    <div className="card-base mb-4 shadow-sm" data-aos="fade-up">
      <div className="row g-0 align-items-center p-3">
        <div className="col-md-7">
          <div className="card-body p-0">
            <h5 className="card-title" style={{ color: 'var(--color-dorado)' }}>{barbero.nombre}</h5>
            <p className="card-text" style={{ color: 'var(--color-gris-claro)' }}>"{barbero.comentario}"</p>
            <a href={barbero.enlace} target="_blank" rel="noreferrer" className="btn custom-btn mt-2">Ver más</a>
          </div>
        </div>
        <div className="col-md-5 text-center mt-3 mt-md-0">
          <img 
            src={barbero.imagen} 
            className="img-fluid rounded-circle" 
            alt={barbero.nombre} 
            style={{ width: '150px', height: '150px', objectFit: 'cover', border: '3px solid var(--color-dorado)' }}
          />
        </div>
      </div>
    </div>
  );
}