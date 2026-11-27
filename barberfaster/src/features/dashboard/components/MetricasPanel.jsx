import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartColumn } from "@fortawesome/free-solid-svg-icons";
import { apiFetch } from "../../../shared/services/api.js";
import "./MetricasPanel.css";

const PERIODOS = [
  { clave: "hoy", etiqueta: "Hoy" },
  { clave: "7d", etiqueta: "7 días" },
  { clave: "mes", etiqueta: "Este mes" },
  { clave: "30d", etiqueta: "30 días" },
];

const pesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const numero = new Intl.NumberFormat("es-CO");

function fechaCorta(fecha, opciones = { weekday: "short", day: "numeric" }) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", opciones).format(new Date(anio, mes - 1, dia));
}

function plural(cantidad, singular, pluralTexto) {
  return `${numero.format(cantidad)} ${cantidad === 1 ? singular : pluralTexto}`;
}

// Columnas de citas por día: una serie, un tono; detalle de cada día al pasar o enfocar.
function GraficoCitasPorDia({ dias }) {
  const [activo, setActivo] = useState(null);
  const maximo = Math.max(1, ...dias.map((dia) => dia.citas));
  const marcas = [maximo, Math.round(maximo / 2), 0].filter((valor, i, lista) => lista.indexOf(valor) === i);
  const mostrarCadaN = dias.length > 16 ? Math.ceil(dias.length / 8) : 1;
  const diaActivo = activo === null ? null : dias[activo];

  return (
    <figure className="metricas-grafico">
      <div className="metricas-grafico-area" onMouseLeave={() => setActivo(null)}>
        <div className="metricas-grafico-eje" aria-hidden="true">
          {marcas.map((valor) => (
            <span key={valor} style={{ bottom: `${(valor / maximo) * 100}%` }}>{valor}</span>
          ))}
        </div>
        <div className="metricas-grafico-columnas">
          {marcas.map((valor) => (
            <span key={valor} className="metricas-grafico-guia" style={{ bottom: `${(valor / maximo) * 100}%` }} aria-hidden="true" />
          ))}
          {dias.map((dia, indice) => (
            <button
              type="button"
              key={dia.fecha}
              className={`metricas-grafico-columna${activo === indice ? " is-activa" : ""}`}
              onMouseEnter={() => setActivo(indice)}
              onFocus={() => setActivo(indice)}
              onBlur={() => setActivo(null)}
              aria-label={`${fechaCorta(dia.fecha, { weekday: "long", day: "numeric", month: "long" })}: ${plural(dia.citas, "cita", "citas")}, ${pesos.format(dia.ingresos)} atendidos`}
            >
              <span className="metricas-grafico-barra" style={{ height: `${(dia.citas / maximo) * 100}%` }} />
            </button>
          ))}
          {diaActivo && (
            <div
              className="metricas-grafico-tooltip"
              style={{ left: `${((activo + 0.5) / dias.length) * 100}%` }}
              role="status"
            >
              <strong>{fechaCorta(diaActivo.fecha, { weekday: "long", day: "numeric", month: "short" })}</strong>
              <span>{plural(diaActivo.citas, "cita", "citas")}</span>
              <span>{pesos.format(diaActivo.ingresos)} atendidos</span>
            </div>
          )}
        </div>
      </div>
      <div className="metricas-grafico-fechas" aria-hidden="true">
        {dias.map((dia, indice) => (
          <span key={dia.fecha}>{indice % mostrarCadaN === 0 ? fechaCorta(dia.fecha) : ""}</span>
        ))}
      </div>
      <figcaption className="metricas-oculto">
        Citas por día del período. El detalle de cada día está en la descripción de cada columna.
      </figcaption>
    </figure>
  );
}

