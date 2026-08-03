import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="bg-dark text-white vh-100 p-3" style={{ width: "250px" }}>
      <h4 className="text-center mb-4">BarberFaster</h4>

      <ul className="nav nav-pills flex-column gap-2">
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/barberias">
            Barberías
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/barberos">
            Barberos
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/servicios">
            Servicios
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/clientes">
            Clientes
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink className="nav-link text-white" to="/usuarios">
            Usuarios
          </NavLink>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;