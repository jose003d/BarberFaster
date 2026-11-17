import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { BASE_URL, handleResponse } from "../../shared/services/api.js";
import { PANEL_POR_ROL, SUPERADMIN_HABILITADO } from "./auth.js";

export default function ProtectedRoute({ children, roles }) {
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Las rutas exclusivas del SUPERADMIN no existen fuera de su dominio.
  const soloSuperadmin = roles.length === 1 && roles[0] === "SUPERADMIN";
  const rutaOculta = soloSuperadmin && !SUPERADMIN_HABILITADO;

  useEffect(() => {
    let activa = true;

    if (rutaOculta) {
      setCargando(false);
      return () => {
        activa = false;
      };
    }

    // El backend decide si la sesión es válida en este dominio
    // (un SUPERADMIN fuera de su dominio recibe una sesión vacía).
    fetch(`${BASE_URL}/Auth/sesion.php`, {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then(handleResponse)
      .then((respuesta) => {
        if (!respuesta.usuario) throw new Error("La sesión no contiene un usuario válido.");
        if (!activa) return;
        localStorage.setItem("user", JSON.stringify(respuesta.usuario));
        localStorage.setItem("erpbarber_auth", "true");
        setUsuario(respuesta.usuario);
      })
      .catch(() => {
        if (!activa) return;
        localStorage.removeItem("user");
        localStorage.removeItem("erpbarber_auth");
        setUsuario(null);
      })
      .finally(() => {
        if (activa) setCargando(false);
      });

    return () => {
      activa = false;
    };
  }, []);

  if (rutaOculta) {
    return <Navigate to="/" replace />;
  }

  if (cargando) {
    return <p className="auth-route-status" role="status">Validando la sesión...</p>;
  }

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(usuario.rol)) {
    return <Navigate to={PANEL_POR_ROL[usuario.rol] || "/login"} replace />;
  }

  if (usuario.debe_cambiar_contrasena && location.pathname !== "/cambiar-contrasena") {
    return <Navigate to="/cambiar-contrasena" replace />;
  }

  return children;
}
