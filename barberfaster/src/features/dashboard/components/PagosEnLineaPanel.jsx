import { useCallback, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
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

// Prefijo que Wompi usa en cada llave según el ambiente.
const prefijoLlave = (campo, ambiente) => {
  const sufijo = ambiente === "production" ? "prod" : "test";
  return {
    llave_publica: `pub_${sufijo}_`,
    llave_privada: `prv_${sufijo}_`,
    secreto_integridad: `${sufijo}_integrity_`,
    secreto_eventos: `${sufijo}_events_`,
  }[campo];
};

// Normaliza la respuesta del backend. Una barbería sin configurar empieza en
// pruebas y con el pago en línea marcado, para que el primer guardado lo active.
const normalizarEstado = (data = {}) => ({
  configurado: Boolean(data.configurado),
  activo: data.configurado ? Boolean(data.activo) : true,
  ambiente: data.ambiente || "sandbox",
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

  // Al cambiar de ambiente los secretos guardados ya no sirven: hay que pegar los cuatro.
  const cambioDeAmbiente = configuracion.configurado && configuracion.ambiente !== configuracion.ambienteGuardado;
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
      const prefijo = prefijoLlave(campo, configuracion.ambiente);
      if (!valor.trim() && (campo === "llave_publica" || !conservarSecretos)) {
        setMensaje({ tipo: "error", texto: "Pega las cuatro llaves de Wompi del ambiente elegido." });
        return;
      }
      if (valor.trim() && !valor.trim().startsWith(prefijo)) {
        setMensaje({ tipo: "error", texto: `Una de las llaves no corresponde al ambiente elegido: la que va en ese campo empieza por ${prefijo}` });
        return;
      }
    }

    setGuardando(true);
    try {
      await enviar({
        ambiente: configuracion.ambiente,
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
    : `${configuracion.activo ? "Activo" : "Desactivado"} · ${configuracion.ambienteGuardado === "production" ? "Producción (cobros reales)" : "Pruebas (sandbox)"}`
      + (configuracion.validado_en ? ` · Llaves validadas el ${new Date(configuracion.validado_en.replace(" ", "T")).toLocaleString("es-CO")}` : "");

  return (
    <section className="dashboard-panel" aria-labelledby="pagos-linea-title">
      <h2 id="pagos-linea-title">
        <FontAwesomeIcon icon={faCreditCard} aria-hidden="true" /> Pagos en línea (Wompi)
      </h2>
      <p className="dashboard-description">
        El dinero que pagan tus clientes al reservar llega directo a tu cuenta de Wompi. Copia las llaves desde
        Wompi &gt; Desarrolladores &gt; Llaves del API, todas del mismo ambiente.
      </p>

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
              <label htmlFor="pagos-ambiente">Ambiente</label>
              <select
                id="pagos-ambiente"
                value={configuracion.ambiente}
                disabled={guardando}
                onChange={(e) => setConfiguracion({ ...configuracion, ambiente: e.target.value })}
              >
                <option value="sandbox">Pruebas (sandbox)</option>
                <option value="production">Producción (cobros reales)</option>
              </select>
            </div>

            <div className="dashboard-field">
              <label htmlFor="pagos-llave_publica">Llave pública</label>
              <input
                id="pagos-llave_publica"
                type="text"
                spellCheck={false}
                value={configuracion.llave_publica}
                disabled={guardando}
                onChange={(e) => setConfiguracion({ ...configuracion, llave_publica: e.target.value })}
                placeholder={prefijoLlave("llave_publica", configuracion.ambiente)}
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
                    : prefijoLlave(campo, configuracion.ambiente)}
                />
              </div>
            ))}

            <div className="dashboard-field full">
              <label htmlFor="pagos-url-eventos">URL de eventos (regístrala en Wompi &gt; Desarrolladores, mismo ambiente)</label>
              <input id="pagos-url-eventos" type="text" readOnly value={configuracion.url_eventos} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn-secondary" onClick={copiarUrl} disabled={!configuracion.url_eventos}>
                Copiar URL
              </button>
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
