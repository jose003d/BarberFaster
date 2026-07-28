import { Link } from 'react-router-dom';
import { barberias } from '../data/barberias';

export default function BarberGrid() {
  return (
    <div className="row g-4">
      {barberias.map((barberia) => (
        <div className="col-lg-3 col-md-6" key={barberia.id} data-aos="zoom-in" data-aos-delay="100">
          <div className="style-card text-center">
            <Link to={`/barberia/${barberia.slug}`}>
              <img src={barberia.logo} className="card-img-top" alt={barberia.nombre} />
            </Link>
            <h5>{barberia.nombre}</h5>
          </div>
        </div>
      ))}
    </div>
  );
}