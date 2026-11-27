import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logoBarberFaster from "../../assets/logo-barberfaster.png";
import { cerrarSesion } from "../../features/auth/auth.js";
import {
  faUsers,
  faUserGroup,
  faCalendarDays,
  faGaugeHigh,
  faStore,
  faUserTie,
  faRightFromBracket,
  faCreditCard,
  faClipboardList,
  faAddressBook,
  faScissors
} from "@fortawesome/free-solid-svg-icons";

function obtenerAtiendeGuardado() {
  try {
    return Boolean(JSON.parse(localStorage.getItem("user") || "null")?.atiende_clientes);
  } catch {
    return false;
  }
}

function obtenerRolGuardado() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null")?.rol || null;
  } catch (error) {
    console.error("No se pudo leer el rol guardado:", error);
    return null;
  }
}

// Barra de navegación superior fija: los enlaces del panel siempre visibles.
function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuarioRol, setUsuarioRol] = useState(obtenerRolGuardado);
  const [atiendeClientes, setAtiendeClientes] = useState(obtenerAtiendeGuardado);
  const [logoutError, setLogoutError] = useState("");

  // Escucha cambios de rol y sincroniza el menú con la sesión.
  useEffect(() => {
    const syncRole = () => {
      setUsuarioRol(obtenerRolGuardado());
      setAtiendeClientes(obtenerAtiendeGuardado());
    };
    window.addEventListener("barberfaster-role-change", syncRole);
    window.addEventListener("storage", syncRole);
    return () => {
      window.removeEventListener("barberfaster-role-change", syncRole);
      window.removeEventListener("storage", syncRole);
    };
  }, []);

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
    navigate("/login", { replace: true });
  };

  // Construye las opciones de navegación apropiadas al rol activo.
  const menuItems = usuarioRol === "BARBERO"
    ? [
        { label: "Mi perfil de barbero", to: "/barbero", icon: faScissors },
        { label: "Mi cuenta", to: "/perfil", icon: faUserTie }
      ]
    : usuarioRol === "SUPERADMIN"
      // El superadmin solo administra la plataforma, nunca la operación de una barbería.
      ? [
        { label: "Resumen", to: "/superadmin", icon: faGaugeHigh },
        { label: "Solicitudes", to: "/superadmin/solicitudes", icon: faClipboardList },
        { label: "Barberías", to: "/superadmin/barberias", icon: faStore },
        { label: "Clientes", to: "/superadmin/clientes", icon: faAddressBook }
      ]
      : [
          { label: "Métricas", to: "/dashboard?section=metricas", icon: faGaugeHigh, section: "metricas" },
          { label: "Personal", to: "/personal", icon: faUsers },
          { label: "Usuarios", to: "/usuarios", icon: faUserGroup },
          { label: "Agenda", to: "/dashboard?section=agenda", icon: faCalendarDays, section: "agenda" },
          { label: "Establecimiento", to: "/dashboard?section=perfil", icon: faStore, section: "perfil" },
          { label: "Pagos en línea", to: "/dashboard?section=pagos", icon: faCreditCard, section: "pagos" },
          // El administrador que también atiende tiene su propio perfil de barbero.
          ...(atiendeClientes ? [{ label: "Mi perfil de barbero", to: "/barbero", icon: faScissors }] : []),
          { label: "Mi cuenta", to: "/perfil", icon: faUserTie }
        ];
  const homePath = usuarioRol === "SUPERADMIN"
    ? "/superadmin"
    : usuarioRol === "BARBERO"
      ? "/barbero"
      : "/dashboard";

  return (
    <header className="top-nav">
      <NavLink className="top-nav-brand" to={homePath} aria-label="BarberFaster, inicio">
        <img src={logoBarberFaster} alt="BarberFaster" className="top-nav-logo" />
      </NavLink>

      <nav
        className="top-nav-list-wrap"
        aria-label={usuarioRol === "BARBERO" ? "Menú de barbero" : usuarioRol === "SUPERADMIN" ? "Menú de la plataforma" : "Menú de administración"}
        style={{ display: "contents" }}
      >
        <ul className="top-nav-list">
          {menuItems.map(({ label, to, icon, section }) => (
            <li key={to}>
              <NavLink
                to={to}
                state={to === "/perfil"
                  ? { returnTo: `${location.pathname}${location.search}${location.hash}` }
                  : undefined}
                end
                className={({ isActive }) => {
                  const activeSection = section
                    ? location.pathname === "/dashboard" && new URLSearchParams(location.search).get("section") === section
                    : isActive;
                  return `top-nav-link${activeSection ? " active" : ""}`;
                }}
              >
                <FontAwesomeIcon icon={icon} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="top-nav-actions">
        <button className="top-nav-logout btn-quiet" type="button" onClick={handleLogout} aria-label="Cerrar sesión">
          <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
      {logoutError && <p className="top-nav-error" role="alert">{logoutError}</p>}
    </header>
  );
}

export default Sidebar;
