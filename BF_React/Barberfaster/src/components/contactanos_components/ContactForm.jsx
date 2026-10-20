import { useState, useEffect } from 'react';

const ContactForm = () => {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [asunto, setAsunto] = useState('Información general');
  const [mensaje, setMensaje] = useState('');
  
  // Estados para la notificación flotante
  const [showSuccess, setShowSuccess] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Intentar autocompletar nombre y teléfono si hay sesión activa
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("bf_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setNombre(user.usuario || user.nombre || user.nombreCompleto || '');
        
        if (user.telefono) {
          const justNumber = user.telefono.replace('+57', '').replace(/\D/g, '');
          setTelefono(justNumber);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleNumberInput = (e) => {
    const onlyNums = e.target.value.replace(/\D/g, ''); 
    if (onlyNums.length <= 10) {
      setTelefono(onlyNums);
    }
  };

  const handleCloseToast = () => {
    setIsExiting(true);
    setTimeout(() => {
      setShowSuccess(false);
      setIsExiting(false);
    }, 400); // Coincide con la duración del slide-out CSS
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || telefono.length !== 10 || !mensaje) return;

    // Simulación de envío
    console.log(`Enviando correo a soportebarberfaster@gmail.com desde: ${nombre} (+57 ${telefono}) | Asunto: ${asunto}`);

    // Mostrar notificación
    setIsExiting(false);
    setShowSuccess(true);
    setMensaje(''); // Limpiar el mensaje

    // Iniciar animación de salida a los 4.6 segundos y ocultar a los 5 segundos
    setTimeout(() => {
      setIsExiting(true);
    }, 4600);

    setTimeout(() => {
      setShowSuccess(false);
      setIsExiting(false);
    }, 5000);
  };

  return (
    <>
      {/* Notificación */}
      {showSuccess && (
        <div 
          className={`brutalist-toast-notification ${isExiting ? 'toast-slide-out' : 'toast-slide-in'}`}
          role="alert"
        >
          <div className="d-flex align-items-start gap-3">
            <i className="bi bi-check-circle-fill text-success fs-4"></i>
            <div className="flex-grow-1">
              <strong className="d-block mb-1 fs-6">¡Mensaje Enviado!</strong>
              <p className="mb-0 text-muted small">
                Hemos recibido tu mensaje. Nos pondremos en contacto contigo al número celular proporcionado.
              </p>
            </div>
            <button 
              type="button" 
              className="toast-close-btn" 
              onClick={handleCloseToast}
              aria-label="Cerrar"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div id="formulario-contacto" className="contact-form-wrap" data-aos="fade-up">
        <div className="contact-form-header">
          <h2 className="form-section-title">ENVÍANOS UN MENSAJE</h2>
          <div className="title-orange-separator"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label htmlFor="contactNombre" className="brutalist-label">Nombre</label>
              <input 
                type="text" 
                className="brutalist-input" 
                id="contactNombre" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                required 
              />
            </div>
            
            <div className="col-md-6">
              <label htmlFor="contactTelefono" className="brutalist-label">Teléfono</label>
              <div className="phone-input-group">
                <span className="phone-prefix">+57</span>
                <input 
                  type="text" 
                  className="brutalist-input phone-input-field" 
                  id="contactTelefono" 
                  value={telefono}
                  onChange={handleNumberInput}
                  placeholder="3000000000"
                  required 
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label htmlFor="contactAsunto" className="brutalist-label">Asunto</label>
            <select 
              className="brutalist-input" 
              style={{ cursor: 'pointer' }}
              id="contactAsunto"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
            >
              <option>Información general</option>
              <option>Soporte técnico</option>
              <option>Quiero registrar mi barbería</option>
              <option>Otro</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="contactMensaje" className="brutalist-label">Mensaje</label>
            <textarea 
              className="brutalist-input" 
              id="contactMensaje" 
              rows="5"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Escribe tu mensaje aquí..." 
              required
              style={{ resize: "vertical" }}
            ></textarea>
          </div>

          <button 
            type="submit" 
            className="custom-btn w-100 contact-submit-btn"
            style={{ 
              backgroundColor: telefono.length === 10 ? 'var(--bauhaus-cyan)' : 'var(--bauhaus-neutral)',
              color: telefono.length === 10 ? 'var(--bauhaus-ink)' : '#9a9a9a',
              cursor: telefono.length === 10 ? 'pointer' : 'not-allowed'
            }}
            disabled={telefono.length !== 10}
          >
            ENVIAR MENSAJE
          </button>
        </form>
      </div>
    </>
  );
};

export default ContactForm;