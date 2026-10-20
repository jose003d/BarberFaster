const Testimonials = () => {
  const testimonialsData = [
    {
      quote: '"Excelente servicio, siempre salgo satisfecho con mi corte."',
      author: 'Juan Pérez ⭐⭐⭐⭐⭐',
      delay: '0'
    },
    {
      quote: '"El ambiente es genial y el personal muy profesional."',
      author: 'Andrés Gómez ⭐⭐⭐⭐⭐',
      delay: '150'
    },
    {
      quote: '"Los mejores precios y la mejor calidad. 100% recomendado."',
      author: 'Carlos López ⭐⭐⭐⭐⭐',
      delay: '300'
    }
  ];

  return (
    <section id="testimonios" className="py-5">
      <div className="container">
        <div className="text-center mb-4" data-aos="fade-up">
          <h2 className="section-title">Lo que opinan nuestros clientes</h2>
        </div>
        <div className="row g-4">
          {testimonialsData.map((test, index) => (
            <div className="col-md-4 d-flex flex-column" data-aos="zoom-in" data-aos-delay={test.delay} key={index}>
              <div className="testimonial">
                <p>{test.quote}</p>
                <strong>- {test.author}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;