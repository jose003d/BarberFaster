import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Módulos del Dashboard
import DashboardSidebar from '../components/dashboard_components/DashboardSidebar';
import NegocioModulo from '../components/dashboard_components/NegocioModulo';
import FinanzasModulo from '../components/dashboard_components/FinanzasModulo';
import AgendaModulo from '../components/dashboard_components/AgendaModulo';

import { getBizData, saveBizData } from '../services/dashboardService';
import '../styles/dashboard.css';

const DashboardBarberias = () => {
  const [user, setUser] = useState(null);
  const [bizData, setBizData] = useState(null);
  const [activeTab, setActiveTab] = useState('negocio');
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('bf_user'));
      if (!storedUser || storedUser.tipo !== 'barbero') {
        navigate('/');
      } else {
        setUser(storedUser);
        setBizData(getBizData(storedUser.id, storedUser));
      }
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  const updateBizData = (newData) => {
    setBizData(newData);
    saveBizData(user.id, newData);
  };

  if (!user || !bizData) return null;

  return (
    <div className="page-wrapper" style={{ backgroundColor: "var(--bauhaus-paper)", minHeight: "100vh" }}>
      <Navbar />
      
      <main className="container my-5 py-3">
        <div className="row align-items-start">
          
          {/* Lado Izquierdo */}
          <div className="col-lg-3 sticky-lg-top" style={{ top: "100px", zIndex: 10 }}>
            <DashboardSidebar user={user} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Lado Derecho */}
          <div className="col-lg-9 ps-lg-5">
            {activeTab === 'negocio' && <NegocioModulo user={user} bizData={bizData} updateBizData={updateBizData} />}
            {activeTab === 'finanzas' && <FinanzasModulo />}
            {activeTab === 'agenda' && <AgendaModulo />}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DashboardBarberias;