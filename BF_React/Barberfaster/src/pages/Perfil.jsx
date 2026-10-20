import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Componentes del perfil
import PerfilSidebar from '../components/perfil_components/PerfilSidebar';
import MisCitas from '../components/perfil_components/MisCitas';
import HistorialCitas from '../components/perfil_components/HistorialCitas';
import MiPerfil from '../components/perfil_components/MiPerfil';

// CSS
import '../styles/perfil.css';

const Perfil = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('bf_user');
      if (!storedUser) {
        navigate('/login');
      } else {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="page-wrapper" style={{ backgroundColor: "var(--bauhaus-paper)", minHeight: "100vh" }}>
      <Navbar />
      
      <main className="container my-5 py-3">
        <div className="row align-items-start">
          
          {/* Lado Izquierdo */}
          <div className="col-lg-3 sticky-lg-top" style={{ top: "100px", zIndex: 10 }}>
            <PerfilSidebar />
          </div>

          {/* Lado Derecho */}
          <div className="col-lg-9 ps-lg-5">
            <MisCitas userId={user.id} />
            <div className="title-orange-separator my-5" style={{ width: "100%", opacity: "0.3" }}></div>
            
            <HistorialCitas userId={user.id} />
            <div className="title-orange-separator my-5" style={{ width: "100%", opacity: "0.3" }}></div>
            
            <MiPerfil user={user} />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Perfil;