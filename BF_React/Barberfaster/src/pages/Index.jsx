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
import InfoIntro from '../components/index_components/InfoIntro';
import Services from '../components/index_components/Services';
import Testimonials from '../components/index_components/Testimonials';

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
        <InfoIntro />
        <Services />
        <Testimonials />
      </main>
      <Footer />
    </>
  );
};

export default Index;