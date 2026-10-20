const PerfilSidebar = () => {
  return (
    <div className="perfil-sidebar d-none d-lg-block">
      <div className="brutalist-card-container p-4">
        <h4 className="form-eyebrow mb-4">NAVEGACIÓN</h4>
        <ul className="perfil-nav-list list-unstyled m-0">
          <li>
            <a href="#mis-citas" className="perfil-nav-link">
              <i className="bi bi-calendar-event me-2"></i> Mis Citas
            </a>
          </li>
          <li>
            <a href="#historial-citas" className="perfil-nav-link">
              <i className="bi bi-clock-history me-2"></i> Historial
            </a>
          </li>
          <li>
            <a href="#mi-perfil" className="perfil-nav-link">
              <i className="bi bi-person me-2"></i> Datos Personales
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PerfilSidebar;