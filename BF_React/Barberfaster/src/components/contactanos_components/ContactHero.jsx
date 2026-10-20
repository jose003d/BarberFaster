const ContactHero = () => {
  return (
    <section className="contact-hero-section" data-aos="fade-up">
      <div className="container py-5">
        <div className="row">
          
          {/* Columna principal a la izquierda */}
          <div className="col-lg-8 text-start">
            <h1 
              className="welcome-title" 
              style={{ fontSize: "clamp(2.1rem, 5vw, 4.4rem)", marginBottom: "1rem", color: "var(--bauhaus-ink)" }}
            >
              Estamos aquí <br /> para ayudarte
            </h1>
            <p className="welcome-text mb-4" style={{ maxWidth: "100%", color: "var(--bauhaus-ink)", fontSize: "1.1rem" }}>
              ¿Tienes dudas, sugerencias o necesitas soporte técnico? Escríbenos y nuestro equipo te responderá lo más rápido posible.
            </p>
            
            <a 
              href="#formulario-contacto" 
              className="custom-btn d-inline-block text-decoration-none"
              style={{ backgroundColor: 'var(--bauhaus-orange)', color: '#fff', border: 'var(--borde-grueso)' }}
            >
              ENVIAR MENSAJE
            </a>
          </div>

          {/* Lado derecho vacío */}
          <div className="col-lg-4"></div>

        </div>
      </div>
    </section>
  );
};

export default ContactHero;