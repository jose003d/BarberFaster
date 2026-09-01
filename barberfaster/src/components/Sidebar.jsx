import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScissors,
  faUsers,
  faUserGroup,
  faUser,
  faCalendarDays,
  faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";

function Sidebar() {
  // ==========================
  // Hook de navegación
  // ==========================
  const navigate = useNavigate();

  // ==========================
  // Función para aplicar clase activa en NavLink
  // ==========================
  const linkClass = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  // ==========================
  // Función de cierre de sesión
  // ==========================
  const handleLogout = () => {
    // Eliminar datos de autenticación del localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("erpbarber_auth");
    // Redirigir al login
    navigate("/login", { replace: true });
  };

  // ==========================
  // Renderizado del sidebar
  // ==========================
  return (
    <aside className="sidebar">
      {/* Encabezado con logo y título */}
      <div className="sidebar-header">
        <img
          src="http://localhost/erpbarber/barberfaster/backend/uploads/logo.png"
          alt="BarberFaster logo"
          className="sidebar-avatar"
        />
        <h3 className="sidebar-title">BarberFaster</h3>
      </div>

      {/* Navegación principal */}
      <nav>
        <NavLink to="/barberias" className={linkClass}>
          <FontAwesomeIcon icon={faScissors} className="nav-icon" />
          <span className="nav-label">Barberías</span>
        </NavLink>

        <NavLink to="/usuarios" className={linkClass}>
          <FontAwesomeIcon icon={faUsers} className="nav-icon" />
          <span className="nav-label">Usuarios</span>
        </NavLink>

        <NavLink to="/clientes" className={linkClass}>
          <FontAwesomeIcon icon={faUserGroup} className="nav-icon" />
          <span className="nav-label">Clientes</span>
        </NavLink>

        <NavLink to="/barberos" className={linkClass}>
          <FontAwesomeIcon icon={faUsers} className="nav-icon" />
          <span className="nav-label">Barberos</span>
        </NavLink>

        <NavLink to="/agenda" className={linkClass}>
          <FontAwesomeIcon icon={faCalendarDays} className="nav-icon" />
          <span className="nav-label">Agenda</span>
        </NavLink>

        <NavLink to="/perfil" className={linkClass}>
          <FontAwesomeIcon icon={faUser} className="nav-icon" />
          <span className="nav-label">Perfil</span>
        </NavLink>

        {/* Botón de cierre de sesión */}
        <button
          type="button"
          className="nav-link"
          onClick={handleLogout}
          style={{
            border: "none",
            background: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left"
          }}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="nav-icon" />
          <span className="nav-label">Cerrar sesión</span>
        </button>
      </nav>
    </aside>
  );
}

export default Sidebar;
