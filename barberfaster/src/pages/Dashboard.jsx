function Dashboard() {
  return (
    <div className="dashboard-page">
      {/* ==========================
          Encabezado del Dashboard
          ========================== */}
      <div className="heading-row">
        <div>
          <h2>Dashboard</h2>
          <p className="page-description">
            Bienvenido al panel de control de BarberFaster.
          </p>
        </div>
      </div>

      {/* ==========================
          Panel de visión general
          ========================== */}
      <div className="panel">
        <h3>Visión General</h3>
        <p>
          {/* Aquí puedes añadir métricas, estadísticas o resúmenes
              como número de barberías, clientes, citas, etc. */}
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
