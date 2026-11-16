import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logoBarberFaster from "../../assets/logo-barberfaster.png";
import { cerrarSesion } from "../../features/auth/auth.js";
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

function obtenerRolGuardado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.rol || null;
  } catch (error) {
    console.error("No se pudo leer el rol guardado:", error);
    return null;
  }
}

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuarioRol, setUsuarioRol] = useState(obtenerRolGuardado);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  // Escucha cambios de rol y sincroniza el estado del menú con la sesión.
  useEffect(() => {
    const syncRole = () => {
      setUsuarioRol(obtenerRolGuardado());
    };
    window.addEventListener("barberfaster-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("barberfaster-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

  // Bloquea el scroll y permite cerrar el menú con Escape mientras está abierto.
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

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await cerrarSesion();
    } catch (error) {
      setLogoutError(error.message || "No se pudo cerrar la sesión. Inténtalo de nuevo.");
      return;
    }

    localStorage.removeItem("user");
    localStorage.removeItem("erpbarber_auth");
    window.dispatchEvent(new Event("barberfaster-role-change"));
    setMenuAbierto(false);
    navigate("/login", { replace: true });
  };

  // Construye las opciones de navegación apropiadas al rol activo.
  const menuItems = usuarioRol === "BARBERO"
    ? [
        { label: "Mi agenda", to: "/barbero", icon: faGaugeHigh },
        { label: "Mi perfil", to: "/perfil", icon: faUserTie }
      ]
    : usuarioRol === "SUPERADMIN"
      ? [
        { label: "Métricas", to: "/dashboard?section=metricas", icon: faGaugeHigh, section: "metricas" },
        { label: "Superadmin", to: "/superadmin", icon: faScissors },
        { label: "Barberías", to: "/barberias", icon: faScissors },
        { label: "Personal", to: "/personal", icon: faUsers },
        { label: "Usuarios", to: "/usuarios", icon: faUserGroup },
        { label: "Clientes", to: "/clientes", icon: faUserGroup },
        { label: "Agenda", to: "/dashboard?section=agenda", icon: faCalendarDays, section: "agenda" },
        { label: "Perfil del establecimiento", to: "/dashboard?section=perfil", icon: faGaugeHigh, section: "perfil" }
      ]
      : [
          { label: "Métricas", to: "/dashboard?section=metricas", icon: faGaugeHigh, section: "metricas" },
          { label: "Personal", to: "/personal", icon: faUsers },
          { label: "Usuarios", to: "/usuarios", icon: faUserGroup },
          { label: "Agenda", to: "/dashboard?section=agenda", icon: faCalendarDays, section: "agenda" },
          { label: "Perfil del establecimiento", to: "/dashboard?section=perfil", icon: faGaugeHigh, section: "perfil" },
          { label: "Mi perfil", to: "/perfil", icon: faUserTie }
        ];
  const homePath = usuarioRol === "SUPERADMIN"
    ? "/superadmin"
    : usuarioRol === "BARBERO"
      ? "/barbero"
      : "/dashboard";

  // Renderiza la cabecera, el fondo interactivo y el panel de navegación móvil.
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
          to={homePath}
          aria-label="BarberFaster, inicio"
          onClick={() => setMenuAbierto(false)}
        >
          <img
            src={logoBarberFaster}
            alt="BarberFaster"
            className="staggered-menu-logo"
          />
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
        aria-label={usuarioRol === "BARBERO" ? "Menú de barbero" : "Menú de administración"}
        aria-hidden={!menuAbierto}
      >
        <div className="staggered-menu-panel-inner">
          <p className="staggered-menu-eyebrow">
            {usuarioRol === "BARBERO" ? "Mi panel" : "Administración"}
          </p>
          <ol className="staggered-menu-list">
            {menuItems.map(({ label, to, icon, section }, index) => (
              <li
                className="staggered-menu-item"
                key={to}
                style={{ "--menu-index": index }}
              >
                <NavLink
                  to={to}
                  state={to === "/perfil"
                    ? { returnTo: `${location.pathname}${location.search}${location.hash}` }
                    : undefined}
                  end
                  className={({ isActive }) => {
                    const activeSection = section
                      ? location.pathname === "/dashboard" && location.search === `?section=${section}`
                      : isActive;
                    return `staggered-menu-link${activeSection ? " active" : ""}`;
                  }}
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
          {logoutError && <p className="staggered-menu-error" role="alert">{logoutError}</p>}
        </div>
      </nav>
    </aside>
  );
}

export default Sidebar;
