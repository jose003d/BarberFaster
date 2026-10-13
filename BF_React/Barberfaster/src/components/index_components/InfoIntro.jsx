const InfoIntro = () => {
  return (
    <section className="container info-intro my-5 py-4">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2 className="section-title">Elige cómo quieres vivir la experiencia BarberFaster</h2>
      </div>
      <div className="row justify-content-center mb-5">
        <div className="col-lg-8">
          <div data-aos="fade-up">
            <p className="info-text mb-3">
              Creemos que un buen corte de pelo no solo mejora tu apariencia, sino que también
              eleva tu confianza. Por eso, cada servicio que ofrecemos está diseñado para proporcionar resultados
              excepcionales que duren.
            </p>
            <p className="info-text mb-0">
              Utilizamos solo productos de alta calidad y herramientas profesionales para asegurar
              que cada detalle sea perfecto. Desde un corte clásico hasta los estilos más modernos, estamos aquí para
              hacer realidad tu visión.
            </p>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-4 mb-md-0" data-aos="fade-up" data-aos-delay="200">
          <a href="/clientes" className="img-link">
            <div className="img-container-black-bg info-img-container">
              <img src="/img/bfclientes.png" className="img-fluid rounded shadow mb-3" alt="Clientes" />
            </div>
          </a>
          <h4 className="text-center info-img-title">Clientes</h4>
        </div>
        <div className="col-md-6" data-aos="fade-up" data-aos-delay="300">
          <a href="/barberos" className="img-link">
            <div className="img-container-black-bg info-img-container">
              <img src="/img/bfbarberos.png" className="img-fluid rounded shadow mb-3" alt="Barberos" />
            </div>
          </a>
          <h4 className="text-center info-img-title">Barberos</h4>
        </div>
      </div>
    </section>
  );
};

export default InfoIntro;