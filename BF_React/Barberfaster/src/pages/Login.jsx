import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Estilos
import '../styles/login.css';

// Componentes de Login Específicos
import ClientForm from '../components/login_components/ClientForm';
import BarberForm from '../components/login_components/BarberForm';
import ToggleSection from '../components/login_components/ToggleSection';
import WelcomeSide from '../components/login_components/WelcomeSide';


const Login = () => {
  const navigate = useNavigate();
  const [isClientView, setIsClientView] = useState(true);

  // Redirigir si ya hay una sesión activa
  useEffect(() => {
    const user = localStorage.getItem('bf_user');
    if (user) navigate('/');
  }, [navigate]);

  const handleClientAccess = (clientData) => {
    const sessionUser = {
      id: Date.now(),
      nombre: `Cliente ${clientData.dni.substring(0, 4)}`,
      dni: clientData.dni,
      telefono: `+57${clientData.telefono}`,
      tipo: 'cliente'
    };
    localStorage.setItem('bf_user', JSON.stringify(sessionUser));
    navigate('/');
  };

  const handleBarberAccess = (barberData) => {
    const sessionUser = {
      id: Date.now(),
      usuario: barberData.barberUser,
      tipo: 'barbero',
      barberia: 'Mi Barbería Local'
    };
    localStorage.setItem('bf_user', JSON.stringify(sessionUser));
    navigate('/dashboard');
  };

  return (
    <>
      <Navbar />
      <div className="login-wrapper">
        
        {/* Lado Izquierdo */}
        <div className="login-form-side">
          <div className="brutalist-card-container">
            
            {isClientView ? (
              <ClientForm onAccess={handleClientAccess} />
            ) : (
              <BarberForm onAccess={handleBarberAccess} />
            )}

            <ToggleSection 
              isClientView={isClientView} 
              onToggle={() => setIsClientView(!isClientView)} 
            />

          </div>
        </div>

        {/* Lado Derecho */}
        <WelcomeSide />

      </div>
      <Footer />
    </>
  );
};

export default Login;