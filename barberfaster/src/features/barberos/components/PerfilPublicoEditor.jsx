import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "../../../shared/services/api.js";
import "./PerfilPublicoEditor.css";

const MAX_DESCRIPCION = 500;
const MAX_PORTAFOLIO = 12;
const MAX_BYTES = 5 * 1024 * 1024;
const TIPOS_IMAGEN = "image/jpeg,image/png,image/webp";

function iniciales(nombre = "") {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("") || "B";
}

// Edita lo que los clientes ven del barbero al reservar: foto, descripción y portafolio.
// Sin idBarbero edita el perfil propio; con idBarbero lo usa el administrador para su personal.
export default function PerfilPublicoEditor({ idBarbero = null }) {
  const [perfil, setPerfil] = useState(null);
  const [descripcion, setDescripcion] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const fotoPerfilRef = useRef(null);
  const portafolioRef = useRef(null);

  const aplicarPerfil = useCallback((datos) => {
    setPerfil(datos);
    setDescripcion(datos?.descripcion || "");
  }, []);

  useEffect(() => {
    let activo = true;
    const consulta = idBarbero ? `?id_barbero=${encodeURIComponent(idBarbero)}` : "";
    setCargando(true);
    apiFetch(`barberos/perfil.php${consulta}`, { cache: "no-store" }).then((respuesta) => {
      if (!activo) return;
      if (respuesta.status === "success") {
        aplicarPerfil(respuesta.datos);
        setMensaje(null);
      } else {
        setMensaje({ tipo: "error", texto: respuesta.mensaje || "No se pudo cargar el perfil." });
      }
      setCargando(false);
    });
    return () => {
      activo = false;
    };
  }, [idBarbero, aplicarPerfil]);

  // Ejecuta una petición del editor y actualiza el perfil con la respuesta del servidor.
  const ejecutar = async (accion, peticion, textoExito) => {
    setOcupado(accion);
    setMensaje(null);
    const respuesta = await peticion();
    setOcupado("");
    if (respuesta.status !== "success") {
      setMensaje({ tipo: "error", texto: respuesta.mensaje || "No se pudo completar la acción." });
      return false;
    }
    if (respuesta.datos) aplicarPerfil(respuesta.datos);
    setMensaje({ tipo: "success", texto: respuesta.mensaje || textoExito });
    return true;
  };

  const subirFotos = async (tipo, archivos, input) => {
    if (archivos.length === 0) return;
    if (archivos.some((archivo) => archivo.size > MAX_BYTES)) {
      setMensaje({ tipo: "error", texto: "Cada foto debe pesar máximo 5 MB." });
      if (input) input.value = "";
      return;
    }
    const disponibles = MAX_PORTAFOLIO - (perfil?.portafolio?.length || 0);
    if (tipo === "PORTAFOLIO" && archivos.length > disponibles) {
      setMensaje({ tipo: "error", texto: `Solo puedes agregar ${disponibles} foto(s) más al portafolio.` });
      if (input) input.value = "";
      return;
    }

    const body = new FormData();
    body.append("tipo", tipo);
    if (idBarbero) body.append("id_barbero", idBarbero);
    archivos.forEach((archivo) => body.append("fotos[]", archivo));
    await ejecutar(
      tipo,
      () => apiFetch("barberos/fotos.php", { method: "POST", body }),
      "Fotos guardadas.",
    );
    if (input) input.value = "";
  };

  const eliminarFoto = (idFoto) => ejecutar(
    `borrar-${idFoto}`,
    () => apiFetch("barberos/fotos.php", {
      method: "DELETE",
      body: { id_foto: idFoto, ...(idBarbero ? { id_barbero: idBarbero } : {}) },
    }),
    "Foto eliminada.",
  );

  const guardarDescripcion = (event) => {
    event.preventDefault();
    ejecutar(
      "descripcion",
      () => apiFetch("barberos/perfil.php", {
        method: "POST",
        body: { descripcion, ...(idBarbero ? { id_barbero: idBarbero } : {}) },
      }),
      "Descripción guardada.",
    );
  };

  if (cargando) {
    return <p className="perfil-publico-estado" role="status">Cargando perfil…</p>;
  }
  if (!perfil) {
    return <p className="status error" role="alert">{mensaje?.texto || "No se pudo cargar el perfil."}</p>;
  }

  const portafolio = perfil.portafolio || [];
  const descripcionCambio = descripcion.trim() !== (perfil.descripcion || "").trim();

  return (
    <section className="perfil-publico" aria-labelledby="perfil-publico-titulo">
      <header className="perfil-publico-encabezado">
        <h2 id="perfil-publico-titulo">Perfil para clientes</h2>
        <p>{idBarbero
          ? "Esto es lo que ven los clientes cuando eligen a este barbero al reservar."
          : "Esto es lo que ven los clientes cuando te eligen al reservar."}</p>
      </header>

      <div className="perfil-publico-identidad">
        <div className="perfil-publico-avatar">
          {perfil.foto
            ? <img src={perfil.foto} alt={`Foto de ${perfil.nombre}`} />
            : <span aria-hidden="true">{iniciales(perfil.nombre)}</span>}
        </div>
        <div className="perfil-publico-avatar-acciones">
          <strong>{perfil.nombre}</strong>
          <input
            ref={fotoPerfilRef}
            type="file"
            accept={TIPOS_IMAGEN}
            hidden
            onChange={(event) => subirFotos("PERFIL", Array.from(event.target.files || []), event.target)}
          />
          <div className="perfil-publico-botones">
            <button
              type="button"
              className="btn"
              disabled={Boolean(ocupado)}
              onClick={() => fotoPerfilRef.current?.click()}
            >
              {ocupado === "PERFIL" ? "Subiendo…" : perfil.foto ? "Cambiar foto" : "Subir foto"}
            </button>
            {perfil.id_foto_perfil && (
              <button
                type="button"
                className="btn-secondary"
                disabled={Boolean(ocupado)}
                onClick={() => eliminarFoto(perfil.id_foto_perfil)}
              >
                Quitar foto
              </button>
            )}
          </div>
          <small>JPG, PNG o WebP, máximo 5 MB.</small>
        </div>
      </div>

      <form className="perfil-publico-descripcion" onSubmit={guardarDescripcion}>
        <label htmlFor="perfil-publico-descripcion">Descripción</label>
        <textarea
          id="perfil-publico-descripcion"
          rows={4}
          maxLength={MAX_DESCRIPCION}
          placeholder="Ej.: Especialista en fades y diseño de barba. 6 años de experiencia."
          value={descripcion}
          onChange={(event) => setDescripcion(event.target.value)}
        />
        <div className="perfil-publico-descripcion-pie">
          <span>{descripcion.length}/{MAX_DESCRIPCION}</span>
          <button type="submit" className="btn" disabled={Boolean(ocupado) || !descripcionCambio}>
            {ocupado === "descripcion" ? "Guardando…" : "Guardar descripción"}
          </button>
        </div>
      </form>

      <section className="perfil-publico-portafolio" aria-labelledby="perfil-publico-portafolio-titulo">
        <div className="perfil-publico-portafolio-encabezado">
          <div>
            <h3 id="perfil-publico-portafolio-titulo">Portafolio</h3>
            <p>Los mejores cortes, hasta {MAX_PORTAFOLIO} fotos.</p>
          </div>
          <span>{portafolio.length}/{MAX_PORTAFOLIO}</span>
        </div>

        {portafolio.length > 0 ? (
          <div className="perfil-publico-galeria">
            {portafolio.map((foto) => (
              <figure key={foto.id_foto}>
                <img src={foto.foto} alt="Trabajo del portafolio" loading="lazy" />
                <button
                  type="button"
                  disabled={Boolean(ocupado)}
                  onClick={() => eliminarFoto(foto.id_foto)}
                  aria-label="Eliminar foto del portafolio"
                >
                  {ocupado === `borrar-${foto.id_foto}` ? "…" : "Eliminar"}
                </button>
              </figure>
            ))}
          </div>
        ) : (
          <p className="perfil-publico-vacio">Aún no hay fotos en el portafolio.</p>
        )}

        {portafolio.length < MAX_PORTAFOLIO && (
          <>
            <input
              ref={portafolioRef}
              type="file"
              accept={TIPOS_IMAGEN}
              multiple
              hidden
              onChange={(event) => subirFotos("PORTAFOLIO", Array.from(event.target.files || []), event.target)}
            />
            <button
              type="button"
              className="btn-secondary perfil-publico-agregar"
              disabled={Boolean(ocupado)}
              onClick={() => portafolioRef.current?.click()}
            >
              {ocupado === "PORTAFOLIO" ? "Subiendo…" : "+ Agregar fotos"}
            </button>
          </>
        )}
      </section>

      {mensaje && (
        <p
          className={`perfil-publico-mensaje ${mensaje.tipo}`}
          role={mensaje.tipo === "error" ? "alert" : "status"}
        >
          {mensaje.texto}
        </p>
      )}
    </section>
  );
}
