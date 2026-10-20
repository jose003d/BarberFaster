import { Routes, Route } from 'react-router-dom';

// Importación de rutas
import Index from './pages/Index';
import Login from './pages/Login';
import Contactanos from './pages/Contactanos';
import Perfil from './pages/Perfil';
import DashboardBarberias from './pages/DashboardBarberia';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/contacto" element={<Contactanos />} />
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/dashboard" element={<DashboardBarberias />} />
      </Routes>
    </div>
  );
}

export default App;