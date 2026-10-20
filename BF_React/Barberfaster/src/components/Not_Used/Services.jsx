const Services = () => {
  const servicesList = [
    {
      img: '/img/serviciodestacado.jpg',
      title: 'Corte clásico',
      text: 'Estilo moderno o tradicional. Precio desde $15.000',
      delay: '100'
    },
    {
      img: '/img/serviciodestacado2.jpg',
      title: 'Perfilado de barba',
      text: 'Afeitado y diseño de barba. Precio desde $12.000',
      delay: '200'
    },
    {
      img: '/img/serviciodestacado3.jpg',
      title: 'Tratamientos capilares',
      text: 'Cuida tu cabello con productos premium. Desde $20.000',
      delay: '300'
    }
  ];

  return (
    <section id="servicios" className="container my-5">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2 className="section-title">Servicios destacados</h2>
        <p>Lo mejor para tu imagen y confianza</p>
      </div>
      <div className="row g-4">
        {servicesList.map((service, index) => (
          <div className="col-md-4" data-aos="fade-up" data-aos-delay={service.delay} key={index}>
            <div className="card service-card h-100 shadow-sm">
              <img src={service.img} className="card-img-top" alt={service.title} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{service.title}</h5>
                <p className="card-text">{service.text}</p>
                <a href="#" className="btn custom-btn mt-auto">Ver más</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Services;