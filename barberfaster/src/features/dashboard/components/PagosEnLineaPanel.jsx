import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleQuestion, faCreditCard } from "@fortawesome/free-solid-svg-icons";
import { BASE_URL } from "../../../shared/services/api.js";
import { obtenerBarberiaActivaId } from "../../../shared/services/barberiaActiva.js";

// Panel donde la barbería pega las llaves de SU cuenta de Wompi. Con ellas el
// dinero de las reservas pagadas en línea llega directo a la barbería.
// El backend nunca devuelve los secretos: solo indica si ya están guardados.

const SECRETOS_VACIOS = { llave_privada: "", secreto_integridad: "", secreto_eventos: "" };

const CAMPOS_SECRETOS = [
  ["llave_privada", "Llave privada", "prv"],
  ["secreto_integridad", "Secreto de integridad", "integrity"],
  ["secreto_eventos", "Secreto de eventos", "events"],
];

// Las barberías solo usan el ambiente de producción de Wompi (cobros reales):
// el de pruebas solo las confundía. Prefijo que Wompi usa en cada llave.
const AMBIENTE = "production";
const prefijoLlave = (campo) => ({
  llave_publica: "pub_prod_",
  llave_privada: "prv_prod_",
  secreto_integridad: "prod_integrity_",
  secreto_eventos: "prod_events_",
}[campo]);

// Normaliza la respuesta del backend. Una barbería sin configurar empieza con el
// pago en línea marcado, para que el primer guardado lo active.
const normalizarEstado = (data = {}) => ({
  configurado: Boolean(data.configurado),
  activo: data.configurado ? Boolean(data.activo) : true,
  ambiente: AMBIENTE,
  ambienteGuardado: data.ambiente || null,
  llave_publica: data.llave_publica || "",
  secretos_guardados: Boolean(data.secretos_guardados),
  validado_en: data.validado_en || null,
  url_eventos: data.url_eventos || "",
});

