import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';

// Importar Componentes Globales
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Importar Estilos 
import '../styles/clientes.css';

// Importar Componentes Específicos
import HeroClientes from '../components/clientes_components/HeroClientes';
import BarberiasGrid from '../components/clientes_components/BarberiasGrid';
import Beneficios from '../components/clientes_components/Beneficios';
import HelpSection from '../components/clientes_components/HelpSection';

const Clientes = () => {
  useEffect(() => {
    AOS.init({
      once: true,
      duration: 800
    });
  }, []);

  return (
    <>
      <Navbar />
      <HeroClientes />
      <BarberiasGrid />
      <Beneficios />
      <HelpSection />
      <Footer />
    </>
  );
};

export default Clientes;