import { Link } from 'react-router-dom';

export default function InfoSection() {
  return (
    <section className="info-section container my-5 py-4">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2 className="section-title">Elige cómo quieres vivir la experiencia BarberFaster</h2>
      </div>
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8">
          <p className="info-text mb-4" data-aos="fade-up">Creemos que un buen corte de pelo no solo mejora tu apariencia, sino que también eleva tu confianza. Por eso, cada servicio que ofrecemos está diseñado para proporcionar resultados excepcionales que duren.</p>
          <p className="info-text" data-aos="fade-up" data-aos-delay="100">Utilizamos solo productos de alta calidad y herramientas profesionales para asegurar que cada detalle sea perfecto. Desde un corte clásico hasta los estilos más modernos, estamos aquí para hacer realidad tu visión.</p>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-4 mb-md-0" data-aos="fade-up" data-aos-delay="200">
          <Link to="/clientes" className="img-link">
            <div className="img-container-black-bg">
              <img src="img/bfclientes.png" className="img-fluid rounded shadow mb-3" alt="Clientes" />
            </div>
          </Link>
          <h4 className="text-center">Clientes</h4>
        </div>
        <div className="col-md-6" data-aos="fade-up" data-aos-delay="300">
          <Link to="/barberos" className="img-link">
            <div className="img-container-black-bg">
              <img src="img/bfbarberos.png" className="img-fluid rounded shadow mb-3" alt="Barberos" />
            </div>
          </Link>
          <h4 className="text-center">Barberos</h4>
        </div>
      </div>
    </section>
  );
}