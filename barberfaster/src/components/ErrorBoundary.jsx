import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    // Estado inicial: sin errores
    this.state = { hasError: false, error: null, info: null };
  }

  // ==========================
  // Método estático: actualiza el estado cuando ocurre un error
  // ==========================
  static getDerivedStateFromError(error) {
    // Cambia el estado para mostrar la UI de fallback
    return { hasError: true, error };
  }

  // ==========================
  // Método de ciclo de vida: captura el error y la información del componente
  // ==========================
  componentDidCatch(error, info) {
    this.setState({ error, info });
    // También imprime en consola para el desarrollador
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught error', error, info);
  }

  // ==========================
  // Renderizado
  // ==========================
  render() {
    if (this.state.hasError) {
      // UI de fallback cuando ocurre un error
      return (
        <div style={{ padding: 40 }}>
          <h2>Se produjo un error en la aplicación</h2>
          {/* Mensaje del error */}
          <p style={{ color: '#b91c1c' }}>
            {String(this.state.error?.message || this.state.error)}
          </p>
          {/* Stack del componente donde ocurrió el error */}
          <pre style={{
            whiteSpace: 'pre-wrap',
            background: '#11182710',
            padding: 12,
            borderRadius: 8,
            overflowX: 'auto'
          }}>
            {this.state.info?.componentStack || ''}
          </pre>
          {/* Botón para recargar la aplicación */}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => window.location.reload()} className="btn">
              Recargar
            </button>
          </div>
        </div>
      );
    }

    // Si no hay error, renderiza los hijos normalmente
    return this.props.children;
  }
}

export default ErrorBoundary;
