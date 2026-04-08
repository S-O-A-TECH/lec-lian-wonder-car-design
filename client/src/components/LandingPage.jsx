import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { fetchDesigns } from '../api';
import './LandingPage.css';

function HeroCar() {
  return (
    <>
      <ambientLight intensity={0.2} />
      <directionalLight position={[5, 8, 5]} intensity={1.5} />
      <directionalLight position={[-5, 4, -3]} intensity={0.5} color="#b0c4de" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#080808" roughness={0.3} metalness={0.8} />
      </mesh>
      <group>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[3.5, 0.6, 1.6]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, -0.1]} castShadow>
          <boxGeometry args={[2, 0.5, 1.4]} />
          <meshStandardMaterial color="#1a1a2e" roughness={0.2} metalness={0.8} />
        </mesh>
        {[[-1.2, 0.05, 0.85], [-1.2, 0.05, -0.85], [1.2, 0.05, 0.85], [1.2, 0.05, -0.85]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
            <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
          </mesh>
        ))}
      </group>
      <Environment preset="studio" background={false} />
    </>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [popular, setPopular] = useState([]);

  useEffect(() => {
    fetchDesigns('popular', 1).then((data) => setPopular(data.designs?.slice(0, 4) || []));
  }, []);

  return (
    <div className="landing">
      <div className="hero-section">
        <div className="hero-canvas">
          <Canvas>
            <PerspectiveCamera makeDefault position={[4, 2, 5]} fov={40} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1} />
            <HeroCar />
          </Canvas>
        </div>

        <div className="hero-content">
          <h1 className="hero-title">
            <span className="title-accent">WONDER</span> CAR
          </h1>
          <p className="hero-subtitle">Design Your Dream Car</p>
          <div className="hero-buttons">
            <button className="cta-button" onClick={() => navigate('/studio')}>
              Start Designing
            </button>
            <button className="cta-secondary" onClick={() => navigate('/gallery')}>
              View Gallery
            </button>
          </div>
        </div>
      </div>

      {popular.length > 0 && (
        <div className="popular-section">
          <h2>Popular Designs</h2>
          <div className="popular-grid">
            {popular.map((d) => (
              <div
                key={d.id}
                className="popular-card"
                onClick={() => navigate(`/design/${d.id}`)}
              >
                <img src={d.thumbnail} alt={d.title} />
                <div className="popular-info">
                  <span>{d.title}</span>
                  <span className="popular-likes">{d.likes_count} likes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
