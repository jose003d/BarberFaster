const ContactInfo = () => {
  return (
    <div className="row g-4 justify-content-center mt-5 pb-5">
      
      <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="100">
        <div className="benefit-card">
          <div className="benefit-icon-box">
            <i className="bi bi-envelope" aria-hidden="true"></i>
          </div>
          <h5 className="benefit-title">Soporte Técnico</h5>
          <p className="benefit-text fw-bold" style={{ color: "var(--bauhaus-ink)" }}>
            soportebarberfaster@gmail.com
          </p>
        </div>
      </div>

      <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay="200">
        <div className="benefit-card">
          <div className="benefit-icon-box">
            <i className="bi bi-clock" aria-hidden="true"></i>
          </div>
          <h5 className="benefit-title">Horario de Atención</h5>
          <p className="benefit-text">Lunes - Sábado<br />9:00 - 20:00</p>
        </div>
      </div>

    </div>
  );
};

export default ContactInfo;