import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import DashboardLayout from "./layouts/DashboardLayout";
import Barberias from "./pages/Barberias";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Dashboard from "./pages/Dashboard";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("erpbarber_auth") === "true";
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Las rutas administrativas bloquean el acceso cuando hay una sesión demo de barbero.
function AdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem("erpbarber_auth") === "true";
  const isBarberoDemo = Boolean(localStorage.getItem("barbero_demo_sesion"));
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isBarberoDemo ? <Navigate to="/perfil" replace /> : children;
}

function PublicRoute({ children }) {
  const isAuthenticated = localStorage.getItem("erpbarber_auth") === "true";
  return isAuthenticated ? <Navigate to="/barberias" replace /> : children;
}

function App() {
  return (
    <BrowserRouter basename="/erpbarber/barberfaster">
      <Routes>
        {/* Rutas públicas y paneles administrativos protegidos por rol activo. */}
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/dashboard" element={<AdminRoute><DashboardLayout><Dashboard /></DashboardLayout></AdminRoute>} />
        <Route path="/barberias" element={<AdminRoute><DashboardLayout><Barberias /></DashboardLayout></AdminRoute>} />
        <Route path="/usuarios" element={<AdminRoute><DashboardLayout><Usuarios /></DashboardLayout></AdminRoute>} />
        <Route path="/clientes" element={<AdminRoute><DashboardLayout><Clientes /></DashboardLayout></AdminRoute>} />
        <Route path="/perfil" element={<DashboardLayout><Profile /></DashboardLayout>} />
        <Route path="/agenda" element={<AdminRoute><DashboardLayout><Agenda /></DashboardLayout></AdminRoute>} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;