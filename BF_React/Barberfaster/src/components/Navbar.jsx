import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

import '../styles/auth.css';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // Estado del usuario autenticado
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();

  // Verifica si hay sesión activa al montar el componente
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("bf_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Error leyendo bf_user", e);
    }
  }, []);

  // Maneja clic fuera de sugerencias de búsqueda y menú de usuario
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica de búsqueda conectada a la base de datos
  const handleSearchInput = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setHighlightIndex(-1);

    if (term.trim().length === 0) {
      setShowSuggestions(false);
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSuggestions(true);

    try {
      const response = await fetch(`/api/barberias/search?q=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error al buscar barberías:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Navegación con teclado en las sugerencias
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
        navigate(`/reservar?barberia=${selected.id || selected.slug}`);
        setSearchTerm('');
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Submit del formulario del buscador
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(searchTerm.trim())}#catalogo-barberias`);
  };

  // Acción de cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem("bf_user");
    setUser(null);
    setIsUserMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg custom-navbar">
      <div className="container">
        {/* Nombre de la marca con estilo dual */}
        <Link className="navbar-brand" to="/">
          BARBER<span style={{ color: "var(--bauhaus-gray)" }}>FASTER</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Alternar navegación"
          style={{ borderColor: "var(--bauhaus-ink)", borderRadius: "0" }}
        >
          <i className="bi bi-list" style={{ color: "var(--bauhaus-ink)", fontSize: "1.5rem" }}></i>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
          
          {/* Formulario Buscador */}
          <form
            className="d-flex me-lg-4 position-relative mt-3 mt-lg-0"
            role="search"
            autoComplete="off"
            onSubmit={handleSearchSubmit}
            ref={searchRef}
          >
            <input
              className="form-control me-2"
              type="search"
              placeholder="BUSCAR BARBERÍAS..."
              aria-label="Buscar"
              value={searchTerm}
              onChange={handleSearchInput}
              onKeyDown={handleKeyDown}
            />
            <button className="btn custom-btn" type="submit" style={{ padding: "0.4rem 1rem" }}>
              <i className="bi bi-search"></i>
            </button>

            {/* Sugerencias de Búsqueda */}
            <div className={`search-suggestions ${showSuggestions ? 'active' : ''}`}>
              {isSearching ? (
                <div className="suggestion-item text-center" style={{ pointerEvents: 'none', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#55555a' }}>Buscando...</span>
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((b, i) => (
                  <div
                    key={b.id || b.slug || i}
                    onClick={() => {
                      setShowSuggestions(false);
                      navigate(`/reservar?barberia=${b.id || b.slug}`);
                      setSearchTerm('');
                    }}
                    className={`suggestion-item ${i === highlightIndex ? 'highlighted' : ''}`}
                  >
                    <img src={b.logo || b.foto || '/img/bflogo.png'} alt={b.nombre} />
                    <div>
                      <div className="sug-name">{b.nombre}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="suggestion-item text-center" style={{ pointerEvents: 'none', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#55555a', fontWeight: 'bold' }}>
                    No hay barberías que coincidan.
                  </span>
                </div>
              )}
            </div>
          </form>

          {/* Menú de Navegación */}
          <ul className="navbar-nav align-items-lg-center">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/">
                Inicio
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} to="/contacto">
                Contáctanos
              </NavLink>
            </li>

            {/* Lógica de Autenticación */}
            <li className="nav-item ms-lg-3 mt-3 mt-lg-0" ref={userMenuRef}>
              {user ? (
                <div className="nav-user-dropdown position-relative">
                  <button 
                    className={`nav-user-btn ${isUserMenuOpen ? 'nav-user-btn--active' : ''}`} 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    type="button"
                  >
                    <i className="bi bi-person-circle me-2"></i>
                    <span className="nav-user-name me-2">{user.usuario || user.nombre}</span>
                    <i className="bi bi-chevron-down"></i>
                  </button>

                  <div className={`nav-user-menu ${isUserMenuOpen ? 'nav-user-menu--open' : ''}`}>
                    <Link to="/perfil" className="nav-user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                      <i className="bi bi-person me-2"></i> Mi perfil
                    </Link>
                    {user.tipo === "barbero" && (
                      <Link to="/dashboard" className="nav-user-menu-item" onClick={() => setIsUserMenuOpen(false)}>
                        <i className="bi bi-shop me-2"></i> Mi Barbería
                      </Link>
                    )}
                    <button type="button" className="nav-user-menu-item nav-user-logout" onClick={handleLogout}>
                      <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                    </button>
                  </div>
                </div>
              ) : (
                <Link to="/login" className="nav-login-btn text-decoration-none">
                  Iniciar sesión
                </Link>
              )}
            </li>
          </ul>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;