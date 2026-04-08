import { Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import Studio from './components/Studio';
import Gallery from './components/Gallery';
import DesignDetail from './components/DesignDetail';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/studio" element={<Studio />} />
      <Route path="/gallery" element={<Gallery />} />
      <Route path="/design/:id" element={<DesignDetail />} />
    </Routes>
  );
}
