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
    <div style={{
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: "#121212",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      boxSizing: "border-box",
      fontFamily: "Inter, system-ui, sans-serif"
    }}>
      <style>{`
        .login-input {
          width: 100%;
          padding: 12px 16px;
          background-color: #1e1e1e;
          border: 1px solid #333;
          color: #f1f1f1;
          border-radius: 8px;
          font-size: 0.95rem;
          box-sizing: border-box;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .login-input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.2);
        }
        .login-btn {
          width: 100%;
          padding: 12px;
          background-color: #d4af37;
          color: #121212;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s, transform 0.1s;
        }
        .login-btn:hover {
          background-color: #c4a133;
        }
        .login-btn:active {
          transform: scale(0.98);
        }
      `}</style>

      <div style={{
        backgroundColor: "#1a1a1a",
        padding: "40px",
        borderRadius: "16px",
        width: "100%",
        maxWidth: "420px",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.5)",
        border: "1px solid #2a2a2a",
        boxSizing: "border-box"
      }}>
        {/* Encabezado con Logo / Símbolo BF */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div style={{
            width: "55px",
            height: "55px",
            backgroundColor: "#d4af37",
            color: "#121212",
            fontWeight: "bold",
            fontSize: "1.2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "12px",
            margin: "0 auto 15px",
            boxShadow: "0 4px 12px rgba(212, 175, 55, 0.3)"
          }}>
            BF
          </div>
          <h2 style={{ margin: "0 0 8px", color: "#ffffff", fontSize: "1.5rem", fontWeight: "600" }}>
            BarberFaster
          </h2>
          <p style={{ margin: 0, color: "#888", fontSize: "0.9rem" }}>
            Inicia sesión en tu panel administrativo
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: "rgba(217, 83, 79, 0.15)",
            border: "1px solid #d9534f",
            color: "#f5c6cb",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "20px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#ccc", fontSize: "0.85rem", fontWeight: "500" }}>
              Usuario / Correo electrónico:
            </label>
            <input
              type="text"
              name="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="tucorreo@barberfaster.com"
              className="login-input"
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{ display: "block", marginBottom: "8px", color: "#ccc", fontSize: "0.85rem", fontWeight: "500" }}>
              Contraseña:
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              className="login-input"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? "Validando acceso..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}