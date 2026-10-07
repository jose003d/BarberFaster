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
  faRightFromBracket,
  faXmark
} from "@fortawesome/free-solid-svg-icons";

function Sidebar() {
  const navigate = useNavigate();
  const [barberoActivo, setBarberoActivo] = useState(() => Boolean(localStorage.getItem("barbero_demo_sesion")));
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const syncRole = () => setBarberoActivo(Boolean(localStorage.getItem("barbero_demo_sesion")));
    window.addEventListener("barberfaster-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("barberfaster-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  useEffect(() => {
    if (!menuAbierto) return undefined;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuAbierto(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuAbierto]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("erpbarber_auth");
    localStorage.removeItem("barbero_demo_sesion");
    window.dispatchEvent(new Event("barberfaster-role-change"));
    setMenuAbierto(false);
    navigate("/login", { replace: true });
  };

  const menuItems = barberoActivo
    ? [
        { label: "Workspace", to: "/barbero", icon: faGaugeHigh },
        { label: "Mi perfil", to: "/perfil", icon: faUserTie }
      ]
    : [
        { label: "Dashboard local", to: "/dashboard", icon: faGaugeHigh },
        { label: "Superadmin", to: "/superadmin", icon: faScissors },
        { label: "Barberías", to: "/barberias", icon: faScissors },
        { label: "Personal", to: "/usuarios", icon: faUsers },
        { label: "Clientes", to: "/clientes", icon: faUserGroup },
        { label: "Agenda", to: "/agenda", icon: faCalendarDays },
        { label: "Perfil de barbero", to: "/perfil", icon: faUserTie }
      ];

  return (
    <aside className={`staggered-menu${menuAbierto ? " is-open" : ""}`} data-open={menuAbierto || undefined}>
      <header className="staggered-menu-header">
        <button
          className="staggered-menu-toggle"
          type="button"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuAbierto}
          aria-controls="erp-staggered-menu-panel"
          onClick={() => setMenuAbierto((open) => !open)}
        >
          <span className="staggered-menu-icon" aria-hidden="true">
            {menuAbierto ? <FontAwesomeIcon icon={faXmark} /> : <><i /><i /></>}
          </span>
          <span>{menuAbierto ? "Cerrar" : "Menú"}</span>
        </button>

        <NavLink
          className="staggered-menu-brand"
          to={barberoActivo ? "/barbero" : "/dashboard"}
          aria-label="BarberFaster, inicio"
          onClick={() => setMenuAbierto(false)}
        >
          <img
            src="/erpbarber/barberfaster/backend/uploads/logo.png"
            alt=""
            className="staggered-menu-logo"
          />
          <span>BarberFaster</span>
        </NavLink>
      </header>

      <button
        className="staggered-menu-backdrop"
        type="button"
        aria-label="Cerrar menú"
        tabIndex={menuAbierto ? 0 : -1}
        onClick={() => setMenuAbierto(false)}
      />
      <div className="staggered-menu-layers" aria-hidden="true">
        <span />
        <span />
      </div>

      <nav
        className="staggered-menu-panel"
        id="erp-staggered-menu-panel"
        aria-label={barberoActivo ? "Menú de barbero" : "Menú de administración"}
        aria-hidden={!menuAbierto}
      >
        <div className="staggered-menu-panel-inner">
          <p className="staggered-menu-eyebrow">
            {barberoActivo ? "Modo barbero" : "Administración"}
          </p>
          <ol className="staggered-menu-list">
            {menuItems.map(({ label, to, icon }, index) => (
              <li
                className="staggered-menu-item"
                key={to}
                style={{ "--menu-index": index }}
              >
                <NavLink
                  to={to}
                  end
                  className={({ isActive }) => `staggered-menu-link${isActive ? " active" : ""}`}
                  tabIndex={menuAbierto ? 0 : -1}
                  onClick={() => setMenuAbierto(false)}
                >
                  <FontAwesomeIcon icon={icon} aria-hidden="true" />
                  <span>{label}</span>
                </NavLink>
              </li>
            ))}
          </ol>

          <button
            className="staggered-menu-logout"
            type="button"
            tabIndex={menuAbierto ? 0 : -1}
            onClick={handleLogout}
          >
            <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
