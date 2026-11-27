// Servidor WebSocket propio de BarberFaster: avisa a cada barbero, al instante,
// cuando una de sus citas se crea o cambia. Reemplaza a servicios externos (Pusher).
//
// Cómo encaja:
//   Cliente agenda ─▶ PHP (hosting) guarda la cita ─POST /publicar─▶ este servidor ─WebSocket─▶ barbero
//
// - PHP publica con el secreto compartido TIEMPO_REAL_SECRETO (cabecera Authorization).
// - El navegador del barbero se conecta a /ws?token=... El token lo firma PHP con el
//   mismo secreto e indica el único canal que puede escuchar ("barbero-<id>") y cuándo vence.
//   Este servidor no toca la base de datos: solo verifica la firma.
// - Al aviso solo viajan el ID de la cita, la fecha, la hora y el estado.
//
// Variables de entorno:
//   TIEMPO_REAL_SECRETO   (obligatoria) la misma que en el .env del backend PHP
//   PUERTO                (opcional, 8090)
//   ORIGENES_PERMITIDOS   (opcional) p. ej. "https://barberfaster.site,http://localhost:5173"

import { createServer } from "node:http";
import { createHmac, timingSafeEqual } from "node:crypto";
import { WebSocketServer } from "ws";

const SECRETO = process.env.TIEMPO_REAL_SECRETO || "";
const PUERTO = Number(process.env.PUERTO || 8090);
const ORIGENES = (process.env.ORIGENES_PERMITIDOS || "")
  .split(",")
  .map((origen) => origen.trim())
  .filter(Boolean);
const MAX_CUERPO_BYTES = 8 * 1024;
const LATIDO_MS = 30000;

if (SECRETO.length < 32) {
  console.error("Falta TIEMPO_REAL_SECRETO (mínimo 32 caracteres). Genera uno con:");
  console.error('  node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

// canal -> conjunto de sockets conectados a ese canal
const canales = new Map();

function iguales(a, b) {
  const bufferA = Buffer.from(String(a));
  const bufferB = Buffer.from(String(b));
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

function firmar(texto) {
  return createHmac("sha256", SECRETO).update(texto).digest("base64url");
}

// Token = base64url(JSON {canal, exp}) + "." + firma HMAC-SHA256. Lo genera PHP.
function leerToken(token) {
  const [carga, firma] = String(token || "").split(".");
  if (!carga || !firma || !iguales(firma, firmar(carga))) return null;
  try {
    const datos = JSON.parse(Buffer.from(carga, "base64url").toString("utf8"));
    if (typeof datos.canal !== "string" || !/^barbero-\d+$/.test(datos.canal)) return null;
    if (!Number.isFinite(datos.exp) || datos.exp * 1000 < Date.now()) return null;
    return datos;
  } catch {
    return null;
  }
}

function responder(res, estado, cuerpo) {
  res.writeHead(estado, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(cuerpo));
}

function publicar(canal, evento, datos) {
  const sockets = canales.get(canal);
  if (!sockets) return 0;
  const mensaje = JSON.stringify({ evento, datos });
  let enviados = 0;
  for (const socket of sockets) {
    if (socket.readyState === socket.OPEN) {
      socket.send(mensaje);
      enviados += 1;
    }
  }
  return enviados;
}

const servidorHttp = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");

  if (req.method === "GET" && url.pathname === "/salud") {
    let conexiones = 0;
    canales.forEach((sockets) => { conexiones += sockets.size; });
    responder(res, 200, { ok: true, conexiones });
    return;
  }

  if (req.method === "POST" && url.pathname === "/publicar") {
    const autorizacion = req.headers.authorization || "";
    if (!iguales(autorizacion, `Bearer ${SECRETO}`)) {
      responder(res, 401, { ok: false, mensaje: "No autorizado." });
      return;
    }

    let cuerpo = "";
    let demasiadoGrande = false;
    req.on("data", (parte) => {
      cuerpo += parte;
      if (cuerpo.length > MAX_CUERPO_BYTES) {
        demasiadoGrande = true;
        req.destroy();
      }
    });
    req.on("end", () => {
      if (demasiadoGrande) return;
      try {
        const { canal, evento, datos } = JSON.parse(cuerpo);
        if (typeof canal !== "string" || !/^barbero-\d+$/.test(canal) || typeof evento !== "string") {
          responder(res, 422, { ok: false, mensaje: "Canal o evento inválido." });
          return;
        }
        responder(res, 200, { ok: true, enviados: publicar(canal, evento, datos ?? {}) });
      } catch {
        responder(res, 400, { ok: false, mensaje: "JSON inválido." });
      }
    });
    return;
  }

  responder(res, 404, { ok: false, mensaje: "No encontrado." });
});

const servidorWs = new WebSocketServer({ noServer: true, maxPayload: 1024 });

servidorHttp.on("upgrade", (req, socket, cabeza) => {
  const url = new URL(req.url, "http://localhost");
  const origen = req.headers.origin || "";
  const datosToken = url.pathname === "/ws" ? leerToken(url.searchParams.get("token")) : null;

  if (!datosToken || (ORIGENES.length > 0 && !ORIGENES.includes(origen))) {
    socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }

  servidorWs.handleUpgrade(req, socket, cabeza, (ws) => {
    ws.canal = datosToken.canal;
    ws.vivo = true;
    if (!canales.has(ws.canal)) canales.set(ws.canal, new Set());
    canales.get(ws.canal).add(ws);

    ws.on("pong", () => { ws.vivo = true; });
    ws.on("close", () => {
      const sockets = canales.get(ws.canal);
      sockets?.delete(ws);
      if (sockets?.size === 0) canales.delete(ws.canal);
    });
    ws.send(JSON.stringify({ evento: "conectado", datos: { canal: ws.canal } }));
  });
});

// Latido: cierra conexiones muertas (celular que se quedó sin señal, pestaña cerrada a la fuerza).
setInterval(() => {
  for (const ws of servidorWs.clients) {
    if (!ws.vivo) {
      ws.terminate();
      continue;
    }
    ws.vivo = false;
    ws.ping();
  }
}, LATIDO_MS).unref();

servidorHttp.listen(PUERTO, () => {
  console.log(`Servidor de tiempo real escuchando en el puerto ${PUERTO}`);
});
