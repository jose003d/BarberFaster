const Beneficios = () => {
  return (
    <section className="benefits-section container my-5">
      <div className="text-center mb-5" data-aos="fade-up">
        <h2 className="section-title">Beneficios para Clientes</h2>
      </div>
      <div className="row g-4 text-center">
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <i className="bi bi-calendar-check" aria-hidden="true"></i>
            </div>
            <h5 className="benefit-title">Reserva Fácil</h5>
            <p className="benefit-text">Agenda tu cita en segundos desde cualquier dispositivo</p>
          </div>
        </div>
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <i className="bi bi-clock" aria-hidden="true"></i>
            </div>
            <h5 className="benefit-title">Ahorra Tiempo</h5>
            <p className="benefit-text">Sin esperas innecesarias, llega justo a tu hora</p>
          </div>
        </div>
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
          <div className="benefit-card">
            <div className="benefit-icon-circle">
              <i className="bi bi-scissors" aria-hidden="true"></i>
            </div>
            <h5 className="benefit-title">Elige tu Barbero</h5>
            <p className="benefit-text">Selecciona el profesional que prefieras</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Beneficios;