// Métricas reales del negocio, calculadas en dashboard/metricas.php con las citas de la barbería.
export default function MetricasPanel() {
  const [periodo, setPeriodo] = useState("7d");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    setCargando(true);
    apiFetch(`dashboard/metricas.php?periodo=${periodo}`, { cache: "no-store" }).then((respuesta) => {
      if (!activo) return;
      if (respuesta.status === "success") {
        setDatos(respuesta);
        setError("");
      } else {
        setError(respuesta.mensaje || "No se pudieron cargar las métricas.");
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [periodo]);

  const resumen = datos?.resumen;
  const maximoServicio = Math.max(1, ...(datos?.servicios || []).map((servicio) => servicio.veces));
  const rango = datos?.periodo
    ? datos.periodo.desde === datos.periodo.hasta
      ? fechaCorta(datos.periodo.desde, { weekday: "long", day: "numeric", month: "long" })
      : `${fechaCorta(datos.periodo.desde, { day: "numeric", month: "short" })} – ${fechaCorta(datos.periodo.hasta, { day: "numeric", month: "short" })}`
    : "";

  return (
    <section className="dashboard-panel metricas">
      <div className="metricas-encabezado">
        <div>
          <h2><FontAwesomeIcon icon={faChartColumn} aria-hidden="true" /> Métricas del negocio</h2>
          <p className="dashboard-description">
            Calculadas con las citas reales de tu barbería{rango ? ` · ${rango}` : ""}.
          </p>
        </div>
        <div className="metricas-periodos" role="group" aria-label="Período">
          {PERIODOS.map(({ clave, etiqueta }) => (
            <button
              key={clave}
              type="button"
              className="metricas-periodo"
              aria-pressed={periodo === clave}
              onClick={() => setPeriodo(clave)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="dashboard-message error" role="alert">{error}</p>}

      {!resumen ? (
        cargando && <p className="dashboard-loading" role="status">Calculando métricas…</p>
      ) : (
        <div className={`metricas-contenido${cargando ? " is-cargando" : ""}`} aria-busy={cargando}>
          <div className="metricas-kpis">
            <article className="metricas-kpi is-principal">
              <span>Ingresos atendidos</span>
              <strong>{pesos.format(resumen.ingresos)}</strong>
              <small>
                {resumen.por_cobrar > 0
                  ? `${pesos.format(resumen.por_cobrar)} por cobrar en ${plural(resumen.confirmadas, "cita confirmada", "citas confirmadas")}`
                  : `${plural(resumen.atendidas, "cita atendida", "citas atendidas")}`}
              </small>
            </article>
            <article className="metricas-kpi">
              <span>Citas</span>
              <strong>{numero.format(resumen.citas)}</strong>
              <small>
                {resumen.atendidas} atendidas · {resumen.confirmadas} por atender
                {resumen.pendientes > 0 ? ` · ${resumen.pendientes} esperando pago` : ""}
              </small>
            </article>
            <article className="metricas-kpi">
              <span>Ticket promedio</span>
              <strong>{resumen.atendidas > 0 ? pesos.format(resumen.ticket_promedio) : "—"}</strong>
              <small>Lo que deja en promedio cada cita atendida</small>
            </article>
            <article className="metricas-kpi">
              <span>Clientes</span>
              <strong>{numero.format(resumen.clientes)}</strong>
              <small>{plural(resumen.clientes_nuevos, "nuevo", "nuevos")} en el período</small>
            </article>
            <article className="metricas-kpi">
              <span>Cancelaciones</span>
              <strong>{resumen.tasa_cancelacion}%</strong>
              <small>{plural(resumen.canceladas, "reserva cancelada", "reservas canceladas")}</small>
            </article>
            <article className="metricas-kpi">
              <span>Calificación</span>
              <strong>{resumen.calificacion === null ? "—" : `${resumen.calificacion} ★`}</strong>
              <small>
                {resumen.cantidad_resenas > 0
                  ? `${plural(resumen.cantidad_resenas, "reseña", "reseñas")} en total`
                  : "Aún sin reseñas"}
              </small>
            </article>
          </div>

          {resumen.citas === 0 && resumen.canceladas === 0 ? (
            <p className="metricas-vacio">No hay citas en este período.</p>
          ) : (
            <>
              {datos.por_dia.length > 1 && (
                <section className="metricas-bloque" aria-labelledby="metricas-por-dia">
                  <h3 id="metricas-por-dia">Citas por día</h3>
                  <GraficoCitasPorDia dias={datos.por_dia} />
                </section>
              )}

              <div className="metricas-columnas">
                <section className="metricas-bloque" aria-labelledby="metricas-barberos">
                  <h3 id="metricas-barberos">Desempeño por barbero</h3>
                  <div className="table-wrapper">
                    <table className="metricas-tabla">
                      <thead>
                        <tr>
                          <th scope="col">Barbero</th>
                          <th scope="col">Citas</th>
                          <th scope="col">Atendidas</th>
                          <th scope="col">Ingresos</th>
                          <th scope="col">Calificación</th>
                        </tr>
                      </thead>
                      <tbody>
                        {datos.por_barbero.map((barbero) => (
                          <tr key={barbero.id_barbero}>
                            <th scope="row">{barbero.nombre}</th>
                            <td>
                              {barbero.citas}
                              {barbero.canceladas > 0 && <small> ({barbero.canceladas} canc.)</small>}
                            </td>
                            <td>{barbero.atendidas}</td>
                            <td>{pesos.format(barbero.ingresos)}</td>
                            <td>{barbero.calificacion === null ? "—" : `${barbero.calificacion} ★`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="metricas-bloque" aria-labelledby="metricas-servicios">
                  <h3 id="metricas-servicios">Servicios más pedidos</h3>
                  {datos.servicios.length === 0 ? (
                    <p className="metricas-vacio">Sin servicios en el período.</p>
                  ) : (
                    <ol className="metricas-servicios">
                      {datos.servicios.map((servicio) => (
                        <li key={servicio.id_servicio}>
                          <span className="metricas-servicio-nombre">{servicio.nombre}</span>
                          <span className="metricas-servicio-pista" aria-hidden="true">
                            <span style={{ width: `${(servicio.veces / maximoServicio) * 100}%` }} />
                          </span>
                          <span className="metricas-servicio-valor">
                            {plural(servicio.veces, "vez", "veces")}
                            <small>{pesos.format(servicio.valor)}</small>
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
