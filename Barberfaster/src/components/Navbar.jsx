import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">Barber Faster</Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <form className="d-flex me-3" role="search" onSubmit={(e) => e.preventDefault()}>
            <input className="form-control me-2" type="search" placeholder="Buscar barberías..." aria-label="Buscar" />
            <button className="btn custom-btn" type="submit">Buscar</button>
          </form>
          <ul className="navbar-nav">
            <li className="nav-item"><Link className="nav-link" to="/">Inicio</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/clientes">Clientes</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/barberos">Barberos</Link></li>
            <li className="nav-item"><Link className="nav-link" to="/contacto">Contáctanos</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}