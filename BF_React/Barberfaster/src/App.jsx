import { Routes, Route } from 'react-router-dom';
import IndexPage from './pages/Index';
import LoginScreen from './pages/Login';
import ClientesPage from './pages/Clientes';
import BarberiaDetalle from './pages/BarberiaDetalle';
// import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/clientes" element={<ClientesPage />} />
      <Route path="/barberia/:slug" element={<BarberiaDetalle />} />
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
    </Routes>
  );
}

export default App;