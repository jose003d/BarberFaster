import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const BarberiasGrid = () => {
  const [barberias, setBarberias] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchBarberias = async () => {
      setLoading(true);
      try {
        const endpoint = searchQuery
          ? `/api/barberias/search?q=${encodeURIComponent(searchQuery)}`
          : '/api/barberias';

        const response = await fetch(endpoint);
        const contentType = response.headers.get('content-type');
        if (response.ok && contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setBarberias(data);
        } else {
          setBarberias([]);
        }
      } catch (error) {
        setBarberias([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBarberias();
  }, [searchQuery]);

  return (
    <main className="container my-5">
      <div className="text-center mb-5" data-aos="fade-up">
        <h1 className="section-title">Barberías disponibles en tu zona</h1>
        <p className="lead" style={{ color: '#d3d3d3' }}>
          Pasa el cursor sobre cualquier barbería para ver su ubicación,
          horarios y descripción. Haz clic para ver todos los detalles.
        </p>
      </div>

      <div className="clientes-cards-wrap" data-aos="fade-up">
        <div className="row g-4" id="barberiasGrid">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-warning" role="status">
                <span className="visually-hidden">Cargando barberías...</span>
              </div>
            </div>
          ) : barberias.length > 0 ? (
            barberias.map((barberia, index) => (
              <div
                className="col-lg-3 col-md-6 barberia-col"
                data-aos="zoom-in"
                data-aos-delay={(index % 4) * 100 + 100}
                key={barberia.id || barberia.slug || index}
              >
                <div className="style-card">
                  <Link to={`/barberia/${barberia.slug}`}>
                    <img src={barberia.logo || '/img/bflogo.png'} alt={barberia.nombre} />
                  </Link>
                  <div className="card-label">
                    <h5>{barberia.nombre}</h5>
                  </div>
                  <div className="card-info-overlay">
                    <div className="info-ubicacion">
                      <i className="bi bi-geo-alt-fill"></i> {barberia.ubicacion}
                    </div>
                    <div className="info-horarios">
                      <i className="bi bi-clock"></i> {barberia.horarios}
                    </div>
                    <p className="info-descripcion">{barberia.descripcion}</p>
                    <Link to={`/barberia/${barberia.slug}`} className="btn-ver-mas">
                      Ver detalles
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <i className="bi bi-search"></i>
              <h4>No se encontraron barberías</h4>
              <p>Intenta con otro término de búsqueda o conecta tu base de datos</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default BarberiasGrid;