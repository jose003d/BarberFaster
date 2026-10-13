import { useState } from "react";
import Barberias from "./Barberias";
import Clientes from "./Clientes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAddressBook, faBuilding, faChartLine } from "@fortawesome/free-solid-svg-icons";

const tabConfig = [
  {
    id: "resumen",
    label: "Resumen",
    icon: faChartLine,
    description: "Vista general de la plataforma"
  },
  {
    id: "clientes",
    label: "Directorio de clientes",
    icon: faAddressBook,
    description: "Base global de clientes"
  },
  {
    id: "barberias",
    label: "Barberías",
    icon: faBuilding,
    description: "Gestión de locales activos"
  }
];

// Controla las secciones de resumen, clientes y barberías del superadministrador.
export default function SuperadminDashboard() {
  const [activeTab, setActiveTab] = useState("resumen");

  return (
    <div className="page-section">
      <div className="heading-row">
        <div>
          <h2>Dashboard SuperAdmin</h2>
          <p className="page-description">Control global de barberías y clientes de la plataforma.</p>
        </div>
      </div>

      {/* Las pestañas cambian entre los módulos globales disponibles. */}
      <nav className="module-navigation" aria-label="Navegación del superadmin">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`module-navigation-link ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={activeTab === tab.id}
          >
            <span className="module-navigation-icon">
              <FontAwesomeIcon icon={tab.icon} />
            </span>
            <span className="module-navigation-text">
              <strong>{tab.label}</strong>
              <small>{tab.description}</small>
            </span>
          </button>
        ))}
      </nav>

      {/* Muestra el resumen inicial o el módulo seleccionado. */}
      <div className="superadmin-module-panel">
        {activeTab === "resumen" && (
          <>
            <section className="panel">
              <div className="section-heading">
                <h3>Resumen de la plataforma</h3>
              </div>
              <p className="page-description">
                Aquí puedes revisar el estado general de la operación, acceder al directorio y administrar las barberías de la red.
              </p>
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>Clientes globales</h3>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("clientes")}>Abrir directorio</button>
              </div>
              <Clientes />
            </section>

            <section className="panel">
              <div className="section-heading">
                <h3>Barberías</h3>
                <button type="button" className="btn-secondary" onClick={() => setActiveTab("barberias")}>Ver gestión</button>
              </div>
              <Barberias />
            </section>
          </>
        )}

        {activeTab === "clientes" && (
          <section className="panel">
            <Clientes />
          </section>
        )}

        {activeTab === "barberias" && (
          <section className="panel">
            <Barberias />
          </section>
        )}
      </div>
    </div>
  );
}
