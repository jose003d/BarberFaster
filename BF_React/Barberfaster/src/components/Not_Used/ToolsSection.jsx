const toolsData = [
  {
    icon: 'bi-people',
    title: 'Gestión de Clientes',
    text: 'Base de datos completa con historial de servicios',
    delay: 100
  },
  {
    icon: 'bi-graph-up-arrow',
    title: 'Aumenta Ventas',
    text: 'Sistema de reservas online que atrae más clientes',
    delay: 200
  },
  {
    icon: 'bi-cash-coin',
    title: 'Cobros Rápidos',
    text: 'Sistema de pagos integrado y eficiente',
    delay: 300
  },
  {
    icon: 'bi-bar-chart-line',
    title: 'Reportes Detallados',
    text: 'Analiza tu negocio con estadísticas en tiempo real',
    delay: 400
  }
];

const ToolsSection = () => {
  return (
    <section className="tools-section">
      <div className="text-center mb-5" data-aos="fade-up">
        <h2 className="section-title">Herramientas para Profesionales</h2>
        <p className="section-subtitle">
          BarberFaster te proporciona todas las herramientas que necesitas para gestionar tu barbería de manera eficiente
        </p>
      </div>
      <div className="row g-4">
        {toolsData.map((tool, index) => (
          <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay={tool.delay} key={index}>
            <div className="tool-card">
              <div className="tool-icon-circle">
                <i className={`bi ${tool.icon}`} aria-hidden="true"></i>
              </div>
              <h5 className="tool-title">{tool.title}</h5>
              <p className="tool-text">{tool.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ToolsSection;