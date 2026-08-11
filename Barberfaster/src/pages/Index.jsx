import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

import Navbar from '../components/Navbar';
import WelcomeSection from '../components/index_components/WelcomeSection';
import InfoSection from '../components/index_components/InfoSection';
import ServiceSection from '../components/index_components/ServiceSection';
import CommentSection from '../components/index_components/CommentSection';
import GallerySection from '../components/index_components/GallerySection';
import Footer from '../components/Footer';

import '../css/index.css'; 

export default function IndexPage() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true
    });
  }, []);

  return (
    <>
      <Navbar />
      <WelcomeSection />
      <InfoSection />
      <ServiceSection />
      <CommentSection />
      <GallerySection />
      <Footer />
    </>
  );
}