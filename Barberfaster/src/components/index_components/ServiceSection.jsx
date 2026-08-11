export default function ServiceSection() {
  return (
    <section id="servicios" className="container my-5">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2>Servicios destacados</h2>
        <p>Lo mejor para tu imagen y confianza</p>
      </div>
      <div className="row g-4">
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="100">
          <div className="card service-card h-100 shadow-sm">
            <img src="img/cat.jpg" className="card-img-top" alt="Corte de cabello" />
            <div className="card-body">
              <h5 className="card-title">Corte clásico</h5>
              <p className="card-text">Estilo moderno o tradicional. Precio desde $15.000</p>
              <button type="button" className="btn custom-btn">Ver más</button>
            </div>
          </div>
        </div>
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="200">
          <div className="card service-card h-100 shadow-sm">
            <img src="img/cat2.jpg" className="card-img-top" alt="Barba" />
            <div className="card-body">
              <h5 className="card-title">Perfilado de barba</h5>
              <p className="card-text">Afeitado y diseño de barba. Precio desde $12.000</p>
              <button type="button" className="btn custom-btn">Ver más</button>
            </div>
          </div>
        </div>
        <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
          <div className="card service-card h-100 shadow-sm">
            <img src="img/cat3.jpg" className="card-img-top" alt="Tratamientos" />
            <div className="card-body">
              <h5 className="card-title">Tratamientos capilares</h5>
              <p className="card-text">Cuida tu cabello con productos premium. Desde $20.000</p>
              <button type="button" className="btn custom-btn">Ver más</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}