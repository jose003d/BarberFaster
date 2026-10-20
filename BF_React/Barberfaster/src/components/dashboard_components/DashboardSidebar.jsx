import { useNavigate } from 'react-router-dom';

const DashboardSidebar = ({ user, activeTab, setActiveTab }) => {
  const navigate = useNavigate();
  const initial = user?.nombreCompleto ? user.nombreCompleto.charAt(0).toUpperCase() : "B";
  const firstName = user?.nombreCompleto ? user.nombreCompleto.split(" ")[0] : "Barbero";

  const handleLogout = () => {
    localStorage.removeItem("bf_user");
    navigate('/login');
  };

  return (
    <div className="brutalist-card-container p-4">
      <div className="dash-profile">
        <div className="dash-avatar">{initial}</div>
        <h4>{firstName}</h4>
        <p className="dash-barberia-name">{user?.barberia || "Mi barbería"}</p>
      </div>
      
      <nav className="dash-tabs mb-4">
        <button className={`dash-tab ${activeTab === 'negocio' ? 'active' : ''}`} onClick={() => setActiveTab('negocio')}>
          <i className="bi bi-building me-2"></i> Tu negocio
        </button>
        <button className={`dash-tab ${activeTab === 'finanzas' ? 'active' : ''}`} onClick={() => setActiveTab('finanzas')}>
          <i className="bi bi-graph-up-arrow me-2"></i> Finanzas
        </button>
        <button className={`dash-tab ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => setActiveTab('agenda')}>
          <i className="bi bi-calendar3 me-2"></i> Agenda
        </button>
      </nav>

      <div className="dash-sidebar-footer pt-3" style={{ borderTop: "2px solid var(--bauhaus-ink)" }}>
        <button className="custom-btn w-100" style={{ backgroundColor: "#ffcccc", color: "#c31818" }} onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;