export function FormLogin() {
  return (
    <form className="card p-4 shadow border border-5 border-success rounded-4">
      <div className="mb-3">
        <label htmlFor="email" className="form-label">
          Correo
        </label>

        <input
          type="email"
          className="form-control"
          id="email"
          placeholder="Ingresa tu correo electrónico"
        />
      </div>

      <div className="mb-3">
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>

        <input
          type="password"
          className="form-control"
          id="password"
          placeholder="Ingresa una contraseña segura"
        />
      </div>

      <p>
        <a htmlFor="link-opacity-75" href="#">¿Olvidaste tu contraseña?</a>
      </p>

      <button type="submit" className="btn btn-primary w-100"><a className="fw-semibold text-light link-underline link-underline-opacity-0" href="Clientes">
        Iniciar sesión
      </a></button>
    </form>
  );
}
