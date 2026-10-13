const Hero = () => {
  return (
    <section className="welcome-section" data-aos="fade-up">
      <div className="welcome-overlay">
        <div className="container welcome-content text-center">
          <i className="bi bi-scissors welcome-icon" aria-hidden="true"></i>
          <h1 className="welcome-title">Estilo Clásico, Servicio Moderno</h1>
          <p className="welcome-text">
            BarberFaster lleva tu barbería al siguiente nivel. Agenda, organiza y cobra más rápido
            desde una sola plataforma. Simplifica tu trabajo y ofrece a tus clientes una experiencia moderna y profesional.
          </p>
          <div className="welcome-buttons d-flex gap-3 justify-content-center flex-wrap mt-4">
            <a href="/clientes" className="btn custom-btn btn-lg">Reservar cita</a>
            <a href="#servicios" className="btn btn-welcome-link btn-lg">Ver servicios</a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;