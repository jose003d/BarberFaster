import { useState } from "react";
import { loginUsuario } from "../services/api";

// Desactivar cuando se quiera volver a validar las credenciales contra el backend.
const TEMPORARY_LOGIN_BYPASS = true;

export default function Login({ onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let user;

      if (TEMPORARY_LOGIN_BYPASS) {
        user = {
          id_usuario: 0,
          nombre: form.email || "Usuario de prueba",
          email: form.email || "demo@barberfaster.local",
          rol: "admin"
        };
      } else {
        const response = await loginUsuario(form.email, form.password);
        if (response && response.status === "error") {
          throw new Error(response.mensaje || "Credenciales inválidas.");
        }
        user = response.usuario || response;
      }

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("erpbarber_auth", "true");
      if (onLoginSuccess) onLoginSuccess(user);
      window.location.reload();
    } catch (err) {
      setError(err.message || "Error al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand-mark" aria-hidden="true">BF</div>
        <p className="login-kicker">BarberFaster · Administración</p>
        <h1 id="login-title">Bienvenido</h1>
        <p className="login-description">Inicia sesión en tu panel administrativo.</p>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label className="login-field">
            Usuario / Correo electrónico
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tucorreo@barberfaster.com"
              autoComplete="username"
            />
          </label>

          <label className="login-field">
            Contraseña
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </label>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Validando acceso..." : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}