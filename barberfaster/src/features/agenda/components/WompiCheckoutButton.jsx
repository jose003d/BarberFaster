const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/p/';

// Arma la URL del Web Checkout de Wompi con los datos firmados que entrega el backend.
export function construirUrlCheckoutWompi(payment) {
  const parametros = [
    ['public-key', payment.llave_publica],
    ['currency', payment.moneda],
    ['amount-in-cents', String(payment.monto_centavos)],
    ['reference', payment.referencia],
    ['signature:integrity', payment.firma_integridad],
    ['redirect-url', payment.url_redireccion],
  ];

  const query = parametros
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${clave}=${encodeURIComponent(valor)}`)
    .join('&');

  return `${WOMPI_CHECKOUT_URL}?${query}`;
}

// Enlace de respaldo por si la redirección automática no se completa.
export default function WompiCheckoutButton({ payment }) {
  if (!payment) return null;

  return (
    <a className="agenda-wompi-link" href={construirUrlCheckoutWompi(payment)}>
      Ir a pagar con Wompi
    </a>
  );
}
