import Sidebar from "../components/Sidebar";

// Mantiene la navegación lateral y muestra en el área principal la ruta activa.
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
