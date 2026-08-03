import { useEffect, useRef } from 'react';

export default function RegisterForm({ isActive, onToggle }) {
  const fullnameRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        fullnameRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Registrando usuario...");
  };

  return (
    <section id="registroForm" className={`form-section ${isActive ? 'active' : ''}`}>
      <h2>Registrarse</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="fullname">Nombre completo</label>
        <input 
          type="text" 
          id="fullname" 
          name="fullname" 
          required 
          ref={fullnameRef}
        />

        <label htmlFor="email">Correo electrónico</label>
        <input type="email" id="email" name="email" required />

        <label htmlFor="newuser">Nombre de usuario</label>
        <input type="text" id="newuser" name="newuser" required />

        <label htmlFor="newpass">Contraseña</label>
        <input type="password" id="newpass" name="newpass" required />

        <button type="submit">Registrarse</button>
        <button type="reset" className="cancelbtn">Cancelar</button>
      </form>
      
      <button className="toggle-btn" onClick={onToggle}>
        ¿Ya tienes cuenta? Inicia sesión
      </button>
    </section>
  );
}