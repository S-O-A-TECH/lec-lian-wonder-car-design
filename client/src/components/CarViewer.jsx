import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Suspense, useEffect, useRef } from 'react';
import * as THREE from 'three';
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

// Auto-adjusts camera and controls to fit the loaded car model
function CameraFitter() {
  const { scene, camera } = useThree();
  const controlsRef = useRef();

  useEffect(() => {
    // Find the car model group (skip lights, ground plane, etc.)
    // Wait a frame for the model to be in the scene
    const timer = setTimeout(() => {
      const box = new THREE.Box3();
      let hasModel = false;

      scene.traverse((child) => {
        if (child.isMesh && child.geometry) {
          // Skip ground plane (very large flat meshes)
          const geo = child.geometry;
          if (geo.type === 'PlaneGeometry') return;
          box.expandByObject(child);
          hasModel = true;
        }
      });

      if (!hasModel || box.isEmpty()) return;

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      box.getCenter(center);
      box.getSize(size);

      // Update OrbitControls target to car center
      if (controlsRef.current) {
        controlsRef.current.target.copy(center);
        controlsRef.current.update();
      }

      // Position camera to see the whole car
      const maxDim = Math.max(size.x, size.y, size.z);
      const dist = maxDim * 1.8;
      camera.position.set(
        center.x + dist * 0.6,
        center.y + dist * 0.4,
        center.z + dist * 0.8
      );
      camera.lookAt(center);
    }, 200);

    return () => clearTimeout(timer);
  }, [scene, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      enableRotate={true}
      minDistance={1}
      maxDistance={25}
      minPolarAngle={0.1}
      maxPolarAngle={Math.PI / 2 - 0.05}
      zoomSpeed={1.2}
    />
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
      <PerspectiveCamera makeDefault position={[5, 3, 7]} fov={45} />
      <CameraFitter key={modelPath} />
      <StudioLighting />
      <Suspense fallback={<LoadingFallback />}>
        <CarModel modelPath={modelPath} />
      </Suspense>
    </Canvas>
  );
}
