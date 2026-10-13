import { Link } from 'react-router-dom';

const testimonials = [
  {
    quote: '"BarberFaster transformó completamente mi negocio. Ahora tengo un 40% más de clientes y cero tiempo perdido en administración."',
    author: 'Miguel Rodríguez, Barbería Elite',
    slug: 'barberia-2',
    delay: 0
  },
  {
    quote: '"La mejor inversión que he hecho. Mis clientes aman poder reservar online y yo tengo mi agenda siempre organizada."',
    author: 'Fernando Silva, Cut & Style',
    slug: 'cut-style',
    delay: 150
  }
];

const TestimonialsBarberos = () => {
  return (
    <div className="testimonials-wrap my-5" data-aos="fade-up">
      <div className="text-center mb-4">
        <h2 className="section-title">Lo que dicen los barberos</h2>
      </div>
      <div className="row g-4">
        {testimonials.map((item, index) => (
          <div className="col-md-6" data-aos="zoom-in" data-aos-delay={item.delay} key={index}>
            <div className="testimonial-card">
              <p className="testimonial-quote">{item.quote}</p>
              <Link to={`/barberia/${item.slug}`} className="testimonial-author">
                {item.author}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsBarberos;