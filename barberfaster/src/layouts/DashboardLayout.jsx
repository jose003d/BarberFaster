import Sidebar from "../components/Sidebar";

// ==========================
// Componente de Layout principal
// ==========================
// Recibe como prop `children` el contenido dinámico que se renderiza
// en la sección principal, mientras el Sidebar permanece fijo.
export default function DashboardLayout({ children }) {
  return (
    <div className="app-shell">
      {/* Sidebar fijo en la aplicación */}
      <Sidebar />

      {/* Área principal de contenido */}
      <main className="content">
        {children}
      </main>
    </div>
  );
}
