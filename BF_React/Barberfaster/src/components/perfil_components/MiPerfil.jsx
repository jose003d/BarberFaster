const MiPerfil = ({ user }) => {
  if (!user) return null;

  return (
    <section id="mi-perfil" className="mb-5 pt-4">
      <h2 className="form-title mb-4">Datos Personales</h2>
      
      <div className="brutalist-card-container" style={{ maxWidth: "100%", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: "2rem" }}>
        
        <div className="perfil-avatar-box">
          <i className="bi bi-person-bounding-box"></i>
        </div>

        <div className="perfil-info-grid flex-grow-1">
          <div className="row g-4">
            
            <div className="col-sm-6">
              <span className="perfil-data-label">DNI / Cédula</span>
              <strong className="perfil-data-value">{user.dni || 'No registrado'}</strong>
            </div>

            {/* Si es barbero se muestra el user */}
            {user.tipo === 'barbero' && (
              <div className="col-sm-6">
                <span className="perfil-data-label">Usuario</span>
                <strong className="perfil-data-value">@{user.usuario || 'usuario_desconocido'}</strong>
              </div>
            )}

            <div className="col-sm-6">
              <span className="perfil-data-label">Tipo de Cuenta</span>
              <strong className="perfil-data-value" style={{ textTransform: 'capitalize' }}>{user.tipo || 'Cliente'}</strong>
            </div>

            <div className="col-sm-6">
              <span className="perfil-data-label">Teléfono Asociado</span>
              <strong className="perfil-data-value">{user.telefono || 'No registrado'}</strong>
            </div>
            
          </div>
        </div>

      </div>
    </section>
  );
};

export default MiPerfil;