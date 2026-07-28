export default function CommentSection() {
  return (
    <section id="testimonios" className="py-5">
      <div className="container">
        <div className="text-center mb-4" data-aos="fade-up">
          <h2>Lo que opinan nuestros clientes</h2>
        </div>
        <div className="row g-4">
          <div className="col-md-4" data-aos="zoom-in">
            <div className="testimonial">
              <p>"Excelente servicio, siempre salgo satisfecho con mi corte."</p>
              <strong>- Juan Pérez ⭐⭐⭐⭐⭐</strong>
            </div>
          </div>
          <div className="col-md-4" data-aos="zoom-in" data-aos-delay="150">
            <div className="testimonial">
              <p>"El ambiente es genial y el personal muy profesional."</p>
              <strong>- Andrés Gómez ⭐⭐⭐⭐⭐</strong>
            </div>
          </div>
          <div className="col-md-4" data-aos="zoom-in" data-aos-delay="300">
            <div className="testimonial">
              <p>"Los mejores precios y la mejor calidad. 100% recomendado."</p>
              <strong>- Carlos López ⭐⭐⭐⭐⭐</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}