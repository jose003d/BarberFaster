import { Link } from 'react-router-dom';

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'negocio', label: 'Tu negocio' },
    { id: 'finanzas', label: 'Finanzas' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'soporte', label: 'Soporte' }
  ];

  return (
    <nav className="col-md-3 col-lg-2 d-md-block sidebar text-center p-3">
      <div className="profile-img mb-3">
        <img src="img/cat2.jpg" alt="Foto de perfil" className="img-fluid rounded-circle shadow" />
        <h4>Bienvenido</h4>
      </div>
      <div className="nav flex-column mt-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="logout-btn">
        <Link to="/login" className="btn btn-danger w-100 mt-4">Cerrar sesión</Link>
      </div>
    </nav>
  );
}