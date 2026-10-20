import { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';

const FinanzasModulo = () => {
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const [isSemanal, setIsSemanal] = useState(false);

  useEffect(() => {
    if (canvasRef.current) {
      chartRef.current = new Chart(canvasRef.current, {
        type: "bar",
        data: {
          labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
          datasets: [{
            label: "Usuarios nuevos (diarios)",
            data: [18, 27, 14, 21, 16, 13, 11],
            backgroundColor: "#ff7a1a",
            borderColor: "#101010",
            borderWidth: 2,
            borderRadius: 0,
          }],
        },
        options: {
          responsive: true,
          plugins: { legend: { labels: { color: "#101010", font: { family: "Satoshi", weight: "bold" } } } },
          scales: {
            x: { ticks: { color: "#101010", font: { weight: "bold" } }, grid: { color: "#d3d3d3" } },
            y: { beginAtZero: true, ticks: { color: "#101010", font: { weight: "bold" } }, grid: { color: "#d3d3d3" } },
          },
        },
      });
    }
    return () => { if (chartRef.current) chartRef.current.destroy(); };
  }, []);

  const toggleDatos = () => {
    const nextState = !isSemanal;
    setIsSemanal(nextState);
    if (chartRef.current) {
      chartRef.current.data.datasets[0].data = nextState 
        ? [120, 135, 110, 140, 130, 140, 140] 
        : [18, 27, 14, 21, 16, 13, 11];
      chartRef.current.data.datasets[0].label = nextState 
        ? "Usuarios nuevos (semanales)" 
        : "Usuarios nuevos (diarios)";
      chartRef.current.update();
    }
  };

  return (
    <section className="dash-section active">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h2 className="dash-section-title m-0">Resumen general</h2>
        <button onClick={toggleDatos} className="custom-btn" style={{ padding: "0.5rem 1rem" }}>
          <i className={`bi ${isSemanal ? 'bi-calendar3' : 'bi-calendar-week'} me-1`}></i> 
          Ver datos {isSemanal ? 'diarios' : 'semanales'}
        </button>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="dash-stat-card dash-stat-card--visitas">
            <div className="dash-stat-icon"><i className="bi bi-people-fill"></i></div>
            <div>
              <span className="dash-stat-label">Visitas</span>
              <span className="dash-stat-value">{isSemanal ? "915" : "120"}</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dash-stat-card dash-stat-card--ganancias">
            <div className="dash-stat-icon"><i className="bi bi-cash-stack"></i></div>
            <div>
              <span className="dash-stat-label">Ganancias</span>
              <span className="dash-stat-value">{isSemanal ? "$870.300" : "$130.000"}</span>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="dash-stat-card dash-stat-card--alertas">
            <div className="dash-stat-icon"><i className="bi bi-bell-fill"></i></div>
            <div>
              <span className="dash-stat-label">Alertas</span>
              <span className="dash-stat-value">{isSemanal ? "12" : "3"} nuevas</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dash-card p-4">
        <h5 className="form-eyebrow mb-3">USUARIOS NUEVOS POR DÍA</h5>
        <canvas ref={canvasRef} height="100"></canvas>
      </div>
    </section>
  );
};

export default FinanzasModulo;