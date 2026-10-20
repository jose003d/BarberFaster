const WelcomeSide = () => {
  return (
    <div className="login-welcome-side">
      <div className="login-welcome-content">
        <h1 className="login-welcome-title">BIENVENIDO A BARBER FASTER</h1>
        <p className="login-welcome-text">
          Tu barbería digital: agenda, gestiona y crece con la plataforma diseñada
          para profesionales del estilo.
        </p>
        <ul className="login-welcome-features">
          <li><span className="feature-icon">✔</span> Agenda citas en segundos</li>
          <li><span className="feature-icon">✔</span> Gestiona tu barbería desde cualquier lugar</li>
          <li><span className="feature-icon">✔</span> Recibe notificaciones en tiempo real</li>
        </ul>
      </div>
    </div>
  );
};

export default WelcomeSide;