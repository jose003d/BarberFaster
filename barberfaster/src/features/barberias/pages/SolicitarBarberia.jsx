import { useState } from "react";
import { Link } from "react-router-dom";
import { BASE_URL, handleResponse } from "../../../shared/services/api.js";

const formularioInicial = {
  nombre_barberia: "",
  direccion: "",
  ciudad: "",
  telefono_barberia: "",
  nombre_admin: "",
  documento_admin: "",
  telefono_admin: "",
  correo_admin: "",
};

export default function SolicitarBarberia() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const actualizar = (event) => {
    setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value }));
  };

  const enviarSolicitud = async (event) => {
    event.preventDefault();
    setError("");
    setMensaje("");
    setEnviando(true);

    try {
      const response = await fetch(`${BASE_URL}/barberias/solicitar.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });
      const data = await handleResponse(response);
      setMensaje(data.mensaje || "Solicitud enviada correctamente.");
      setFormulario(formularioInicial);
    } catch (requestError) {
      setError(requestError.message || "No se pudo enviar la solicitud.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <main className="barber-request-page">
      <header className="barber-request-header">
        <Link to="/" className="discovery-brand">BARBERFASTER</Link>
        <Link to="/">Volver al inicio</Link>
      </header>
      <section className="barber-request-card">
        <p className="discovery-eyebrow">BARBERFASTER · ALIANZAS</p>
        <h1>Solicita unir tu barbería</h1>
        <p>Enviaremos tus datos al equipo de BarberFaster. Si se aprueba, se creará el acceso de administrador para este negocio.</p>

        <form className="barber-request-form" onSubmit={enviarSolicitud}>
          <h2>Datos de la barbería</h2>
          <label>Nombre del negocio
            <input name="nombre_barberia" value={formulario.nombre_barberia} onChange={actualizar} maxLength={100} required />
          </label>
          <label>Dirección
            <input name="direccion" value={formulario.direccion} onChange={actualizar} maxLength={150} required />
          </label>
          <div className="barber-request-form-row">
            <label>Ciudad
              <input name="ciudad" value={formulario.ciudad} onChange={actualizar} maxLength={80} required />
            </label>
            <label>Teléfono de la barbería
              <input name="telefono_barberia" type="tel" value={formulario.telefono_barberia} onChange={actualizar} maxLength={20} required />
            </label>
          </div>
          <h2>Datos del administrador</h2>
          <label>Nombre completo
            <input name="nombre_admin" value={formulario.nombre_admin} onChange={actualizar} maxLength={150} required autoComplete="name" />
          </label>
          <label>Documento
            <input name="documento_admin" value={formulario.documento_admin} onChange={actualizar} maxLength={30} required />
          </label>
          <div className="barber-request-form-row">
            <label>Teléfono de contacto
              <input name="telefono_admin" type="tel" value={formulario.telefono_admin} onChange={actualizar} maxLength={20} />
            </label>
            <label>Correo del administrador
              <input name="correo_admin" type="email" value={formulario.correo_admin} onChange={actualizar} maxLength={120} required autoComplete="email" />
            </label>
          </div>
          {error && <p className="barber-request-message error" role="alert">{error}</p>}
          {mensaje && <p className="barber-request-message success" role="status">{mensaje}</p>}
          <button type="submit" className="login-btn" disabled={enviando}>
            {enviando ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      </section>
    </main>
  );
}
