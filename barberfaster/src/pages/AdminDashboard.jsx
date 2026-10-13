import { Link } from "react-router-dom";
import Dashboard from "./Dashboard";
import Barberias from "./Barberias";
import Usuarios from "./Usuarios";

// Combina los indicadores del dashboard con accesos rápidos a la operación local.
export default function AdminDashboard() {
  return <div><Dashboard /><div className="panel"><div className="heading-row"><h3>Operación local</h3><div><Link className="btn-secondary" to="/admin/barberias">Barbería</Link> <Link className="btn-secondary" to="/admin/barberos">Barberos</Link> <Link className="btn-secondary" to="/admin/tarifas">Tarifas</Link></div></div><Barberias /><Usuarios /></div></div>;
}
