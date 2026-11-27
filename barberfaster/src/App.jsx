import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/App.css";
import Login from "./features/auth/pages/Login.jsx";
import ProtectedRoute from "./features/auth/ProtectedRoute.jsx";
import { ES_HOST_SUPERADMIN } from "./features/auth/auth.js";
import DashboardLayout from "./shared/layouts/DashboardLayout.jsx";
import Barberias from "./features/barberias/pages/Barberias.jsx";
import Barberos from "./features/barberos/pages/Barberos.jsx";
import Usuarios from "./features/usuarios/pages/Usuarios.jsx";
import Profile from "./features/auth/pages/Profile.jsx";
import Agenda from "./features/agenda/pages/Agenda.jsx";
import Dashboard from "./features/dashboard/pages/Dashboard.jsx";
import SuperadminDashboard from "./features/superadmin/pages/SuperadminDashboard.jsx";
import SuperadminClientes from "./features/superadmin/pages/SuperadminClientes.jsx";
import SuperadminSolicitudesPage from "./features/superadmin/pages/SuperadminSolicitudesPage.jsx";
import { BarberoWorkspace } from "./features/barberos/pages/BarberoWorkspace.jsx";
import ClienteDashboard from "./features/clientes/pages/ClienteDashboard.jsx";
import BarberiaDiscovery from "./features/barberias/pages/BarberiaDiscovery.jsx";
import SolicitarBarberia from "./features/barberias/pages/SolicitarBarberia.jsx";

function App() {
  // SUPERADMIN administra la PLATAFORMA (/superadmin/*). La operación de una barbería
  // (métricas, agenda, personal, establecimiento, pagos) es solo del ADMINISTRADOR.
  const administrativeRoles = ["ADMINISTRADOR"];
  const soloSuperadmin = (pagina) => (
    <ProtectedRoute roles={["SUPERADMIN"]}>
      <DashboardLayout>{pagina}</DashboardLayout>
    </ProtectedRoute>
  );

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={ES_HOST_SUPERADMIN ? <Navigate to="/superadmin" replace /> : <BarberiaDiscovery />}
          />
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
            path="/usuarios"
            element={
              <ProtectedRoute roles={administrativeRoles}>
                <DashboardLayout><Usuarios /></DashboardLayout>
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
          {/* Panel de la plataforma: solo SUPERADMIN. */}
          <Route path="/superadmin" element={soloSuperadmin(<SuperadminDashboard />)} />
          <Route path="/superadmin/solicitudes" element={soloSuperadmin(<SuperadminSolicitudesPage />)} />
          <Route path="/superadmin/barberias" element={soloSuperadmin(<Barberias mostrarTodas />)} />
          <Route path="/superadmin/clientes" element={soloSuperadmin(<SuperadminClientes />)} />
          {/* Rutas antiguas del superadmin: se redirigen a su nueva ubicación. */}
          <Route path="/barberias" element={<Navigate to="/superadmin/barberias" replace />} />
          <Route path="/clientes" element={<Navigate to="/superadmin/clientes" replace />} />
          <Route path="/admin" element={<Navigate to="/superadmin" replace />} />
          <Route
            path="/barbero"
            element={
              <ProtectedRoute roles={["BARBERO", "ADMINISTRADOR"]}>
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
