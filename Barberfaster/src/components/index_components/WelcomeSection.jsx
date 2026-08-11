export default function WelcomeSection() {
  return (
    <section className="welcome-section container my-5 py-4">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2 className="section-title">Bienvenido a Barberfaster</h2>
      </div>
      <div className="row align-items-center justify-content-center" data-aos="fade-up">
        <div className="col-md-8 text-center">
          <i className="bi bi-scissors welcome-icon" aria-hidden="true"></i>
          <h1 className="welcome-title">Estilo Clásico, Servicio Moderno</h1>
          <p className="welcome-text">
            BarberFaster lleva tu barbería al siguiente nivel. Agenda, organiza y cobra más rápido desde una sola plataforma. Simplifica tu trabajo y ofrece a tus clientes una experiencia moderna y profesional.
          </p>
          <div className="welcome-buttons d-flex gap-3 justify-content-center flex-wrap mt-4">
            <button type="button" className="btn btn-dark btn-lg">
              Reservar cita
            </button>
            <a href="#servicios" className="btn btn-outline-dark btn-lg">
              Ver servicios
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}