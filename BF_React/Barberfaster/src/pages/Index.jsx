import { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import Navbar from '../components/Navbar';
import WelcomeSection from '../components/WelcomeSection';
import InfoSection from '../components/InfoSection';
import ServiceSection from '../components/ServiceSection';
import CommentSection from '../components/CommentSection';
import GallerySection from '../components/GallerySection';
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