import { useState } from "react";

const BASE_URL = "/erpbarber/barberfaster/backend";

export default function ClienteDashboard() {
  const [dni, setDni] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cliente, setCliente] = useState(null);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState("");

  const login = async (event) => {
    event.preventDefault();
    setError("");
    const response = await fetch(`${BASE_URL}/clientes/login.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dni, codigo }) });
    const data = await response.json();
    if (!data.success) { setError(data.error || "No se pudo iniciar sesión."); return; }
    setCliente(data.cliente);
    const appointments = await fetch(`${BASE_URL}/citas/listar_cliente.php?dni_cliente=${encodeURIComponent(dni)}`).then((result) => result.json());
    setCitas(appointments.citas || []);
  };

  const cancel = async (idCita) => {
    const response = await fetch(`${BASE_URL}/citas/cancelar.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id_cita: idCita, dni_cliente: dni }) });
    const data = await response.json();
    if (!data.success) { setError(data.error || "No se pudo cancelar la cita."); return; }
    setCitas((current) => current.map((cita) => cita.id_cita === idCita ? { ...cita, estado: "CANCELADA" } : cita));
  };

  if (!cliente) return <div className="auth-shell"><form className="auth-card auth-form" onSubmit={login}><h1>Dashboard Cliente</h1><div className="field-group"><label htmlFor="cliente-dni">DNI</label><input id="cliente-dni" value={dni} onChange={(event) => setDni(event.target.value)} required /></div><div className="field-group"><label htmlFor="cliente-codigo">Código local</label><input id="cliente-codigo" value={codigo} onChange={(event) => setCodigo(event.target.value)} required /></div>{error && <p className="status error">{error}</p>}<button className="btn auth-btn">Ingresar</button></form></div>;
  return <div className="page-section"><div className="heading-row"><div><h2>Hola, {cliente.nombre}</h2><p className="page-description">Historial, estado y recibo simple de tus citas.</p></div></div>{error && <p className="status error">{error}</p>}<div className="table-wrapper"><table><thead><tr><th>Barbería</th><th>Fecha</th><th>Barbero</th><th>Estado</th><th>Recibo</th><th /></tr></thead><tbody>{citas.map((cita) => <tr key={cita.id_cita}><td>{cita.barberia}</td><td>{new Date(cita.start_datetime).toLocaleString("es-CO")}</td><td>{cita.barbero}</td><td>{cita.estado}</td><td>{cita.estado === "COMPLETADA" ? `Cita #${cita.id_cita}` : "-"}</td><td>{cita.estado === "PENDIENTE" && <button className="btn-secondary" onClick={() => cancel(cita.id_cita)}>Cancelar</button>}</td></tr>)}</tbody></table></div></div>;
}
