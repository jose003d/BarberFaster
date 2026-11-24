import { Link } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons/core-free-icons";
import "./BarberiaBenefits.css";

const beneficios = [
  "Agenda de citas organizada en un solo lugar.",
  "Tus barberos, horarios y servicios conectados.",
  "Nuevos clientes te encuentran aquí.",
];

// Sección para dueños de barberías: una ventana con los beneficios y la solicitud.
export default function BarberiaBenefits() {
  return (
    <section className="business-benefits" aria-labelledby="business-benefits-title">
      <div className="business-window">
        <h2 id="business-benefits-title">¿Tienes una barbería en Sonsón?</h2>
        <ul>
          {beneficios.map((beneficio) => (
            <li key={beneficio}>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={24} strokeWidth={2} aria-hidden="true" />
              <span>{beneficio}</span>
            </li>
          ))}
        </ul>
        <Link className="btn business-window-cta" to="/solicitar-barberia">Solicitar mi barbería</Link>
      </div>
    </section>
  );
}
