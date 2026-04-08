import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { fetchDesign, toggleLike } from '../api';
import useStore from '../store';
import StudioLighting from './StudioLighting';
import CarModel from './CarModel';
import './DesignDetail.css';

export default function DesignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const nickname = useStore((s) => s.nickname);
  const [design, setDesign] = useState(null);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    fetchDesign(id).then(setDesign);
  }, [id]);

  const handleLike = async () => {
    if (!nickname) return;
    const result = await toggleLike(id, nickname);
    setLiked(result.liked);
    setDesign((prev) => ({ ...prev, likes_count: result.likes_count }));
  };

  if (!design) {
    return <div className="detail-loading">Loading...</div>;
  }

  return (
    <div className="design-detail">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/gallery')}>
          Gallery
        </button>
        <h1>{design.title}</h1>
      </header>

      <div className="detail-layout">
        <div className="detail-canvas">
          <Canvas
            gl={{ antialias: true }}
            shadows
            style={{ background: '#0a0a0a' }}
          >
            <PerspectiveCamera makeDefault position={[4, 2, 6]} fov={45} />
            <OrbitControls
              enablePan={false}
              minDistance={3}
              maxDistance={15}
              target={[0, 0.5, 0]}
            />
            <StudioLighting />
            <CarModel modelPath={`/models/${design.base_model}.glb`} />
          </Canvas>
        </div>

        <div className="detail-info">
          <div className="info-section">
            <div className="info-label">DESIGNER</div>
            <div className="info-value">{design.nickname}</div>
          </div>
          <div className="info-section">
            <div className="info-label">BRAND</div>
            <div className="info-value">{design.brand}</div>
          </div>
          <div className="info-section">
            <div className="info-label">MODEL</div>
            <div className="info-value">{design.base_model}</div>
          </div>
          <div className="info-section">
            <div className="info-label">COLOR</div>
            <div className="info-color">
              <div
                className="color-preview"
                style={{ background: design.parts_config?.color || '#000' }}
              />
              <span>{design.parts_config?.color}</span>
            </div>
          </div>
          <div className="info-section">
            <div className="info-label">FINISH</div>
            <div className="info-value">{design.parts_config?.finish}</div>
          </div>

          <button className="like-button" onClick={handleLike}>
            {liked ? 'Liked' : 'Like'} ({design.likes_count})
          </button>

          <button
            className="edit-button"
            onClick={() => navigate('/studio')}
          >
            Create New Design
          </button>
        </div>
      </div>
    </div>
  );
}