export default function PagosEnLineaPanel() {
  const [configuracion, setConfiguracion] = useState(normalizarEstado());
  const [secretos, setSecretos] = useState(SECRETOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [mostrarGuia, setMostrarGuia] = useState(false);
  const idBarberia = obtenerBarberiaActivaId();
  const esSuperadmin = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")?.rol === "SUPERADMIN";
    } catch {
      return false;
    }
  })();
  const url = `${BASE_URL}/barberias/pagos.php${esSuperadmin ? `?id_barberia=${encodeURIComponent(idBarberia ?? "")}` : ""}`;

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const respuesta = await fetch(url, { credentials: "include", cache: "no-store" });
      const data = await respuesta.json();
      if (!respuesta.ok || data.status !== "success") {
        throw new Error(data.mensaje || "No se pudo cargar la configuración de pagos.");
      }
      setConfiguracion(normalizarEstado(data.data));
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message || "No se pudo cargar la configuración de pagos." });
    } finally {
      setCargando(false);
    }
  }, [url]);

  useEffect(() => { cargar(); }, [cargar]);

  // Si quedaron guardadas llaves de pruebas, hay que pegar las cuatro de producción.
  const cambioDeAmbiente = configuracion.configurado && configuracion.ambienteGuardado !== AMBIENTE;
  const conservarSecretos = configuracion.secretos_guardados && !cambioDeAmbiente;

  const enviar = async (cuerpo) => {
    const respuesta = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(esSuperadmin ? { id_barberia: idBarberia } : {}), ...cuerpo }),
    });
    const data = await respuesta.json();
    if (!respuesta.ok || data.status !== "success") {
      throw new Error(data.mensaje || "No se pudo guardar la configuración de pagos.");
    }
    setConfiguracion(normalizarEstado(data.data));
    setSecretos(SECRETOS_VACIOS);
    setMensaje({ tipo: "success", texto: data.mensaje });
  };

  const guardar = async (event) => {
    event.preventDefault();
    setMensaje(null);
    const valores = { llave_publica: configuracion.llave_publica.trim(), ...secretos };
    for (const [campo, valor] of Object.entries(valores)) {
      const prefijo = prefijoLlave(campo);
      if (!valor.trim() && (campo === "llave_publica" || !conservarSecretos)) {
        setMensaje({ tipo: "error", texto: "Pega las cuatro llaves de producción de tu cuenta de Wompi." });
        return;
      }
      if (valor.trim() && !valor.trim().startsWith(prefijo)) {
        setMensaje({ tipo: "error", texto: `Una de las llaves no es de producción: la que va en ese campo empieza por ${prefijo}` });
        return;
      }
    }

    setGuardando(true);
    try {
      await enviar({
        ambiente: AMBIENTE,
        llave_publica: valores.llave_publica,
        llave_privada: secretos.llave_privada.trim(),
        secreto_integridad: secretos.secreto_integridad.trim(),
        secreto_eventos: secretos.secreto_eventos.trim(),
        activo: configuracion.activo,
      });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async () => {
    if (!window.confirm("¿Quitar las llaves de Wompi? Tus clientes solo podrán pagar en el local.")) return;
    setMensaje(null);
    setGuardando(true);
    try {
      await enviar({ accion: "eliminar" });
    } catch (error) {
      setMensaje({ tipo: "error", texto: error.message });
    } finally {
      setGuardando(false);
    }
  };

  const copiarUrl = async () => {
    try {
      await navigator.clipboard.writeText(configuracion.url_eventos);
      setMensaje({ tipo: "success", texto: "URL de eventos copiada." });
    } catch {
      setMensaje({ tipo: "error", texto: "No se pudo copiar. Selecciona la URL y cópiala manualmente." });
    }
  };

  const estado = !configuracion.configurado
    ? "Sin configurar: tus clientes solo pueden pagar en el local."
    : cambioDeAmbiente
      ? "Tienes guardadas llaves de pruebas: pega las de producción para cobrar de verdad."
      : `${configuracion.activo ? "Activo" : "Desactivado"}`
      + (configuracion.validado_en ? ` · Llaves validadas el ${new Date(configuracion.validado_en.replace(" ", "T")).toLocaleString("es-CO")}` : "");

  return (
    <section className="dashboard-panel" aria-labelledby="pagos-linea-title">
      <h2 id="pagos-linea-title">
        <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /> Pagos en línea (Wompi)
      </h2>
      <div className="pagos-intro">
        <p className="dashboard-description">
          El dinero que pagan tus clientes al reservar llega directo a tu cuenta de Wompi.
        </p>
        <button type="button" className="btn-primary pagos-guia-boton" onClick={() => setMostrarGuia(true)}>
          <FontAwesomeIcon icon={faCircleQuestion} aria-hidden="true" /> ¿Cómo activo los pagos en línea?
        </button>
      </div>
      {mostrarGuia && <GuiaWompi onClose={() => setMostrarGuia(false)} />}

      {mensaje && (
        <p className={`dashboard-message ${mensaje.tipo}`} role={mensaje.tipo === "error" ? "alert" : "status"}>
          {mensaje.texto}
        </p>
      )}

      {cargando ? (
        <p className="dashboard-loading" role="status">Cargando configuración de pagos...</p>
      ) : (
        <form className="dashboard-profile-form" onSubmit={guardar} autoComplete="off">
          <p className="dashboard-description"><strong>Estado:</strong> {estado}</p>

          <div className="dashboard-profile-grid">
            <div className="dashboard-field">
              <label htmlFor="pagos-llave_publica">Llave pública</label>
              <input
                id="pagos-llave_publica"
                type="text"
                spellCheck={false}
                value={configuracion.llave_publica}
                disabled={guardando}
                onChange={(e) => setConfiguracion({ ...configuracion, llave_publica: e.target.value })}
                placeholder={prefijoLlave("llave_publica")}
              />
            </div>

            {CAMPOS_SECRETOS.map(([campo, etiqueta]) => (
              <div className="dashboard-field" key={campo}>
                <label htmlFor={`pagos-${campo}`}>{etiqueta}</label>
                <input
                  id={`pagos-${campo}`}
                  type="password"
                  autoComplete="new-password"
                  spellCheck={false}
                  value={secretos[campo]}
                  disabled={guardando}
                  onChange={(e) => setSecretos({ ...secretos, [campo]: e.target.value })}
                  placeholder={conservarSecretos
                    ? "Guardado · déjalo vacío para conservarlo"
                    : prefijoLlave(campo)}
                />
              </div>
            ))}

            <div className="dashboard-field full">
              <label htmlFor="pagos-url-eventos">URL de eventos (pégala en Wompi &gt; Desarrolladores)</label>
              <div className="pagos-url-fila">
                <input id="pagos-url-eventos" type="text" readOnly value={configuracion.url_eventos} onFocus={(e) => e.target.select()} />
                <button type="button" className="btn-secondary" onClick={copiarUrl} disabled={!configuracion.url_eventos}>
                  Copiar URL
                </button>
              </div>
            </div>

            <fieldset className="dashboard-field full dashboard-working-days">
              <legend>Reservas</legend>
              <div className="dashboard-working-days-options">
                <label>
                  <input
                    type="checkbox"
                    checked={configuracion.activo}
                    disabled={guardando}
                    onChange={(e) => setConfiguracion({ ...configuracion, activo: e.target.checked })}
                  />
                  Ofrecer pago en línea a los clientes
                </label>
              </div>
            </fieldset>
          </div>

          <div className="dashboard-form-actions">
            <button type="button" className="btn-secondary" onClick={quitar} disabled={guardando || !configuracion.configurado}>
              Quitar llaves
            </button>
            <button type="submit" className="btn" disabled={guardando}>
              {guardando ? "Validando con Wompi..." : "Guardar llaves"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

// Guía paso a paso para que la barbería conecte su propia cuenta de Wompi.
function GuiaWompi({ onClose }) {
  useEffect(() => {
    const cerrarConEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  return (
    <div className="pagos-guia-fondo" onClick={onClose}>
      <div
        className="pagos-guia"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pagos-guia-titulo"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="pagos-guia-encabezado">
          <h3 id="pagos-guia-titulo">¿Cómo activo los pagos en línea?</h3>
          <button type="button" className="btn-quiet pagos-guia-cerrar" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <ol className="pagos-guia-pasos">
          <li>
            <strong>Ten tu cuenta de Wompi.</strong>
            <span>
              Si aún no la tienes, regístrate como comercio en{" "}
              <a href="https://comercios.wompi.co" target="_blank" rel="noopener noreferrer">comercios.wompi.co</a>{" "}
              con los datos de tu barbería y tu cuenta bancaria. Wompi revisa tus documentos; cuando aprueben la
              cuenta ya puedes recibir pagos.
            </span>
          </li>
          <li>
            <strong>Busca tus llaves.</strong>
            <span>
              Entra a tu panel de Wompi y ve a <em>Desarrolladores</em>. Verifica que estés en modo{" "}
              <em>Producción</em> (no en pruebas). Ahí verás la <em>llave pública</em>, la <em>llave privada</em> y
              los secretos de <em>integridad</em> y de <em>eventos</em>.
            </span>
          </li>
          <li>
            <strong>Pégalas aquí, cada una en su campo.</strong>
            <span className="pagos-guia-llaves">
              <span><code>pub_prod_…</code> → Llave pública</span>
              <span><code>prv_prod_…</code> → Llave privada</span>
              <span><code>prod_integrity_…</code> → Secreto de integridad</span>
              <span><code>prod_events_…</code> → Secreto de eventos</span>
            </span>
          </li>
          <li>
            <strong>Registra la URL de eventos.</strong>
            <span>
              Pulsa <em>Copiar URL</em> en este panel y pégala en Wompi &gt; Desarrolladores, en el campo{" "}
              <em>URL de eventos</em>. Así sabemos cuándo un cliente pagó y confirmamos su cita.
            </span>
          </li>
          <li>
            <strong>Guarda.</strong>
            <span>
              Pulsa <em>Guardar llaves</em>. Las validamos con Wompi y, si todo está bien, el estado cambia a{" "}
              <em>Activo</em> y tus clientes ya pueden pagar al reservar.
            </span>
          </li>
        </ol>

        <p className="pagos-guia-nota">
          Nunca compartas tu llave privada ni tus secretos con nadie. Aquí se guardan cifrados y nadie puede verlos.
        </p>

        <div className="pagos-guia-acciones">
          <button type="button" className="btn-primary" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}
