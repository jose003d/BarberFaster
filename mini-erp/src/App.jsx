import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Clientes from "./pages/Clientes";
import Barberias from "./pages/Barberias";
import Barberos from "./pages/Barberos";
import Servicios from "./pages/Servicios";
import Usuarios from "./pages/Usuarios";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/clientes" element={<DashboardLayout><Clientes /></DashboardLayout>} />
        <Route path="/barberias" element={<DashboardLayout><Barberias /></DashboardLayout>} />
        <Route path="/barberos" element={<DashboardLayout><Barberos /></DashboardLayout>} />
        <Route path="/servicios" element={<DashboardLayout><Servicios /></DashboardLayout>} />
        <Route path="/usuarios" element={<DashboardLayout><Usuarios /></DashboardLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;