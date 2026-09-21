import { Link } from "react-router-dom";
import Profile from "./Profile";

export default function BarberoWorkspace() {
  return <div><div className="heading-row"><div><h2>Workspace del barbero</h2><p className="page-description">Agenda operativa y cierre de citas.</p></div><Link className="btn" to="/barbero/agenda">Abrir agenda</Link></div><Profile /></div>;
}
