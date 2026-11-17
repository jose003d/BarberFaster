import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, BASE_URL, handleResponse } from "../../../shared/services/api.js";
import { PANEL_POR_ROL } from "../auth.js";

function obtenerUsuarioSesion() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("No se pudo leer el perfil de la sesión:", error);
    return null;
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const usuario = obtenerUsuarioSesion();
  const cambioObligatorio = Boolean(usuario?.debe_cambiar_contrasena);
  const [contrasenas, setContrasenas] = useState({
    actual: "",
    nueva: "",
    confirmar: "",
  });
  // En "Mi perfil" el formulario queda oculto hasta que el usuario decide cambiar su contraseña.
  const [mostrarFormulario, setMostrarFormulario] = useState(cambioObligatorio);
  const [actualizando, setActualizando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const actualizarContrasena = async (event) => {
    event.preventDefault();
    setMensaje("");
    setError("");

    if (contrasenas.nueva !== contrasenas.confirmar) {
      setError("La confirmación no coincide con la contraseña nueva.");
      return;
    }

    setActualizando(true);
    try {
      const respuesta = await apiFetch("Auth/cambiar_contrasena.php", {
        method: "POST",
        body: {
          contrasena_actual: contrasenas.actual,
          contrasena_nueva: contrasenas.nueva,
        },
      });

      if (respuesta.status !== "success") {
        setError(respuesta.mensaje || "No se pudo actualizar la contraseña.");
        return;
      }

      if (cambioObligatorio) {
        const respuestaSesion = await fetch(`${BASE_URL}/Auth/sesion.php`, {
          credentials: "same-origin",
          cache: "no-store",
        }).then(handleResponse);
        const usuarioActualizado = respuestaSesion.usuario;

        if (!usuarioActualizado || usuarioActualizado.debe_cambiar_contrasena) {
          throw new Error("No se pudo confirmar el cambio de contraseña. Inicia sesión nuevamente.");
        }

        localStorage.setItem("user", JSON.stringify(usuarioActualizado));
        localStorage.setItem("erpbarber_auth", "true");
        window.dispatchEvent(new Event("barberfaster-role-change"));
        setContrasenas({ actual: "", nueva: "", confirmar: "" });
        navigate(PANEL_POR_ROL[usuarioActualizado.rol], { replace: true });
        return;
      }

      setContrasenas({ actual: "", nueva: "", confirmar: "" });
      setMostrarFormulario(false);
      setMensaje(respuesta.mensaje || "La contraseña se actualizó correctamente.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo actualizar la contraseña.");
    } finally {
      setActualizando(false);
    }
  };

  if (!usuario) {
    return <p className="status error" role="alert">No se encontró la información de la sesión.</p>;
  }

  return (
    <main className={cambioObligatorio ? "password-setup-page" : "page-section account-page"}>
      <section className={cambioObligatorio ? "password-setup-card" : "account-page-card"}>
        <p className="password-setup-eyebrow">BarberFaster · Seguridad de la cuenta</p>
        <h1 className="account-page-title">{cambioObligatorio ? "Configura tu acceso" : "Mi perfil"}</h1>
        {cambioObligatorio ? (
          <p className="page-description password-setup-description" role="status">
            Para proteger tu cuenta, cambia la contraseña temporal antes de entrar al panel de tu barbería.
          </p>
        ) : (
          <>
            <p className="page-description">Información de tu cuenta de BarberFaster.</p>
            <dl className="account-profile">
              <div><dt>Nombre</dt><dd>{usuario.nombre_completo || usuario.nombre}</dd></div>
              <div><dt>Correo</dt><dd>{usuario.correo || usuario.email}</dd></div>
              <div><dt>Teléfono</dt><dd>{usuario.telefono || "No registrado"}</dd></div>
              <div><dt>Rol</dt><dd>{usuario.rol === "ADMINISTRADOR" ? "Administrador" : usuario.rol === "BARBERO" ? "Barbero" : usuario.rol}</dd></div>
            </dl>
          </>
        )}
        <section className="password-change" aria-labelledby="password-change-title">
          <h3 id="password-change-title">{cambioObligatorio ? "Crea tu contraseña" : "Contraseña"}</h3>
          {cambioObligatorio && (
            <p>Ingresa la contraseña temporal que recibiste por correo y define una nueva de al menos 8 caracteres.</p>
          )}
          {!mostrarFormulario && (
            <button
              className="login-btn"
              type="button"
              onClick={() => {
                setMensaje("");
                setError("");
                setMostrarFormulario(true);
              }}
            >
              Cambiar contraseña
            </button>
          )}
          {mostrarFormulario && (
          <form className="password-change-form" onSubmit={actualizarContrasena}>
            <label className="login-field">
              {cambioObligatorio ? "Contraseña temporal" : "Contraseña actual"}
              <input
                type="password"
                autoComplete="current-password"
                placeholder={cambioObligatorio ? "Contraseña temporal entregada" : "Tu contraseña actual"}
                value={contrasenas.actual}
                onChange={(event) => setContrasenas({ ...contrasenas, actual: event.target.value })}
                maxLength={4096}
                required
              />
            </label>
            <label className="login-field">
              Contraseña nueva
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                value={contrasenas.nueva}
                onChange={(event) => setContrasenas({ ...contrasenas, nueva: event.target.value })}
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            <label className="login-field">
              Confirmar contraseña nueva
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Repite la contraseña nueva"
                value={contrasenas.confirmar}
                onChange={(event) => setContrasenas({ ...contrasenas, confirmar: event.target.value })}
                minLength={8}
                maxLength={72}
                required
              />
            </label>
            <button className="login-btn" type="submit" disabled={actualizando}>
              {actualizando ? "Guardando..." : cambioObligatorio ? "Guardar y entrar al panel" : "Guardar contraseña nueva"}
            </button>
            {!cambioObligatorio && (
              <button
                className="btn-secondary"
                type="button"
                disabled={actualizando}
                onClick={() => {
                  setContrasenas({ actual: "", nueva: "", confirmar: "" });
                  setError("");
                  setMostrarFormulario(false);
                }}
              >
                Cancelar
              </button>
            )}
          </form>
          )}
          {error && <p className="password-change-message error" role="alert">{error}</p>}
          {mensaje && <p className="password-change-message success" role="status">{mensaje}</p>}
        </section>
      </section>
    </main>
  );
}
