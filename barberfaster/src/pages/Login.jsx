import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUsuario } from "../services/api";

function Login() {
  // ==========================
  // Estados del formulario
  // ==========================
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const navigate = useNavigate();

  // ==========================
  // Manejo del envío del formulario
  // ==========================
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validación básica
    if (!email.trim() || !password.trim()) {
      setError("Completa el correo y la contraseña.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Usuario de demostración (mock)
      const demoUser = {
        id_usuario: 5,
        nombre: "Usuario",
        apellido: "Demo",
        email: email.trim(),
        telefono: "",
        documento: "",
        rol: "barbero",
        estado: 1,
      };

      // Guardar datos en localStorage
      localStorage.setItem("erpbarber_auth", "true");
      localStorage.setItem("user", JSON.stringify(demoUser));

      // Redirigir al panel de barberías
      navigate("/barberias", { replace: true });
    } finally {
      setLoading(false);
    }
  };

  // ==========================
  // Renderizado del formulario de login
  // ==========================
  return (
    <div className="auth-shell">
      <div className="auth-card">
        {/* Marca / Logo */}
        <div className="auth-brand">
          <div className="auth-badge">BF</div>
          <div>
            <h1>BarberFaster</h1>
            <p>Acceso a la plataforma</p>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@barberfaster.com"
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="contraseña123"
            />
          </div>

          {/* Mensaje de error */}
          {error && <p className="status error">{error}</p>}

          {/* Botón de envío */}
          <button type="submit" className="btn auth-btn" disabled={loading}>
            {loading ? "Validando..." : "Entrar al sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
