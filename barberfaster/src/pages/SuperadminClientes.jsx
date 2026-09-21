import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faChartLine } from "@fortawesome/free-solid-svg-icons";
import Clientes from "./Clientes";

export default function SuperadminClientes() {
  return <div className="page-section">
    <div className="heading-row">
      <div><h2>Directorio global de clientes</h2><p className="page-description">Consulta y administra los clientes registrados en todas las barberías.</p></div>
    </div>
    <nav className="module-navigation" aria-label="Navegación del directorio">
      <Link className="module-navigation-link" to="/superadmin"><FontAwesomeIcon icon={faArrowLeft} /> Volver al dashboard</Link>
      <Link className="module-navigation-link active" to="/superadmin/clientes"><FontAwesomeIcon icon={faChartLine} /> Directorio</Link>
    </nav>
    <Clientes />
  </div>;
}