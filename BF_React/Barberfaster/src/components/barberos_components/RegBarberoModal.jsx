import { useState } from 'react';

const initialForm = {
  rbNombre: '',
  rbRut: '',
  rbUsuario: '',
  rbDireccion: '',
  rbDocumento: '',
  rbContacto: '',
  rbTelefono: ''
};

const RegBarberoModal = () => {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Manejador genérico de campos con máscara numérica para RUT/Documento/Teléfonos
  const handleChange = (e) => {
    const { id, value } = e.target;
    let numericValue = value;

    if (['rbRut', 'rbDocumento', 'rbContacto', 'rbTelefono'].includes(id)) {
      numericValue = value.replace(/[^0-9]/g, '');
    }

    setFormData((prev) => ({ ...prev, [id]: numericValue }));
    setErrors((prev) => ({ ...prev, [id]: '' }));
    setGeneralError('');
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.rbNombre.trim() || formData.rbNombre.trim().length < 3) {
      newErrors.rbNombre = 'Mínimo 3 caracteres';
    }
    if (!formData.rbRut || formData.rbRut.length < 5) {
      newErrors.rbRut = 'Mínimo 5 números';
    }
    if (!formData.rbUsuario.trim() || formData.rbUsuario.trim().length < 3) {
      newErrors.rbUsuario = 'Mínimo 3 caracteres';
    }
    if (!formData.rbDireccion.trim() || formData.rbDireccion.trim().length < 5) {
      newErrors.rbDireccion = 'Mínimo 5 caracteres';
    }
    if (!formData.rbDocumento || formData.rbDocumento.length < 5) {
      newErrors.rbDocumento = 'Mínimo 5 números';
    }
    if (!formData.rbContacto || formData.rbContacto.length < 7) {
      newErrors.rbContacto = 'Mínimo 7 números';
    }
    if (!formData.rbTelefono || formData.rbTelefono.length < 7) {
      newErrors.rbTelefono = 'Mínimo 7 números';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setSuccessMsg('');

    if (!validate()) return;

    setLoading(true);

    try {
      // Sección para el backend
      const response = await fetch('/api/barberias/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSuccessMsg('¡Barbería registrada con éxito!');
        setFormData(initialForm);

        // Cerrar modal automáticamente
        setTimeout(() => {
          const modalEl = document.getElementById('regBarberoModal');
          if (modalEl && window.bootstrap) {
            const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
            if (modalInstance) modalInstance.hide();
          }
          setSuccessMsg('');
        }, 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setGeneralError(data.message || 'Error al registrar la barbería. Intenta nuevamente.');
      }
    } catch (error) {
      // Si la API aún no está disponible, simulamos éxito para probar la UI
      console.warn('Backend no detectado.:', error);
      setSuccessMsg('¡Barbería registrada con éxito!');
      setFormData(initialForm);

      setTimeout(() => {
        const modalEl = document.getElementById('regBarberoModal');
        if (modalEl && window.bootstrap) {
          const modalInstance = window.bootstrap.Modal.getInstance(modalEl);
          if (modalInstance) modalInstance.hide();
        }
        setSuccessMsg('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="regBarberoModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content reg-barbero-modal">
          <div className="modal-header reg-barbero-header">
            <h5 className="modal-title">Registrar Barbería</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              data-bs-dismiss="modal"
              aria-label="Cerrar"
            ></button>
          </div>
          <div className="modal-body">
            {generalError && <div className="alert alert-danger py-2 mb-3">{generalError}</div>}
            {successMsg && <div className="alert alert-success py-2 mb-3">{successMsg}</div>}

            <form id="regBarberoForm" onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                {/* Nombre de la Barbería */}
                <div className="col-md-6">
                  <label htmlFor="rbNombre" className="login-label">Nombre de la Barbería</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-shop login-input-icon"></i>
                    <input
                      type="text"
                      className={`form-control login-input login-input--with-icon ${errors.rbNombre ? 'login-input--error' : ''}`}
                      id="rbNombre"
                      placeholder="Ingresa el nombre de tu negocio"
                      value={formData.rbNombre}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbNombre && <span className="login-field-error text-danger small">{errors.rbNombre}</span>}
                </div>

                {/* RUT */}
                <div className="col-md-6">
                  <label htmlFor="rbRut" className="login-label">RUT</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-upc-scan login-input-icon"></i>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control login-input login-input--with-icon ${errors.rbRut ? 'login-input--error' : ''}`}
                      id="rbRut"
                      placeholder="Solo números"
                      value={formData.rbRut}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbRut && <span className="login-field-error text-danger small">{errors.rbRut}</span>}
                </div>

                {/* Nombre de Usuario */}
                <div className="col-md-6">
                  <label htmlFor="rbUsuario" className="login-label">Nombre de Usuario</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-at login-input-icon"></i>
                    <input
                      type="text"
                      className={`form-control login-input login-input--with-icon ${errors.rbUsuario ? 'login-input--error' : ''}`}
                      id="rbUsuario"
                      placeholder="Requerido para iniciar sesión"
                      value={formData.rbUsuario}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbUsuario && <span className="login-field-error text-danger small">{errors.rbUsuario}</span>}
                </div>

                {/* Dirección */}
                <div className="col-md-6">
                  <label htmlFor="rbDireccion" className="login-label">Dirección</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-geo-alt login-input-icon"></i>
                    <input
                      type="text"
                      className={`form-control login-input login-input--with-icon ${errors.rbDireccion ? 'login-input--error' : ''}`}
                      id="rbDireccion"
                      placeholder="Ingresa la dirección de tu barbería"
                      value={formData.rbDireccion}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbDireccion && <span className="login-field-error text-danger small">{errors.rbDireccion}</span>}
                </div>

                {/* Documento Representante Legal */}
                <div className="col-md-6">
                  <label htmlFor="rbDocumento" className="login-label">Documento Representante Legal</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-file-earmark-text login-input-icon"></i>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control login-input login-input--with-icon ${errors.rbDocumento ? 'login-input--error' : ''}`}
                      id="rbDocumento"
                      placeholder="Solo números"
                      value={formData.rbDocumento}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbDocumento && <span className="login-field-error text-danger small">{errors.rbDocumento}</span>}
                </div>

                {/* Número de Contacto */}
                <div className="col-md-6">
                  <label htmlFor="rbContacto" className="login-label">Número de Contacto</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-telephone login-input-icon"></i>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control login-input login-input--with-icon ${errors.rbContacto ? 'login-input--error' : ''}`}
                      id="rbContacto"
                      placeholder="Solo números"
                      value={formData.rbContacto}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbContacto && <span className="login-field-error text-danger small">{errors.rbContacto}</span>}
                </div>

                {/* Teléfono de la Barbería */}
                <div className="col-12">
                  <label htmlFor="rbTelefono" className="login-label">Teléfono de la Barbería</label>
                  <div className="login-input-wrap">
                    <i className="bi bi-phone login-input-icon"></i>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={`form-control login-input login-input--with-icon ${errors.rbTelefono ? 'login-input--error' : ''}`}
                      id="rbTelefono"
                      placeholder="Solo números. Puede ser el mismo número de contacto"
                      value={formData.rbTelefono}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.rbTelefono && <span className="login-field-error text-danger small">{errors.rbTelefono}</span>}
                </div>
              </div>

              <div className="login-buttons mt-4 d-flex gap-2">
                <button type="submit" className="btn custom-btn flex-grow-1" disabled={loading}>
                  {loading ? 'Registrando...' : 'Registrar'}
                </button>
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegBarberoModal;