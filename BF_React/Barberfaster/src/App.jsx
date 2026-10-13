import { Routes, Route } from 'react-router-dom';

// Importación de rutas
import Index from './pages/Index';
import Clientes from './pages/Clientes';
import Barberos from './pages/Barberos';

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/barberos" element={<Barberos />} />
      </Routes>
    </div>
  );
}

export default App;