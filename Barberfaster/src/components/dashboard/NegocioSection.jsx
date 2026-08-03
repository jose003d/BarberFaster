export default function NegocioSection({ isActive }) {
  return (
    <section id="negocio" className={isActive ? 'active' : ''}>
      <div className="text-center">
        <h2>Bienvenido al Dashboard</h2>
        <h5><strong>Usa las pestañas de la izquierda para navegar entre las diferentes secciones.</strong></h5>
        <p>Ahora mismo te encuentras visualizando Tu Negocio</p>

        <h1>Tu negocio</h1>
        <img src="img/logo.png" alt="Imagen del negocio" />
        <h1>Ubicación</h1>

        <div className="d-flex justify-content-center mt-4">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3976.9484805128214!2d-74.08174938573507!3d4.609710043523263!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e3f99a17b8b7b09%3A0x9f2f07bdf7a2baf2!2sBogot%C3%A1%2C%20Colombia!5e0!3m2!1ses!2sco!4v1698285742047!5m2!1ses!2sco"
            allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">
          </iframe>
        </div>
      </div>
    </section>
  );
}