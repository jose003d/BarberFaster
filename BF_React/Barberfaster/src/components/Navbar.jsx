import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Clic fuera del buscador para cerrar las sugerencias
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightIndex(-1);

    if (term.trim().length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      return;
    }

    try {
      // Sección para el backend
      const response = await fetch(`/api/barberias/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      }
    } catch (error) {
      console.error('Error al buscar barberías:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
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
        const selected = suggestions[highlightIndex];
        setShowSuggestions(false);
        navigate(`/barberia/${selected.slug}`);
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

    setShowSuggestions(false);
    // Redirige filtrando por la búsqueda
    navigate(`/clientes?search=${encodeURIComponent(searchTerm.trim())}`);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
      <div className="container">
        <Link className="navbar-brand" to="/">
          Barber Faster
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
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
            <button className="btn custom-btn" type="submit">
              Buscar
            </button>

            <div className={`search-suggestions ${showSuggestions ? 'active' : ''}`}>
              {suggestions.map((b, i) => (
                <div
                  key={b.slug || i}
                  onClick={() => {
                    setShowSuggestions(false);
                    navigate(`/barberia/${b.slug}`);
                  }}
                  className={`suggestion-item ${i === highlightIndex ? 'highlighted' : ''}`}
                >
                  <img src={b.logo || '/img/bflogo.png'} alt={b.nombre} />
                  <div>
                    <div className="sug-name">{b.nombre}</div>
                    <div className="sug-ubicacion">{b.ubicacion}</div>
                  </div>
                </div>
              ))}
            </div>
          </form>

          <ul className="navbar-nav align-items-lg-center">
            <li className="nav-item">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/"
              >
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/clientes"
              >
                Clientes
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/barberos"
              >
                Barberos
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/contacto"
              >
                Contáctanos
              </NavLink>
            </li>
            <li className="nav-item ms-lg-2">
              <NavLink
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                to="/login"
              >
                Iniciar Sesión
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;