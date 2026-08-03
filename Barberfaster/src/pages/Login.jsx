import { useState } from "react";
import LoginForm from "../components/LoginForm";
import RegisterForm from "../components/RegisterForm";
import "../css/loginform.css";

export default function LoginScreen() {
  const [showRegister, setShowRegister] = useState(false);

  return (
    <div className="split-container">
      {/* Columna izquierda con los formularios */}
      <div className="left-column">
        <main className="form-container">
          <LoginForm
            isActive={!showRegister}
            onToggle={() => setShowRegister(true)}
          />

          <RegisterForm
            isActive={showRegister}
            onToggle={() => setShowRegister(false)}
          />
        </main>
      </div>

      {/* Columna derecha */}
      <aside className="welcome-container">
        <img src="img/logo.png" alt="Logo Barber Faster" className="logo" />
        <h1>Bienvenido a Barber Faster</h1>
        <p>
          Tu barbería digital donde puedes agendar citas, ver servicios y
          conectarte con los mejores barberos de la ciudad.
        </p>
      </aside>
    </div>
  );
}
