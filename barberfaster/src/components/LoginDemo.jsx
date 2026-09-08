import { useEffect, useState } from "react";

const BASE_URL = "http://localhost/erpbarber/barberfaster/backend";

export default function LoginDemo({ onLogin }) {
  const [barberos, setBarberos] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${BASE_URL}/usuarios/listar_barberos_demo.php`)
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) throw new Error(data.error || "No se pudo cargar la lista de barberos.");
        setBarberos(data);
        setSelectedId(data[0] ? String(data[0].id_usuario) : "");
      })
      .catch((requestError) => setError(requestError.message || "No se pudo conectar con el backend."))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const barbero = barberos.find((item) => String(item.id_usuario) === selectedId);
    if (!barbero) {
      setError("Selecciona un barbero para ingresar.");
      return;
    }

    setEntering(true);
    onLogin(barbero);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand"><div className="auth-badge">BF</div><div><h1>BarberFaster</h1><p>Acceso demo para barberos</p></div></div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="barbero-demo">Selecciona tu perfil</label>
            <select id="barbero-demo" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={loading || !barberos.length} required>
              <option value="">{loading ? "Cargando barberos..." : "Selecciona un barbero"}</option>
              {barberos.map((barbero) => <option key={barbero.id_usuario} value={barbero.id_usuario}>{barbero.nombre} {barbero.apellido || ""} - {barbero.barberia}</option>)}
            </select>
          </div>
          {error && <p className="status error">{error}</p>}
          <button className="btn auth-btn" type="submit" disabled={loading || entering || !barberos.length}>{entering ? "Ingresando..." : "Ingresar"}</button>
        </form>
      </div>
    </div>
  );
}
