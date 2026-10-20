import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Componentes Específicos de Contacto
import ContactHero from '../components/contactanos_components/ContactHero';
import ContactForm from '../components/contactanos_components/ContactForm';
import ContactInfo from '../components/contactanos_components/ContactInfo';

// Importa los estilos 
import '../styles/contacto.css'; 

const Contactanos = () => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800
    });
  }, []);

  return (
    <div className="page-wrapper" style={{ backgroundColor: "var(--bauhaus-paper)", minHeight: "100vh" }}>
      <Navbar />
      
      <main>
        {/* Hero */}
        <ContactHero />

        {/* Formulario de Contacto */}
        <div className="container py-5">
          <ContactForm />
        </div>

        {/* Tarjetas de Información */}
        <div className="container pb-5">
          <h3 className="text-center mb-4" style={{ fontFamily: "Chillax, sans-serif", fontWeight: 700, color: "var(--bauhaus-ink)" }}>
            INFORMACIÓN DIRECTA
          </h3>
          <ContactInfo />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Contactanos;