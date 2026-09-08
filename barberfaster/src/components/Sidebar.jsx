import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faScissors,
  faUsers,
  faUserGroup,
  faCalendarDays,
  faGaugeHigh,
  faUserTie,
  faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";

function Sidebar() {
  // El menú cambia entre administración y modo barbero según la sesión demo.
  const navigate = useNavigate();
  const [barberoActivo, setBarberoActivo] = useState(() => Boolean(localStorage.getItem("barbero_demo_sesion")));

  // Sincroniza cambios realizados por el wrapper de perfil o por otra pestaña.
  useEffect(() => {
    const syncRole = () => setBarberoActivo(Boolean(localStorage.getItem("barbero_demo_sesion")));
    window.addEventListener("barberfaster-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("barberfaster-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  // ==========================
  // Función para aplicar clase activa en NavLink
  // ==========================
  const linkClass = ({ isActive }) =>
    `nav-link${isActive ? " active" : ""}`;

  // ==========================
  // Función de cierre de sesión
  // ==========================
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("erpbarber_auth");
    localStorage.removeItem("barbero_demo_sesion");
    window.dispatchEvent(new Event("barberfaster-role-change"));
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

      <nav>
        {/* Administración y modo barbero son mutuamente excluyentes. */}
        {!barberoActivo ? (
          <>
            <div className="nav-section-label">Administración</div>
            <NavLink to="/dashboard" className={linkClass}><FontAwesomeIcon icon={faGaugeHigh} className="nav-icon" /><span className="nav-label">Dashboard</span></NavLink>
            <NavLink to="/barberias" className={linkClass}><FontAwesomeIcon icon={faScissors} className="nav-icon" /><span className="nav-label">Barberías</span></NavLink>
            <NavLink to="/usuarios" className={linkClass}><FontAwesomeIcon icon={faUsers} className="nav-icon" /><span className="nav-label">Personal</span></NavLink>
            <NavLink to="/clientes" className={linkClass}><FontAwesomeIcon icon={faUserGroup} className="nav-icon" /><span className="nav-label">Clientes</span></NavLink>
            <NavLink to="/agenda" className={linkClass}><FontAwesomeIcon icon={faCalendarDays} className="nav-icon" /><span className="nav-label">Agenda</span></NavLink>
            <div className="nav-section-label">Perfil de barbero</div>
            <NavLink to="/perfil" className={linkClass}><FontAwesomeIcon icon={faUserTie} className="nav-icon" /><span className="nav-label">Perfil</span></NavLink>
          </>
        ) : (
          <>
            <div className="nav-section-label">Modo barbero</div>
            <NavLink to="/perfil" className={linkClass}><FontAwesomeIcon icon={faUserTie} className="nav-icon" /><span className="nav-label">Mi Perfil</span></NavLink>
          </>
        )}

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
