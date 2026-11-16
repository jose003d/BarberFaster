import { useEffect, useRef } from "react";

export default function WompiCheckoutButton({ payment, onError }) {
  const formRef = useRef(null);

  useEffect(() => {
    if (!payment || !formRef.current) return undefined;

    const form = formRef.current;
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.async = true;
    script.setAttribute("data-render", "button");
    script.setAttribute("data-public-key", payment.llave_publica);
    script.setAttribute("data-currency", payment.moneda);
    script.setAttribute("data-amount-in-cents", String(payment.monto_centavos));
    script.setAttribute("data-reference", payment.referencia);
    script.setAttribute("data-signature:integrity", payment.firma_integridad);
    script.setAttribute("data-redirect-url", payment.url_redireccion);
    script.onerror = () => onError("No se pudo cargar el checkout de Wompi. Revisa tu conexión e inténtalo nuevamente.");
    form.appendChild(script);

    return () => {
      script.onerror = null;
      form.replaceChildren();
    };
  }, [payment, onError]);

  return <form ref={formRef} aria-label="Pago seguro con Wompi" />;
}
