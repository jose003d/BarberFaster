import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faChartLine,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "./BarberiaBenefits.css";

const beneficios = [
  {
    icon: faCalendarCheck,
    titulo: "Agenda organizada",
    texto: "Administra las citas de tu barbería desde un solo lugar.",
  },
  {
    icon: faChartLine,
    titulo: "Más visibilidad",
    texto: "Haz que nuevos clientes encuentren tu negocio y conozcan tus servicios.",
  },
  {
    icon: faUsers,
    titulo: "Tu equipo conectado",
    texto: "Organiza barberos, horarios y servicios en el mismo espacio.",
  },
];

export default function BarberiaBenefits() {
  return (
    <section className="business-benefits" aria-labelledby="business-benefits-title">
      <div className="business-benefits-heading">
        <p className="discovery-eyebrow"><span>03</span> CRECE CON BARBERFASTER</p>
        <h2 id="business-benefits-title">Tu barbería, mejor conectada.</h2>
        <p>Herramientas sencillas para organizar tu negocio y atender más clientes.</p>
      </div>

      <div className="business-benefits-grid">
        {beneficios.map(({ icon, titulo, texto }, index) => (
          <article className="business-benefit-card" key={titulo}>
            <span className="business-benefit-icon" aria-hidden="true">
              <FontAwesomeIcon icon={icon} />
            </span>
            <p className="business-benefit-number">0{index + 1}</p>
            <h3>{titulo}</h3>
            <p>{texto}</p>
          </article>
        ))}
      </div>

      <div className="business-benefits-cta">
        <div>
          <p className="discovery-eyebrow">¿TIENES UNA BARBERÍA?</p>
          <h3>Solicita crear el espacio de tu negocio</h3>
          <p>Cuéntanos sobre tu barbería. Revisaremos la solicitud y te contactaremos.</p>
        </div>
        <Link to="/solicitar-barberia">
          Solicitar mi barbería <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
