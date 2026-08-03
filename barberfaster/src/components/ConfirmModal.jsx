function ConfirmModal({
  isOpen,             // controla si el modal está visible
  title,              // título del modal
  message,            // mensaje descriptivo
  confirmText = "Confirmar", // texto del botón de confirmación
  cancelText = "Cancelar",   // texto del botón de cancelar
  onConfirm,          // callback al confirmar
  onCancel            // callback al cancelar/cerrar
}) {
  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop-custom">
      <div className="modal-content-custom">
        {/* Encabezado del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          {/* Botón de cierre (usa onCancel) */}
          <button
            aria-label="Cerrar"
            onClick={onCancel}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>

        {/* Mensaje principal */}
        <p style={{ marginTop: 12, color: "#4b5563", lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Botones de acción */}
        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="btn" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
