import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { finishPresets } from '../data/carCatalog';

function PlaceholderCar() {
  const partsConfig = useStore((s) => s.partsConfig);
  const finish = finishPresets[partsConfig.finish] || finishPresets.glossy;
  const color = partsConfig.color;

  return (
    <group>
      {/* Car body */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[3.8, 0.5, 1.6]} />
        <meshStandardMaterial
          color={color}
          roughness={finish.roughness}
          metalness={finish.metalness}
          envMapIntensity={1.5}
        />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2, 0.45, 1.4]} />
        <meshStandardMaterial
          color={color}
          roughness={finish.roughness}
          metalness={finish.metalness}
          envMapIntensity={1.5}
          transparent
          opacity={0.85}
        />
      </mesh>
      {/* Wheels */}
      {[
        [-1.2, 0.15, 0.85],
        [-1.2, 0.15, -0.85],
        [1.2, 0.15, 0.85],
        [1.2, 0.15, -0.85],
      ].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function GlbModel({ modelPath }) {
  const { scene } = useGLTF(modelPath);
  const partsConfig = useStore((s) => s.partsConfig);

  useEffect(() => {
    if (!scene) return;
    const color = new THREE.Color(partsConfig.color);
    const finish = finishPresets[partsConfig.finish] || finishPresets.glossy;

    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.color = color;
        child.material.roughness = finish.roughness;
        child.material.metalness = finish.metalness;
        child.material.envMapIntensity = 1.5;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, partsConfig.color, partsConfig.finish]);

  if (!scene) return null;
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
}

export default function CarModel({ modelPath }) {
  const [glbAvailable, setGlbAvailable] = useState(false);

  useEffect(() => {
    if (!modelPath) {
      setGlbAvailable(false);
      return;
    }
    // Check content-type because Vite SPA fallback returns HTML with 200
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        const ct = res.headers.get('content-type') || '';
        setGlbAvailable(res.ok && !ct.includes('text/html'));
      })
      .catch(() => setGlbAvailable(false));
  }, [modelPath]);

  if (!modelPath || !glbAvailable) {
    return <PlaceholderCar />;
  }

  return <GlbModel modelPath={modelPath} />;
}
