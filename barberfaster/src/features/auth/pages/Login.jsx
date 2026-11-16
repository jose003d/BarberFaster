import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  loginUsuario,
  PANEL_POR_ROL,
  restablecerContrasena,
  solicitarRecuperacionContrasena,
} from "../auth.js";
import logoBarberFaster from "../../../assets/logo-barberfaster.png";

function validarContrasena(contrasena) {
  return Array.from(contrasena).length >= 8
    && new TextEncoder().encode(contrasena).length <= 72;
}

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ identificador: "", password: "" });
  const [recuperacion, setRecuperacion] = useState({
    correo: "",
    codigo: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [vista, setVista] = useState("login");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");

    const identificador = form.identificador.trim();
    const esCorreo = identificador.includes("@");
    if (
      !identificador
      || (esCorreo
        ? (identificador.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identificador))
        : identificador.length > 30)
    ) {
      setError("Ingresa un documento de hasta 30 caracteres o un correo válido de hasta 120 caracteres.");
      return;
    }
    if (!form.password || form.password.length > 4096) {
      setError("Ingresa una contraseña válida.");
      return;
    }

    setLoading(true);
    try {
      const response = await loginUsuario(identificador, form.password);
      const user = response.usuario;

      if (!user || !PANEL_POR_ROL[user.rol]) {
        throw new Error("No se pudo validar la cuenta. Inténtalo de nuevo.");
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("erpbarber_auth", "true");
      window.dispatchEvent(new Event("barberfaster-role-change"));
      onLoginSuccess?.(user);
      navigate(PANEL_POR_ROL[user.rol], { replace: true });
    } catch (loginError) {
      setError(loginError.message || "No se pudo iniciar sesión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const iniciarRecuperacion = () => {
    setRecuperacion((actual) => ({
      ...actual,
      correo: form.identificador.includes("@") ? form.identificador.trim() : actual.correo,
    }));
    setError("");
    setMensaje("");
    setVista("solicitar");
  };

  const handleSolicitarCodigo = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    const correo = recuperacion.correo.trim();
    if (correo.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError("Ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      await solicitarRecuperacionContrasena(correo);
      setRecuperacion((actual) => ({ ...actual, correo }));
      setVista("restablecer");
      setMensaje("Si el correo corresponde a una cuenta elegible, recibirás un código. Revisa también la carpeta de spam; si lo pediste hace menos de un minuto, utiliza el código anterior.");
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar el código. Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestablecer = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    if (!/^\d{6}$/.test(recuperacion.codigo)) {
      setError("Ingresa el código de 6 dígitos que recibiste por correo.");
      return;
    }
    if (!validarContrasena(recuperacion.contrasena)) {
      setError("La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.");
      return;
    }
    if (recuperacion.contrasena !== recuperacion.confirmarContrasena) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await restablecerContrasena(
        recuperacion.correo.trim(),
        recuperacion.codigo,
        recuperacion.contrasena,
      );
      setForm((actual) => ({ ...actual, password: "" }));
      setRecuperacion({
        correo: "",
        codigo: "",
        contrasena: "",
        confirmarContrasena: "",
      });
      setVista("login");
      setMensaje("Tu contraseña se restableció. Ya puedes iniciar sesión.");
    } catch (resetError) {
      setError(resetError.message || "No se pudo restablecer la contraseña. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const volverAlLogin = () => {
    setVista("login");
    setError("");
    setMensaje("");
  };

  const titulo = vista === "login"
    ? "Bienvenido"
    : vista === "solicitar"
      ? "Recuperar contraseña"
      : "Restablecer contraseña";

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <img className="login-brand-logo" src={logoBarberFaster} alt="BarberFaster" />
        <p className="login-kicker">BarberFaster · Acceso al personal</p>
        <h1 id="login-title">{titulo}</h1>
        <p className="login-description">
          {vista === "login"
            ? "Inicia sesión con tu documento o correo y contraseña."
            : vista === "solicitar"
              ? "Te enviaremos un código temporal al correo asociado a tu cuenta."
              : "Ingresa el código del correo y elige una contraseña nueva."}
        </p>

        {vista === "login" && (
          <form onSubmit={handleSubmit} className="login-form">
            <label className="login-field">
              Documento o correo electrónico
              <input
                type="text"
                name="identificador"
                value={form.identificador}
                onChange={(event) => setForm({ ...form, identificador: event.target.value })}
                placeholder="Documento o correo"
                autoComplete="username"
                maxLength={120}
                required
              />
            </label>

            <label className="login-field">
              Contraseña
              <span className="login-password-control">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  placeholder="Tu contraseña"
                  autoComplete="current-password"
                  maxLength={4096}
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Validando acceso..." : "Iniciar sesión"}
            </button>
            <button type="button" className="login-recovery-link" onClick={iniciarRecuperacion}>
              ¿Olvidaste tu contraseña?
            </button>
            <Link className="login-back-link" to="/">
              ← Volver a la página principal
            </Link>
          </form>
        )}

        {vista === "solicitar" && (
          <form onSubmit={handleSolicitarCodigo} className="login-form">
            <label className="login-field">
              Correo electrónico registrado
              <input
                type="email"
                name="correo-recuperacion"
                value={recuperacion.correo}
                onChange={(event) => setRecuperacion({ ...recuperacion, correo: event.target.value })}
                placeholder="nombre@correo.com"
                autoComplete="email"
                maxLength={120}
                required
              />
            </label>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Enviando código..." : "Enviar código"}
            </button>
            <button type="button" className="login-recovery-link" onClick={volverAlLogin}>
              ← Volver al inicio de sesión
            </button>
          </form>
        )}

        {vista === "restablecer" && (
          <form onSubmit={handleRestablecer} className="login-form">
            <label className="login-field">
              Código de 6 dígitos
              <input
                type="text"
                name="codigo-recuperacion"
                value={recuperacion.codigo}
                onChange={(event) => setRecuperacion({
                  ...recuperacion,
                  codigo: event.target.value.replace(/\D/g, "").slice(0, 6),
                })}
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
            </label>
            <label className="login-field">
              Nueva contraseña
              <input
                type="password"
                name="nueva-contrasena"
                value={recuperacion.contrasena}
                onChange={(event) => setRecuperacion({ ...recuperacion, contrasena: event.target.value })}
                autoComplete="new-password"
                maxLength={72}
                required
              />
            </label>
            <label className="login-field">
              Confirma la nueva contraseña
              <input
                type="password"
                name="confirmar-contrasena"
                value={recuperacion.confirmarContrasena}
                onChange={(event) => setRecuperacion({ ...recuperacion, confirmarContrasena: event.target.value })}
                autoComplete="new-password"
                maxLength={72}
                required
              />
            </label>
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Restableciendo..." : "Guardar nueva contraseña"}
            </button>
            <button type="button" className="login-recovery-link" onClick={iniciarRecuperacion}>
              Solicitar otro código
            </button>
          </form>
        )}

        {error && <div className="login-error" role="alert">{error}</div>}
        {mensaje && <div className="login-notice" role="status">{mensaje}</div>}
      </section>
    </main>
  );
}
