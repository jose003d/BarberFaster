export default function WelcomeSection() {
  return (
    <section className="welcome-section container my-5 py-4">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2 className="section-title">Bienvenido a Barberfaster</h2>
      </div>
      <div className="row align-items-center" data-aos="fade-up">
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="img-container-black-bg">
            <img src="img/bflogo.png" className="img-fluid rounded shadow" alt="Bienvenido a Barberfaster" />
          </div>
        </div>
        <div className="col-md-6">
          <h3 className="welcome-subtitle">¿Que es BarberFaster?</h3>
          <p className="welcome-text">BarberFaster lleva tu barbería al siguiente nivel. Agenda, organiza y cobra más rápido desde una sola plataforma. Simplifica tu trabajo y ofrece a tus clientes una experiencia moderna y profesional.</p>
        </div>
      </div>
    </section>
  );
}