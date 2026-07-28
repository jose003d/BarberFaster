import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import AOS from "aos";
import "aos/dist/aos.css";

import Sidebar from "../components/dashboard/Sidebar";
import NegocioSection from "../components/dashboard/NegocioSection";
import FinanzasSection from "../components/dashboard/FinanzasSection";

import "../css/dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("negocio");

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark custom-navbar">
        <div className="container">
          <Link className="navbar-brand" to="/dashboard">
            Barber Faster
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className="collapse navbar-collapse justify-content-end"
            id="navbarNav"
          >
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link active" to="/">
                  Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/#servicios">
                  Servicios
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link" to="/#testimonios">
                  Testimonios
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        <div className="row">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

          <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 py-4">
            <NegocioSection isActive={activeTab === "negocio"} />
            <FinanzasSection isActive={activeTab === "finanzas"} />

            <section
              id="agenda"
              className={activeTab === "agenda" ? "active" : ""}
            >
              <h2>Gestión de agenda</h2>
              <p>En desarrollo.</p>
            </section>

            <section
              id="soporte"
              className={activeTab === "soporte" ? "active" : ""}
            >
              <h2>Soporte</h2>
              <p>En proceso.</p>
            </section>
          </main>
        </div>
      </div>
    </>
  );
}
