import { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

import Navbar from "../components/Navbar";
import BarberCard from "../components/BarberCard";
import Footer from "../components/Footer";
import { barberias } from "../data/barberias";

import "../css/index.css";
import "../css/barberia_unica.css";

export default function BarberiaDetalle() {
  const { slug } = useParams();

  const barberia = barberias.find((b) => b.slug === slug);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    window.scrollTo(0, 0);
  }, [slug]);

  if (!barberia) {
    return (
      <>
        <Navbar />
        <main className="container my-5 text-center">
          <h1 style={{ color: "var(--color-dorado)" }}>
            Barbería no encontrada
          </h1>
          <Link to="/clientes" className="btn custom-btn mt-3">
            Volver a Clientes
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main>
        <section className="barberia-header container">
          <div className="text-center mb-4" data-aos="fade-up">
            <h1 className="section-title">{barberia.nombre}</h1>
          </div>
          <div className="row align-items-center" data-aos="fade-up">
            <div className="col-md-4 mb-4 mb-md-0 text-center">
              <img src={barberia.logo} className="barberia-logo" alt="Logo" />
            </div>
            <div className="col-md-8">
              <h2>{barberia.nombreSecundario}</h2>
              <p className="barberia-description">{barberia.descripcion}</p>
            </div>
          </div>
        </section>

        <section className="container my-5">
          <div className="text-center mb-4" data-aos="fade-up">
            <h2 className="section-title">Nuestros servicios</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <ul
                className="servicios-list"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                {barberia.servicios.map((servicio, index) => (
                  <li key={index}>{servicio}</li>
                ))}
              </ul>
              <p>
                Conoce a nuestros profesionales: Cada uno con su propio estilo y
                especialidad, listos para asesorarte y ayudarte a lucir tu mejor
                versión.
              </p>
            </div>
          </div>
        </section>

        <section className="container my-5">
          <div className="text-center mb-4" data-aos="fade-up">
            <h2 className="section-title">Nuestros Barberos</h2>
          </div>
          <div className="row justify-content-center">
            <div className="col-lg-8">
              {barberia.barberos.map((barbero, index) => (
                <BarberCard key={index} barbero={barbero} />
              ))}
            </div>
          </div>
        </section>

        <section className="map-container container">
          <div className="text-center mb-4" data-aos="fade-up">
            <h2 className="section-title">Encuéntranos</h2>
          </div>
          <div
            className="row justify-content-center"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <div className="col-lg-10">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.732718615586!2d-74.07908568419394!3d4.598081796582477!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f9bfd2da6cb23%3A0x239d635520a33914!2sBogot%C3%A1%2C%20Cundinamarca!5e0!3m2!1ses!2sco!4v1678886400000!5m2!1ses!2sco"
                className="map-iframe"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
