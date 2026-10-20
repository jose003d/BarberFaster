import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Importar Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Importar Estilos 
import '../styles/index.css';

// Importar Componentes Específicos
import Hero from '../components/index_components/Hero';
import BarberiasGrid from "../components/index_components/BarberiasGrid";
import Beneficios from "../components/index_components/Beneficios";

const Index = () => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800
    });
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <div id="catalogo-barberias" style={{ padding: "3rem 0" }}>
          <BarberiasGrid />
        </div>
        <Beneficios />
      </main>
      <Footer />
    </>
  );
};

export default Index;