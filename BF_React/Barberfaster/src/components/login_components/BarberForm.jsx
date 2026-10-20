import { useState } from 'react';

const BarberForm = ({ onAccess }) => {
  const [barberUser, setBarberUser] = useState('');
  const [barberPass, setBarberPass] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (barberUser.trim() && barberPass.trim()) {
      onAccess({ barberUser, barberPass });
    }
  };

  return (
    <div className="brutalist-form-box">
      <div className="form-eyebrow">ÁREA DE NEGOCIOS</div>
      <h2 className="form-title">Acceso para Barberos</h2>
      <p className="form-subtitle">
        Ingresa tus credenciales para gestionar tu barbería, citas y personal.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="brutalist-label">Usuario / Correo</label>
          <input 
            type="text" 
            className="brutalist-input" 
            value={barberUser}
            onChange={(e) => setBarberUser(e.target.value)}
            required 
          />
        </div>
        
        <div className="mb-4">
          <label className="brutalist-label">Contraseña</label>
          <div className="password-input-group">
            <input 
              type={showPassword ? "text" : "password"} 
              className="brutalist-input password-input-field" 
              value={barberPass}
              onChange={(e) => setBarberPass(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required 
            />
            {/* Botón con separador visual estilo prefijo telefónico */}
            <button 
              type="button" 
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
            </button>
          </div>
        </div>

        <button type="submit" className="custom-btn w-100 mb-4" style={{ backgroundColor: 'var(--bauhaus-cyan)' }}>
          INGRESAR AL SISTEMA
        </button>
      </form>
    </div>
  );
};

export default BarberForm;