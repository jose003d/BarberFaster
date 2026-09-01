import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import DashboardLayout from "./layouts/DashboardLayout";
import Barberias from "./pages/Barberias";
import Usuarios from "./pages/Usuarios";
import Clientes from "./pages/Clientes";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Agenda from "./pages/Agenda";
import Barberos from "./pages/Barberos";

function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("erpbarber_auth") === "true";
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = localStorage.getItem("erpbarber_auth") === "true";
  return isAuthenticated ? <Navigate to="/barberias" replace /> : children;
}

function App() {
  return (
    <BrowserRouter basename="/erpbarber/barberfaster">
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/barberias" element={<ProtectedRoute><DashboardLayout><Barberias /></DashboardLayout></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute><DashboardLayout><Usuarios /></DashboardLayout></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><DashboardLayout><Clientes /></DashboardLayout></ProtectedRoute>} />
        <Route path="/barberos" element={<ProtectedRoute><DashboardLayout><Barberos /></DashboardLayout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><DashboardLayout><Profile /></DashboardLayout></ProtectedRoute>} />
        <Route path="/agenda" element={<ProtectedRoute><DashboardLayout><Agenda /></DashboardLayout></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}



export default App;