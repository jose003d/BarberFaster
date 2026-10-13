import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Importar Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Importar Estilos
import '../styles/barberos.css';

// Importar Componentes Específicos
import HeroBarberos from '../components/barberos_components/HeroBarberos';
import ToolsSection from '../components/barberos_components/ToolsSection';
import RegBarberoModal from '../components/barberos_components/RegBarberoModal';
import TestimonialsBarberos from '../components/barberos_components/TestimonialsBarberos';

const Barberos = () => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800
    });
  }, []);

  return (
    <>
      <Navbar />
      <HeroBarberos />
      
      <main className="container my-5">
        <ToolsSection />

        {/* Botón activador del modal de registro */}
        <section className="text-center my-5" data-aos="fade-up">
          <button
            type="button"
            className="btn custom-btn btn-lg"
            data-bs-toggle="modal"
            data-bs-target="#regBarberoModal"
          >
            <i className="bi bi-plus-circle me-2"></i>Registrar mi barbería
          </button>
        </section>

        {/* Modal de registro de barbería */}
        <RegBarberoModal />

        {/* Sección de testimonios */}
        <TestimonialsBarberos />
      </main>

      <Footer />
    </>
  );
};

export default Barberos;