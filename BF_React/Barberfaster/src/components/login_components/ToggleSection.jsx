const ToggleSection = ({ isClientView, onToggle }) => {
  return (
    <div className="form-toggle-section">
      <p className="toggle-text">
        {isClientView 
          ? "¿Eres un barbero registrado? Haz clic en este botón" 
          : "Para acceder como cliente haz clic en este botón"}
      </p>
      <button 
        type="button" 
        onClick={onToggle} 
        className="custom-btn toggle-btn"
      >
        {isClientView ? "ACCESO BARBEROS" : "ACCESO CLIENTES"}
      </button>
    </div>
  );
};

export default ToggleSection;