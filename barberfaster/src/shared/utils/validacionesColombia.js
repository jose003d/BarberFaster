// Reglas compartidas para documentos y códigos de clientes colombianos.
// Deben coincidir con backend/config/validaciones.php.

export const DOCUMENTO_MIN_DIGITOS = 6;
export const DOCUMENTO_MAX_DIGITOS = 10;
export const CODIGO_DIGITOS = 6;

// Cédula de ciudadanía: entre 6 y 10 dígitos y no empieza por 0.
export const PATRON_DOCUMENTO = `[1-9][0-9]{${DOCUMENTO_MIN_DIGITOS - 1},${DOCUMENTO_MAX_DIGITOS - 1}}`;
export const PATRON_CODIGO = `[0-9]{${CODIGO_DIGITOS}}`;

export const MENSAJE_DOCUMENTO_INVALIDO =
  'El número de documento debe tener entre 6 y 10 dígitos, solo números y sin empezar por 0.';
export const MENSAJE_CODIGO_INVALIDO = 'El código debe tener exactamente 6 dígitos.';

const regexDocumento = new RegExp(`^${PATRON_DOCUMENTO}$`);
const regexCodigo = new RegExp(`^${PATRON_CODIGO}$`);

// Limpia lo que escribe el usuario: solo dígitos, sin ceros iniciales y con el máximo permitido.
export function limpiarDocumento(valor) {
  return String(valor ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '')
    .slice(0, DOCUMENTO_MAX_DIGITOS);
}

export function limpiarCodigo(valor) {
  return String(valor ?? '').replace(/\D/g, '').slice(0, CODIGO_DIGITOS);
}

export function documentoValido(valor) {
  return regexDocumento.test(String(valor ?? '').trim());
}

export function codigoValido(valor) {
  return regexCodigo.test(String(valor ?? '').trim());
}

// Props listas para un <input> de documento: el navegador bloquea el envío si no cumple.
// Sin maxLength a propósito: así un pegado como "1.023.456.789" no se corta antes de
// limpiarlo; limpiarDocumento ya recorta a 10 dígitos.
export const propsInputDocumento = {
  inputMode: 'numeric',
  minLength: DOCUMENTO_MIN_DIGITOS,
  pattern: PATRON_DOCUMENTO,
  title: MENSAJE_DOCUMENTO_INVALIDO,
  autoComplete: 'off',
};

export const propsInputCodigo = {
  inputMode: 'numeric',
  minLength: CODIGO_DIGITOS,
  pattern: PATRON_CODIGO,
  title: MENSAJE_CODIGO_INVALIDO,
  autoComplete: 'one-time-code',
};
