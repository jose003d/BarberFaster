export default function GallerySection() {
  return (
    <section className="container my-5">
      <div className="text-center mb-4" data-aos="fade-up">
        <h2>Nuestros trabajos</h2>
        <p>Algunos de los estilos que hemos creado</p>
      </div>
      <div className="row g-3 gallery">
        <div className="col-6 col-md-3" data-aos="fade-up"><img src="img/cat.jpg" className="w-100" alt="Galería 1" /></div>
        <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="100"><img src="img/cat2.jpg" className="w-100" alt="Galería 2" /></div>
        <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="200"><img src="img/cat3.jpg" className="w-100" alt="Galería 3" /></div>
        <div className="col-6 col-md-3" data-aos="fade-up" data-aos-delay="300"><img src="img/cat4.jpg" className="w-100" alt="Galería 4" /></div>
      </div>
    </section>
  );
}