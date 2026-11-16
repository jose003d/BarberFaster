import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/App.css";
import Login from "./features/auth/pages/Login.jsx";
import ProtectedRoute from "./features/auth/ProtectedRoute.jsx";
import MagneticButtons from "./shared/components/MagneticButtons.jsx";
import DashboardLayout from "./shared/layouts/DashboardLayout.jsx";
import Barberias from "./features/barberias/pages/Barberias.jsx";
import Barberos from "./features/barberos/pages/Barberos.jsx";
import Usuarios from "./features/usuarios/pages/Usuarios.jsx";
import Clientes from "./features/clientes/pages/Clientes.jsx";
import Profile from "./features/auth/pages/Profile.jsx";
import Agenda from "./features/agenda/pages/Agenda.jsx";
import Dashboard from "./features/dashboard/pages/Dashboard.jsx";
import SuperadminDashboard from "./features/superadmin/pages/SuperadminDashboard.jsx";
import SuperadminClientes from "./features/superadmin/pages/SuperadminClientes.jsx";
import AdminDashboard from "./features/dashboard/pages/AdminDashboard.jsx";
import { BarberoWorkspace } from "./features/barberos/pages/BarberoWorkspace.jsx";
import ClienteDashboard from "./features/clientes/pages/ClienteDashboard.jsx";
import BarberiaDiscovery from "./features/barberias/pages/BarberiaDiscovery.jsx";
import SolicitarBarberia from "./features/barberias/pages/SolicitarBarberia.jsx";

function App() {
  const administrativeRoles = ["SUPERADMIN", "ADMINISTRADOR"];

  return (
    <>
      <MagneticButtons />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<BarberiaDiscovery />} />
          <Route path="/seleccionar-barberia" element={<BarberiaDiscovery />} />
          <Route path="/login" element={<Login />} />
          <Route path="/solicitar-barberia" element={<SolicitarBarberia />} />
          <Route
            path="/cambiar-contrasena"
            element={
              <ProtectedRoute roles={["ADMINISTRADOR", "BARBERO"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/reservar" element={<Agenda reservaPublica />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={administrativeRoles}>
                <DashboardLayout><Dashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/personal"
            element={
              <ProtectedRoute roles={administrativeRoles}>
                <DashboardLayout><Barberos /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/barberias"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <DashboardLayout><Barberias mostrarTodas /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute roles={administrativeRoles}>
                <DashboardLayout><Usuarios /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <DashboardLayout><Clientes /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute roles={["ADMINISTRADOR", "BARBERO"]}>
                <DashboardLayout><Profile /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <ProtectedRoute roles={administrativeRoles}>
                <DashboardLayout><Agenda /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <DashboardLayout><SuperadminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin/clientes"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <DashboardLayout><SuperadminClientes /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["SUPERADMIN"]}>
                <DashboardLayout><AdminDashboard /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/barbero"
            element={
              <ProtectedRoute roles={["BARBERO"]}>
                <DashboardLayout><BarberoWorkspace /></DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/cliente" element={<ClienteDashboard />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
