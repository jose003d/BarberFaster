import { useEffect } from "react";

const MAGNETIC_SELECTOR = [
  "button:not(:disabled)",
  "input[type='button']:not(:disabled)",
  "input[type='submit']:not(:disabled)",
  "input[type='reset']:not(:disabled)",
  ".btn:not(:disabled)",
  ".btn-secondary:not(:disabled)",
  ".btn-success:not(:disabled)",
  ".btn-danger:not(:disabled)",
  ".login-btn:not(:disabled)",
  ".discovery-login",
  ".discovery-hero-link",
  ".discovery-footer a",
].join(", ");

// Añade magnetismo a todos los botones habilitados sin envolverlos en JSX.
function MagneticButtons() {
  useEffect(() => {
    // Restablece el desplazamiento de un botón al terminar la interacción.
    const resetPosition = (button) => {
      button.style.setProperty("--magnetic-x", "0px");
      button.style.setProperty("--magnetic-y", "0px");
    };

    // Calcula el movimiento magnético solo para puntero de ratón y movimiento permitido.
    const handlePointerMove = (event) => {
      if (
        event.pointerType !== "mouse" ||
        window.matchMedia("(pointer: coarse)").matches ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const button = event.target.closest(MAGNETIC_SELECTOR);
      if (!button) return;

      const bounds = button.getBoundingClientRect();
      const offsetX = event.clientX - bounds.left - bounds.width / 2;
      const offsetY = event.clientY - bounds.top - bounds.height / 2;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const strength = reduceMotion ? 0.06 : 0.12;
      const maxOffsetX = reduceMotion ? 3 : 8;
      const maxOffsetY = reduceMotion ? 3 : 6;
      const magneticX = Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX * strength));
      const magneticY = Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY * strength));

      button.style.setProperty("--magnetic-x", `${magneticX}px`);
      button.style.setProperty("--magnetic-y", `${magneticY}px`);
    };

    // Evita reiniciar el efecto al moverse entre hijos del mismo botón.
    const handlePointerOut = (event) => {
      if (!(event.target instanceof Element)) return;

      const button = event.target.closest(MAGNETIC_SELECTOR);
      if (!button || (event.relatedTarget instanceof Node && button.contains(event.relatedTarget))) {
        return;
      }

      resetPosition(button);
    };

    // Limpia el desplazamiento si el navegador cancela el gesto del puntero.
    const handlePointerCancel = (event) => {
      if (event.target instanceof Element) {
        const button = event.target.closest(MAGNETIC_SELECTOR);
        if (button) resetPosition(button);
      }
    };

    // Registra listeners globales una vez y los elimina al desmontar el componente.
    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerout", handlePointerOut);
    document.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerout", handlePointerOut);
      document.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, []);

  return null;
}

export default MagneticButtons;
