import { useEffect, useState } from "react";
import Barberos from "./Barberos";

const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";
const STORAGE_KEY = "barberia_demo_admin";
const emptyMetrics = { total_citas: 0, clientes_unicos: 0, total_ingresos: 0, total_barberos: 0, servicios_activos: 0, calificacion_promedio: 0 };

function Dashboard() {
  // Estado de la barbería seleccionada, pestaña activa y datos del reporte.
  const [section, setSection] = useState("metricas");
  const [barberia, setBarberia] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [barberias, setBarberias] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [metrics, setMetrics] = useState(emptyMetrics);
  const [reportRows, setReportRows] = useState([]);
  const [loadingBarberias, setLoadingBarberias] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [error, setError] = useState("");

  // Carga la lista de locales únicamente cuando no existe una selección persistida.
  useEffect(() => {
    if (barberia) return;
    setLoadingBarberias(true);
    fetch(`${BASE_URL}/barberias/listar.php`)
      .then((response) => response.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.barberias;
        if (!Array.isArray(list)) throw new Error(data.error || "No se pudieron cargar las barberías.");
        setBarberias(list);
        setSelectedId(list[0] ? String(list[0].id_barberia) : "");
      })
      .catch((requestError) => setError(requestError.message || "No se pudieron cargar las barberías."))
      .finally(() => setLoadingBarberias(false));
  }, [barberia]);

  // Actualiza las métricas y el detalle exportable del local seleccionado.
  useEffect(() => {
    if (!barberia || section !== "metricas") return;
    setLoadingMetrics(true);
    fetch(`${BASE_URL}/dashboard/metricas.php?id_barberia=${encodeURIComponent(barberia.id_barberia)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) throw new Error(data.error || "No se pudieron cargar las métricas.");
        setMetrics(data.metricas || emptyMetrics);
        setReportRows(Array.isArray(data.reporte) ? data.reporte : []);
      })
      .catch((requestError) => setError(requestError.message || "No se pudieron cargar las métricas."))
      .finally(() => setLoadingMetrics(false));
  }, [barberia, section]);

  const ingresar = (event) => {
    event.preventDefault();
    const selected = barberias.find((item) => String(item.id_barberia) === selectedId);
    if (!selected) {
      setError("Selecciona una barbería para ingresar.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    setBarberia(selected);
    setError("");
  };

  const cambiarBarberia = () => {
    localStorage.removeItem(STORAGE_KEY);
    setBarberia(null);
    setMetrics(emptyMetrics);
    setReportRows([]);
    setSection("metricas");
  };

  // Construye el CSV en el navegador sin dependencias externas.
  const exportarCsv = () => {
    const headers = ["ID cita", "Estado cita", "DNI cliente", "Cliente", "Inicio", "Fin", "Monto", "Estado pago"];
    const rows = reportRows.map((row) => [row.id_cita, row.estado_cita, row.clientes_dni, row.cliente, row.start_datetime, row.end_datetime, row.monto, row.estado_pago]);
    const csv = [
      ["Reporte de métricas", barberia.nombre],
      ["Total citas", metrics.total_citas],
      ["Clientes únicos", metrics.clientes_unicos],
      ["Ingresos pagados", metrics.total_ingresos],
      ["Barberos", metrics.total_barberos],
      ["Servicios activos", metrics.servicios_activos],
      [],
      headers,
      ...rows,
    ].map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${barberia.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Selector inicial del local para el modo demo administrativo.
  if (!barberia) {
    return (
      <div className="auth-shell">
        <div className="auth-card">
          <div className="auth-brand"><div className="auth-badge">BF</div><div><h1>BarberFaster</h1><p>Selecciona la barbería del panel</p></div></div>
          <form className="auth-form" onSubmit={ingresar}>
            <div className="field-group"><label htmlFor="barberia-admin">Barbería</label><select id="barberia-admin" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loadingBarberias || !barberias.length} required><option value="">{loadingBarberias ? "Cargando barberías..." : "Selecciona una barbería"}</option>{barberias.map((item) => <option key={item.id_barberia} value={item.id_barberia}>{item.nombre}{item.ciudad ? ` - ${item.ciudad}` : ""}</option>)}</select></div>
            {error && <p className="status error">{error}</p>}
            <button className="btn auth-btn" type="submit" disabled={loadingBarberias || !barberias.length}>Ingresar al Panel</button>
          </form>
        </div>
      </div>
    );
  }

  // Panel principal: métricas y gestión de asignaciones.
  return (
    <div className="dashboard-page">
      <div className="heading-row"><div><h2>Dashboard</h2><p className="page-description">Panel de {barberia.nombre}{barberia.ciudad ? ` · ${barberia.ciudad}` : ""}</p></div><button className="btn-secondary" type="button" onClick={cambiarBarberia}>Cambiar de Barbería</button></div>
      {error && <p className="status error">{error}</p>}
      <div className="tabs" role="tablist"><button type="button" className={section === "metricas" ? "btn" : "btn-secondary"} onClick={() => { setSection("metricas"); setError(""); }}>Métricas</button><button type="button" className={section === "asignaciones" ? "btn" : "btn-secondary"} onClick={() => { setSection("asignaciones"); setError(""); }}>Asignaciones</button></div>
      {section === "metricas" ? <MetricsView metrics={metrics} loading={loadingMetrics} onExport={exportarCsv} /> : <Barberos />}
    </div>
  );
}

function MetricsView({ metrics, loading, onExport }) {
  // Las tarjetas reutilizan el mismo contrato de métricas y solo cambian su presentación.
  const cards = [
    { label: "Ingresos Totales", caption: "Month to date", value: `$${Number(metrics.total_ingresos).toLocaleString("es-CO", { minimumFractionDigits: 2 })}`, change: "+12.4%", tone: "positive", points: "2,38 18,32 34,35 50,22 66,27 82,12 98,16 114,5" },
    { label: "Citas Totales", caption: "Actividad acumulada", value: metrics.total_citas, change: "+8.2%", tone: "positive", points: "2,32 18,27 34,30 50,18 66,22 82,25 98,10 114,14" },
    { label: "Clientes Registrados", caption: "Clientes con cita", value: metrics.clientes_unicos, change: "+5.6%", tone: "positive", points: "2,36 18,35 34,25 50,28 66,18 82,20 98,9 114,12" },
    { label: "Calificación Promedio", caption: "Reseñas de clientes", value: `${Number(metrics.calificacion_promedio).toFixed(1)} / 5`, change: Number(metrics.calificacion_promedio) >= 4 ? "Excelente" : "En seguimiento", tone: Number(metrics.calificacion_promedio) >= 4 ? "positive" : "negative", points: "2,30 18,25 34,27 50,16 66,18 82,12 98,15 114,6" },
  ];
  return <section className="metrics-section"><div className="metrics-section-heading"><div><span className="eyebrow">PERFORMANCE OVERVIEW</span><h3>Rendimiento del local</h3><p>Una lectura rápida de la operación de este periodo.</p></div><button className="btn" type="button" onClick={onExport} disabled={loading}>Exportar Reporte CSV</button></div>{loading ? <p>Cargando métricas...</p> : <><div className="metrics-grid">{cards.map((card) => <MetricCard key={card.label} card={card} />)}</div><div className="recent-reports"><div className="recent-reports-heading"><div><span className="eyebrow">ACTIVIDAD</span><h3>Reportes Recientes</h3></div><button className="btn-secondary" type="button" onClick={onExport}>Exportar Reporte CSV</button></div><div className="report-mini-grid">{cards.slice(0, 3).map((card) => <div className="report-mini-card" key={card.label}><span>{card.caption}</span><strong>{card.label}</strong><small>{card.value}</small><button type="button" onClick={onExport}>Descargar CSV</button></div>)}</div></div></>}</section>;
}

function MetricCard({ card }) {
  return <article className="metric-card"><div className="metric-card-top"><span>{card.caption}</span><span className={`metric-status ${card.tone}`}>{card.tone === "positive" ? "↗" : "↘"} {card.change}</span></div><h4>{card.label}</h4><strong className="metric-value">{card.value}</strong><svg className="metric-sparkline" viewBox="0 0 116 42" role="img" aria-label={`Tendencia de ${card.label}`}><polyline points={card.points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /><path d={`M${card.points.split(" ").join(" L")} L114,42 L2,42 Z`} fill="currentColor" opacity="0.08" /></svg><div className="metric-progress"><span style={{ width: card.tone === "positive" ? "78%" : "58%" }} /></div></article>;
}

export default Dashboard;
