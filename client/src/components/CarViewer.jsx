import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import StudioLighting from './StudioLighting';
import CarModel from './CarModel';
import useStore from '../store';

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 0.8, 4]} />
      <meshStandardMaterial color="#333333" wireframe />
    </mesh>
  );
}

export default function CarViewer() {
  const selectedModel = useStore((s) => s.selectedModel);

  const modelPath = selectedModel
    ? `/models/${selectedModel.id}.glb`
    : null;

  return (
    <Canvas
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      shadows
      style={{ background: '#0a0a0a' }}
    >
      <PerspectiveCamera makeDefault position={[4, 2, 6]} fov={45} />
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={15}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, 0.5, 0]}
      />
      <StudioLighting />
      <Suspense fallback={<LoadingFallback />}>
        {modelPath ? (
          <CarModel modelPath={modelPath} />
        ) : (
          <CarModel modelPath={null} />
        )}
      </Suspense>
    </Canvas>
  );
}
