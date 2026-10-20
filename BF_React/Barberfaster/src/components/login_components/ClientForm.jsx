import { useState } from 'react';

const ClientForm = ({ onAccess }) => {
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [codigo, setCodigo] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Filtra cualquier caracter que no sea número
  const handleNumberInput = (setter, maxLength) => (e) => {
    const onlyNums = e.target.value.replace(/\D/g, ''); 
    if (onlyNums.length <= maxLength) {
      setter(onlyNums);
    }
  };

  const handleSendCode = (e) => {
    e.preventDefault();
    if (dni.trim() && telefono.length === 10) {
      setIsCodeSent(true);
    }
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (codigo.trim().length > 0) {
      onAccess({ dni, telefono });
    }
  };

  // Previene el submit accidental y limpia el estado
  const handleGoBack = (e) => {
    e.preventDefault();
    setIsCodeSent(false);
    setCodigo(''); // Limpiar el código al retroceder
  };

  return (
    <div className="brutalist-form-box">
      <div className="form-eyebrow">ÁREA DEL CLIENTE</div>
      <h2 className="form-title">Tu perfil y tus citas</h2>
      <p className="form-subtitle">
        {isCodeSent 
          ? "Ingresa el código de 6 dígitos que enviamos a tu WhatsApp." 
          : "Confirma los datos con los que reservaste y verificaremos tu número por WhatsApp. La sesión será válida durante 30 minutos."}
      </p>

      {!isCodeSent ? (
        <form onSubmit={handleSendCode}>
          <div className="mb-3">
            <label className="brutalist-label">DNI / cédula</label>
            <input 
              type="text" 
              className="brutalist-input" 
              value={dni}
              onChange={handleNumberInput(setDni, 24)}
              placeholder="Ej: 1000000000"
              required 
            />
          </div>
          
          <div className="mb-4">
            <label className="brutalist-label">Teléfono asociado a la cuenta</label>
            <div className="phone-input-group">
              <span className="phone-prefix">+57</span>
              <input 
                type="text" 
                className="brutalist-input phone-input-field" 
                value={telefono}
                onChange={handleNumberInput(setTelefono, 10)}
                placeholder="3000000000"
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="custom-btn w-100 mb-4" 
            style={{ 
              backgroundColor: telefono.length === 10 ? 'var(--bauhaus-cyan)' : 'var(--bauhaus-neutral)',
              color: telefono.length === 10 ? 'var(--bauhaus-ink)' : '#9a9a9a',
              cursor: telefono.length === 10 ? 'pointer' : 'not-allowed'
            }}
            disabled={telefono.length !== 10}
          >
            ENVIAR CÓDIGO POR WHATSAPP
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode}>
          <div className="mb-4">
            <label className="brutalist-label">Código de verificación</label>
            <input 
              type="text" 
              className="brutalist-input text-center" 
              style={{ fontSize: '1.5rem', letterSpacing: '0.5em' }}
              value={codigo}
              onChange={handleNumberInput(setCodigo, 6)}
              placeholder="000000"
              required 
            />
          </div>
          <button type="submit" className="custom-btn w-100 mb-3" style={{ backgroundColor: 'var(--bauhaus-green)' }}>
            VERIFICAR Y ACCEDER
          </button>
          
          <button 
            type="button" 
            className="custom-btn btn-volver-atras w-100" 
            onClick={handleGoBack}
          >
            VOLVER ATRÁS
          </button>
        </form>
      )}
    </div>
  );
};

export default ClientForm;