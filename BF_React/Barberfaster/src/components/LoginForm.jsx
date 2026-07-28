import { useEffect, useRef } from "react";
import { Link } from 'react-router-dom';

export default function LoginForm({ isActive, onToggle }) {
  const usernameRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        usernameRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Iniciando sesión...");
  };

  return (
    <section id="loginForm" className={`form-section ${isActive ? "active" : ""}`}>
      <h2>Iniciar sesión</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="username">Usuario</label>
        <input type="text" id="username" name="username" required ref={usernameRef} />

        <label htmlFor="password">Contraseña</label>
        <input type="password" id="password" name="password" required />

        <button type="submit">Ingresar</button>
        <button type="reset" className="cancelbtn">Cancelar</button>
        <div className="psw">
          ¿Olvidaste tu <Link to="/">contraseña?</Link>
        </div>
      </form>

      <button className="toggle-btn" onClick={onToggle}>
        ¿No tienes cuenta? Regístrate
      </button>
    </section>
  );
}