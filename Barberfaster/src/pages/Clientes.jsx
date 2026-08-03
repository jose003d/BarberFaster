import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import Navbar from '../components/Navbar';
import BarberGrid from '../components/BarberGrid';
import HelpSection from '../components/HelpSection';
import Footer from '../components/Footer';

import '../css/clientes.css';

export default function ClientesPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true
    });
  }, []);

  return (
    <>
      <Navbar />
      
      <main className="container my-5">
        <div className="text-center mb-5" data-aos="fade-up">
          <h1 className="section-title">Barberias disponibles en tu zona</h1>
          <p className="lead" style={{ color: '#d3d3d3' }}>
            Encuentra la inspiración para tu próximo corte. Haz clic en cualquier imagen para ver más detalles.
          </p>
        </div>
        
        <BarberGrid />
        
      </main>

      <HelpSection />
      <Footer />
    </>
  );
}