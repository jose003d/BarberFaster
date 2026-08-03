import { useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function FinanzasSection({ isActive }) {
  const [isWeekly, setIsWeekly] = useState(false);

  const datos = isWeekly
    ? {
        usuarios: "915",
        ventas: "$870.300",
        alertas: "12 nuevas",
        grafica: [120, 135, 110, 140, 130, 140, 140],
      }
    : {
        usuarios: "120",
        ventas: "$130.000",
        alertas: "3 nuevas",
        grafica: [18, 27, 14, 21, 16, 13, 11],
      };

  const chartData = {
    labels: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    datasets: [
      {
        label: isWeekly
          ? "Usuarios nuevos (semanales)"
          : "Usuarios nuevos (diarios)",
        data: datos.grafica,
        backgroundColor: "#ffd700",
        borderColor: "#c0a000",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    scales: { y: { beginAtZero: true } },
  };

  const exportCSV = () => {
    const rows = [
      ["Métrica", "Valor"],
      ["Usuarios", datos.usuarios],
      ["Ventas", datos.ventas],
      ["Alertas", datos.alertas],
    ];
    const csv = "\uFEFF" + rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estadisticas.csv";
    link.click();
  };

  return (
    <section id="finanzas" className={isActive ? "active" : ""}>
      <h2>Resumen general del sistema</h2>
      <div className="d-flex justify-content-end mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={() => setIsWeekly(!isWeekly)}
        >
          {isWeekly ? "Ver datos diarios" : "Ver datos semanales"}
        </button>
      </div>

      <div className="row g-4">
        <div className="col-md-4">
          <div className="card text-bg-primary">
            <div className="card-body">
              <h5 className="card-title">Visitas:</h5>
              <p className="card-text fs-4">{datos.usuarios}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-bg-success">
            <div className="card-body">
              <h5 className="card-title">Ganancias:</h5>
              <p className="card-text fs-4">{datos.ventas}</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-bg-warning">
            <div className="card-body">
              <h5 className="card-title">Alertas:</h5>
              <p className="card-text fs-4">{datos.alertas}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-5">
        <div className="card-body">
          <h5 className="card-title">Usuarios nuevos por día</h5>
          {/* En lugar de un canvas vacío, usamos el componente <Bar /> de React */}
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mt-3 text-center">
        <button className="btn btn-outline-success" onClick={exportCSV}>
          Exportar Datos
        </button>
      </div>
    </section>
  );
}
