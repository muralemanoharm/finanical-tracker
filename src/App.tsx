import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FinancialDataProvider } from './context/FinancialDataContext';
import { Shell } from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import Instruments from './pages/Instruments';
import Projections from './pages/Projections';
import Insurance from './pages/Insurance';
import Recommendations from './pages/Recommendations';
import Goals from './pages/Goals';
import Settings from './pages/Settings';

function App() {
  return (
    <FinancialDataProvider>
      <BrowserRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/instruments" element={<Instruments />} />
            <Route path="/projections" element={<Projections />} />
            <Route path="/insurance" element={<Insurance />} />
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Shell>
      </BrowserRouter>
    </FinancialDataProvider>
  );
}

export default App;
