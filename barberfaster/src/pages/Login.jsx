import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  // ==========================
  // Estados del formulario
  // ==========================
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]       = useState("superadmin");
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
        rol: role,
        estado: 1,
      };

      // Guardar datos en localStorage
      localStorage.setItem("erpbarber_auth", "true");
      localStorage.setItem("user", JSON.stringify(demoUser));
      localStorage.removeItem("barbero_demo_sesion");

      const destination = demoUser.rol === "barbero" ? "/barbero" : demoUser.rol === "admin" ? "/dashboard" : "/superadmin";
      navigate(destination, { replace: true });
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

          <div className="field-group">
            <label htmlFor="role">Perfil de acceso</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="superadmin">Superadmin SaaS</option>
              <option value="admin">Administrador local</option>
              <option value="barbero">Barbero</option>
            </select>
          </div>

          {/* Mensaje de error */}
          {error && <p className="status error">{error}</p>}

          {/* Botón de envío */}
          <button type="submit" className="btn auth-btn" disabled={loading}>
            {loading ? "Validando..." : "Entrar al sistema"}
          </button>
          <button type="button" className="btn-secondary auth-btn" onClick={() => navigate("/cliente")}>
            Acceso cliente
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
