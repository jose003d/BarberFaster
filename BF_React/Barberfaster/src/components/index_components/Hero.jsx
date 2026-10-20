const Hero = () => {
  return (
    <section
      className="welcome-section"
      data-aos="fade-up"
      style={{ minHeight: "45vh", padding: "4rem 0" }}
    >
      <div className="container welcome-content">
        <div className="row align-items-center">
          {/* Columna Izquierda */}
          <div className="col-lg-7 text-start">
            <h1
              className="welcome-title"
              style={{
                fontSize: "clamp(2.1rem, 5vw, 4.4rem)",
                marginBottom: "1rem",
              }}
            >
              Tu Estilo, <br /> Tu Lugar
            </h1>
            <p
              className="welcome-text"
              style={{ margin: "0", maxWidth: "100%" }}
            >
              Encuentra una barbería cerca de tí y reserva tu próxima cita
            </p>
            <a
              href="#catalogo-barberias"
              className="custom-btn d-inline-block text-decoration-none"
            >
              Explorar locales
            </a>
          </div>

          {/* Columna Derecha */}
          <div className="col-lg-5 text-lg-end text-center mt-4 mt-lg-0"></div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
