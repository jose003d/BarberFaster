import { useState, useEffect, useRef } from 'react';

const barberias = [
  { slug: 'barberia-1', nombre: 'Barbería Central', nombreSecundario: 'Centro', ubicacion: 'Calle 10 #20', logo: '/img/bflogo.png' },
  { slug: 'barberia-2', nombre: 'Barbería Elite', nombreSecundario: 'Norte', ubicacion: 'Carrera 15 #45', logo: '/img/bflogo.png' }
];

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Manejar click fuera del buscador para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightIndex(-1);

    if (term.trim().length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    const filtradas = barberias.filter((b) =>
      b.nombre.toLowerCase().includes(term.toLowerCase()) ||
      (b.nombreSecundario && b.nombreSecundario.toLowerCase().includes(term.toLowerCase())) ||
      b.ubicacion.toLowerCase().includes(term.toLowerCase())
    );

    setSuggestions(filtradas);
    setShowSuggestions(filtradas.length > 0);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0) {
        window.location.href = `barberia.html?barberia=${suggestions[highlightIndex].slug}`;
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const coincidencia = barberias.find((b) =>
      b.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || b.slug === searchTerm.toLowerCase()
    );

    if (coincidencia) {
      window.location.href = `barberia.html?barberia=${coincidencia.slug}`;
    }
    setShowSuggestions(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <a className="navbar-brand" href="/">Barber Faster</a>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          <form 
            className="d-flex me-3 position-relative" 
            role="search" 
            autoComplete="off" 
            onSubmit={handleSearchSubmit}
            ref={searchRef}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="Buscar barberías..."
              aria-label="Buscar"
              value={searchTerm}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
            />
            <button className="btn custom-btn" type="submit">Buscar</button>
            
            <div className={`search-suggestions ${showSuggestions ? 'active' : ''}`}>
              {suggestions.map((b, i) => (
                <a
                  key={b.slug}
                  href={`barberia.html?barberia=${b.slug}`}
                  className={`suggestion-item ${i === highlightIndex ? 'highlighted' : ''}`}
                >
                  <img src={b.logo} alt={b.nombre} />
                  <div>
                    <div className="sug-name">{b.nombre}</div>
                    <div className="sug-ubicacion">{b.ubicacion}</div>
                  </div>
                </a>
              ))}
            </div>
          </form>
          <ul className="navbar-nav align-items-lg-center">
            <li className="nav-item"><a className="nav-link active" href="/">Inicio</a></li>
            <li className="nav-item"><a className="nav-link" href="/clientes">Clientes</a></li>
            <li className="nav-item"><a className="nav-link" href="/barberos">Barberos</a></li>
            <li className="nav-item"><a className="nav-link" href="/contacto">Contáctanos</a></li>
            <li className="nav-item ms-lg-2">
               <a className="nav-link" href="/login">Iniciar Sesión</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;