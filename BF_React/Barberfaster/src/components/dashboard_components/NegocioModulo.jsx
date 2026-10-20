import { useState, useRef } from 'react';
import AddServiceModal from './AddServiceModal';
import ToastNotification from './ToastNotification';

const NegocioModulo = ({ user, bizData, updateBizData }) => {
  const [selectedBarberId, setSelectedBarberId] = useState('self');
  const [inviteEmail, setInviteEmail] = useState('');
  const [addressInput, setAddressInput] = useState(bizData.direccion || '');
  
  // Estados para Modal de Servicio y la notificación Toast
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingServiceData, setPendingServiceData] = useState({ barberId: null, imgIdx: null });
  const [toastMessage, setToastMessage] = useState(null);
  const fileInputRef = useRef(null);

  const selectedBarber = bizData.barberos.find(b => b.id === selectedBarberId) || bizData.barberos[0];
  const mapUrl = bizData.direccion 
    ? `https://maps.google.com/maps?q=${encodeURIComponent(bizData.direccion)}&output=embed`
    : `https://maps.google.com/maps?q=Bogot%C3%A1,Colombia&output=embed`;

  const handleUpdateAddress = () => {
    if (!addressInput.trim()) return;
    updateBizData({ ...bizData, direccion: addressInput });
  };

  const handleInvite = () => {
    if (!inviteEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) return;
    const newInvite = { id: `inv_${Date.now()}`, email: inviteEmail, fecha: new Date().toLocaleDateString("es-CO") };
    updateBizData({ ...bizData, invitaciones: [...bizData.invitaciones, newInvite] });
    setInviteEmail('');
    
    // Notificación de Toast
    setToastMessage(`Invitación enviada exitosamente a ${newInvite.email}`);
  };

  const handleRemoveInvite = (idx) => {
    const newInvites = [...bizData.invitaciones];
    newInvites.splice(idx, 1);
    updateBizData({ ...bizData, invitaciones: newInvites });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("El archivo excede el tamaño máximo de 2MB.");
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (img.width < 240 || img.height < 240 || img.width > 5000 || img.height > 5000) {
        alert("La imagen debe tener un tamaño entre 240x240 px y 5000x5000 px.");
        URL.revokeObjectURL(objectUrl);
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const newBarberos = [...bizData.barberos];
        const barberIndex = newBarberos.findIndex(b => b.id === selectedBarberId);
        if (barberIndex > -1) {
          newBarberos[barberIndex].portafolio.push({ imagen: ev.target.result, servicios: [] });
          updateBizData({ ...bizData, barberos: newBarberos });
        }
      };
      reader.readAsDataURL(file);
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
    e.target.value = '';
  };

  const handleRemoveImage = (imgIdx) => {
    const newBarberos = [...bizData.barberos];
    const bIdx = newBarberos.findIndex(b => b.id === selectedBarberId);
    newBarberos[bIdx].portafolio.splice(imgIdx, 1);
    updateBizData({ ...bizData, barberos: newBarberos });
  };

  const handleRemoveService = (imgIdx) => {
    const newBarberos = [...bizData.barberos];
    const bIdx = newBarberos.findIndex(b => b.id === selectedBarberId);
    // Se elimina el servicio único asociado
    newBarberos[bIdx].portafolio[imgIdx].servicios = [];
    updateBizData({ ...bizData, barberos: newBarberos });
  };

  const openAddServiceModal = (imgIdx) => {
    setPendingServiceData({ barberId: selectedBarberId, imgIdx });
    setIsModalOpen(true);
  };

  const handleAddOrUpdateService = (nombre, precio) => {
    const newBarberos = [...bizData.barberos];
    const bIdx = newBarberos.findIndex(b => b.id === pendingServiceData.barberId);
    
    // Si ya hay servicio se edita
    newBarberos[bIdx].portafolio[pendingServiceData.imgIdx].servicios = [{ nombre, precio }];
    
    updateBizData({ ...bizData, barberos: newBarberos });
  };

  return (
    <section className="dash-section active">
      {toastMessage && (
        <ToastNotification 
          message={toastMessage} 
          onClose={() => setToastMessage(null)} 
        />
      )}

      <h2 className="dash-section-title">Tu negocio</h2>
      <p className="dash-section-sub">Gestiona la información de tu barbería.</p>

      {/* Info básica */}
      <div className="dash-card">
        <div className="d-flex align-items-center gap-3">
          <div className="dash-avatar" style={{ margin: 0, width: "50px", height: "50px" }}>
            <i className="bi bi-scissors" style={{ fontSize: "1.2rem" }}></i>
          </div>
          <div>
            <h4 className="m-0" style={{ fontFamily: "Chillax", fontWeight: 800 }}>
              {user?.barberia || "Nombre de la barbería"}
            </h4>
            <p className="text-muted m-0 small">
              {bizData.direccion || 'Dirección no configurada'}
            </p>
          </div>
        </div>
      </div>

      {/* Portafolio */}
      <h3 className="dash-subtitle">Portafolio</h3>
      <div className="dash-card">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-bold" style={{ color: "var(--bauhaus-ink)" }}><i className="bi bi-images me-1"></i> Imágenes</span>
            <select className="brutalist-input" value={selectedBarberId} onChange={e => setSelectedBarberId(e.target.value)} style={{ width: "auto", minWidth: "180px", padding: "0.5rem" }}>
              <option value="self">{user.nombreCompleto} (Tú)</option>
              {bizData.invitaciones.map(inv => (
                <option key={inv.id} value={inv.id}>{inv.email}</option>
              ))}
            </select>
          </div>
          <div className="text-end">
            <button className="custom-btn" onClick={() => fileInputRef.current.click()}>
              <i className="bi bi-plus-lg me-1"></i> Agregar Imagen
            </button>
            <div className="mt-2 fw-bold" style={{ fontSize: '0.75rem', color: 'var(--bauhaus-orange)' }}>
              Requerido: Mínimo 240x240 px / Máximo 5000x5000 px
            </div>
            <input type="file" ref={fileInputRef} accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
          </div>
        </div>

        <div className="dash-portfolio-grid">
          {selectedBarber.portafolio.length === 0 ? (
             <p className="text-muted text-center py-4" style={{ gridColumn: "1/-1" }}>No hay imágenes en el portafolio aún.</p>
          ) : (
            selectedBarber.portafolio.map((item, imgIdx) => {
              const servicioUnico = item.servicios && item.servicios.length > 0 ? item.servicios[0] : null;

              return (
                <div key={imgIdx} className="dash-portfolio-item">
                  <div className="dash-portfolio-img-wrap">
                    <img src={item.imagen} alt="Portafolio" />
                  </div>
                  <div className="dash-portfolio-body">
                    {servicioUnico ? (
                      <div className="dash-servicio-row">
                        <span className="dash-servicio-nombre">{servicioUnico.nombre}</span>
                        <div className="d-flex align-items-center">
                          <span className="dash-servicio-precio me-3">${servicioUnico.precio.toLocaleString("es-CO")}</span>
                          <button className="dash-icon-btn" onClick={() => handleRemoveService(imgIdx)} title="Eliminar servicio"><i className="bi bi-x-lg"></i></button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted small text-center my-2" style={{ fontStyle: 'italic' }}>Sin servicio asociado</p>
                    )}

                    <div className="d-flex gap-2 mt-auto pt-3">
                      <button className="custom-btn flex-grow-1" style={{ padding: "0.5rem" }} onClick={() => openAddServiceModal(imgIdx)}>
                        <i className="bi bi-pencil-square me-1"></i> {servicioUnico ? 'Editar' : 'Servicio'}
                      </button>
                      <button className="custom-btn" style={{ padding: "0.5rem 0.8rem", backgroundColor: "var(--bauhaus-neutral)", color: "var(--bauhaus-ink)" }} onClick={() => handleRemoveImage(imgIdx)} title="Eliminar imagen">
                        <i className="bi bi-trash3"></i>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Equipo */}
      <h3 className="dash-subtitle">Equipo de barberos</h3>
      <div className="dash-card">
        <p className="text-muted mb-3 small">Invita barberos ingresando su correo electrónico.</p>
        <div className="d-flex gap-2 mb-4">
          <input type="email" className="brutalist-input flex-grow-1" placeholder="barbero@barberia.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <button className="custom-btn" onClick={handleInvite}><i className="bi bi-send me-1"></i> Invitar</button>
        </div>
        <div>
          {bizData.invitaciones.length === 0 ? (
            <p className="text-muted small m-0">No hay barberos invitados aún.</p>
          ) : (
            bizData.invitaciones.map((inv, idx) => (
              <div key={inv.id} className="d-flex justify-content-between align-items-center p-2 mb-2" style={{ border: "2px solid var(--bauhaus-gray)", backgroundColor: "var(--bauhaus-neutral)" }}>
                <div><span className="fw-bold me-3">{inv.email}</span><small className="text-muted">{inv.fecha}</small></div>
                <button className="dash-icon-btn" onClick={() => handleRemoveInvite(idx)}><i className="bi bi-x-lg"></i></button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mapa */}
      <h3 className="dash-subtitle">Ubicación</h3>
      <div className="dash-card">
        <div className="d-flex gap-2 mb-3">
          <input type="text" className="brutalist-input flex-grow-1" value={addressInput} onChange={e => setAddressInput(e.target.value)} placeholder="Ej: Carrera 15 # 85-20, Bogotá" />
          <button className="custom-btn" onClick={handleUpdateAddress}><i className="bi bi-geo-alt me-1"></i> Buscar</button>
        </div>
        <div className="dash-map-wrap">
          <iframe src={mapUrl} allowFullScreen="" loading="lazy" title="Mapa del negocio"></iframe>
        </div>
      </div>

      <AddServiceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddOrUpdateService} />
    </section>
  );
};

export default NegocioModulo;