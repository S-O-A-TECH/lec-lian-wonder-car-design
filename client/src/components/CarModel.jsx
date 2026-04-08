import { useEffect, useState, useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { finishPresets } from '../data/carCatalog';

const TARGET_SIZE = 4.5;

// Detect if a material/mesh is a window or glass part
function isWindowMaterial(matName, meshName, material) {
  const name = (matName + ' ' + meshName).toLowerCase();

  // Name-based detection — covers many model naming conventions
  if (
    name.includes('window') ||
    name.includes('glass') ||
    name.includes('windshield') ||
    name.includes('windscreen') ||
    name.includes('vitre') ||       // French
    name.includes('vidro') ||       // Portuguese
    name.includes('fenster') ||     // German
    name.includes('lens') ||
    name.includes('transparent') ||
    name.includes('dispolarizado') ||
    name.includes('red_glass') ||
    name.includes('blue_glass') ||
    name.includes('light_glass') ||
    name.includes('lightglass') ||
    name.includes('windshield_shad') ||
    name.includes('mirror_glass') ||
    name.includes('glasswindows') ||
    name.includes('tinted_glass') ||
    name.includes('redglass')
  ) return true;

  // Property-based detection
  if (material) {
    if (material.transparent && material.opacity < 0.9) return true;
    if (material.transmission && material.transmission > 0.1) return true;
  }

  return false;
}

function PlaceholderCar() {
  const partsConfig = useStore((s) => s.partsConfig);
  const finish = finishPresets[partsConfig.finish] || finishPresets.glossy;
  const color = partsConfig.color;
  const isTinted = partsConfig.windowTint === 'tinted';

  return (
    <group>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[3.8, 0.5, 1.6]} />
        <meshPhysicalMaterial
          color={color}
          roughness={finish.roughness}
          metalness={finish.metalness}
          clearcoat={finish.clearcoat}
          clearcoatRoughness={finish.clearcoatRoughness}
          envMapIntensity={finish.envMapIntensity}
        />
      </mesh>
      <mesh position={[0, 0.8, 0]} castShadow>
        <boxGeometry args={[2, 0.45, 1.4]} />
        <meshPhysicalMaterial
          color={isTinted ? '#050505' : '#e0e0e0'}
          roughness={isTinted ? 0.05 : 0.0}
          metalness={isTinted ? 0.8 : 0.0}
          transparent
          opacity={isTinted ? 0.85 : 0.15}
          envMapIntensity={isTinted ? 2.0 : 0.3}
        />
      </mesh>
      {[[-1.2, 0.15, 0.85], [-1.2, 0.15, -0.85], [1.2, 0.15, 0.85], [1.2, 0.15, -0.85]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#222222" roughness={0.6} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

function GlbModel({ modelPath }) {
  const gltf = useGLTF(modelPath);
  const partsConfig = useStore((s) => s.partsConfig);
  const materialColors = useStore((s) => s.materialColors);
  const setSelectedMaterial = useStore((s) => s.setSelectedMaterial);
  const selectedMaterial = useStore((s) => s.selectedMaterial);

  // Clone scene ONCE
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  // Store original material data + bounding info for upper/lower split
  const originals = useRef(new Map());
  const modelCenter = useRef(new THREE.Vector3());
  useEffect(() => {
    if (!clonedScene) return;
    originals.current.clear();

    // First pass: compute overall bounding box
    const totalBox = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    totalBox.getCenter(center);
    modelCenter.current.copy(center);
    const yMid = center.y;

    // Second pass: store per-mesh data
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        const matName = mat.name || child.name || '';

        // Determine if this mesh is upper or lower body
        const meshBox = new THREE.Box3().setFromObject(child);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);
        const isUpper = meshCenter.y > yMid;

        // Create a zone-aware key: "matName::upper" or "matName::lower"
        const zoneKey = matName + '::' + (isUpper ? 'upper' : 'lower');

        originals.current.set(child.uuid, {
          material: mat.clone(),
          matName,
          zoneKey,
          isWindow: isWindowMaterial(matName, child.name || '', mat),
        });
      }
    });
  }, [clonedScene]);

  // Scale and position
  const { scale, yOffset } = useMemo(() => {
    if (!clonedScene) return { scale: 1, yOffset: 0 };
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const s = maxDim > 0 ? TARGET_SIZE / maxDim : 1;
    return { scale: s, yOffset: -box.min.y * s };
  }, [clonedScene]);

  // Apply materials — always from originals
  useEffect(() => {
    if (!clonedScene || originals.current.size === 0) return;
    const finish = finishPresets[partsConfig.finish] || finishPresets.glossy;
    const isTinted = partsConfig.windowTint === 'tinted';

    clonedScene.traverse((child) => {
      if (!child.isMesh) return;
      const orig = originals.current.get(child.uuid);
      if (!orig) return;

      child.castShadow = true;
      child.receiveShadow = true;

      // === WINDOW MATERIALS ===
      if (orig.isWindow) {
        if (isTinted) {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x050505,
            roughness: 0.05,
            metalness: 0.8,
            transparent: true,
            opacity: 0.85,
            depthWrite: false,
            envMapIntensity: 2.5,
            side: THREE.DoubleSide,
          });
        } else {
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            roughness: 0.0,
            metalness: 0.0,
            transparent: true,
            opacity: 0.1,
            depthWrite: false,
            envMapIntensity: 0.3,
            side: THREE.DoubleSide,
          });
        }
        child.material.name = orig.matName;
        child.renderOrder = 999; // Render windows last for proper transparency
        return;
      }

      // === NON-WINDOW MATERIALS ===
      // Check color by zoneKey first (upper/lower split), then by matName
      const userColor = orig.isWindow ? null
        : (materialColors[orig.zoneKey] || materialColors[orig.matName] || null);

      if (userColor) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(userColor),
          roughness: finish.roughness,
          metalness: finish.metalness,
          clearcoat: finish.clearcoat || 0,
          clearcoatRoughness: finish.clearcoatRoughness || 0,
          reflectivity: finish.reflectivity || 0.5,
          envMapIntensity: finish.envMapIntensity || 1.5,
        });
        child.material.name = orig.matName;
      } else {
        child.material = orig.material.clone();
      }

      // Highlight: match both zoneKey and matName
      const isSelected = selectedMaterial &&
        (orig.zoneKey === selectedMaterial || orig.matName === selectedMaterial);
      if (isSelected) {
        child.material.emissive = new THREE.Color(0x4a3a00);
        child.material.emissiveIntensity = 0.4;
      }
    });
  }, [clonedScene, materialColors, partsConfig.finish, partsConfig.windowTint, selectedMaterial]);

  // Click handler — uses zoneKey for upper/lower split
  const handleClick = (e) => {
    e.stopPropagation();
    const mesh = e.object;
    if (!mesh) return;
    const orig = originals.current.get(mesh.uuid);
    if (orig && !orig.isWindow) {
      // Use zoneKey so same material can be split into upper/lower
      setSelectedMaterial(orig.zoneKey);
    }
  };

  if (!clonedScene) return null;

  return (
    <primitive
      object={clonedScene}
      scale={[scale, scale, scale]}
      position={[0, yOffset, 0]}
      onClick={handleClick}
    />
  );
}

export default function CarModel({ modelPath }) {
  const [glbAvailable, setGlbAvailable] = useState(false);

  useEffect(() => {
    if (!modelPath) {
      setGlbAvailable(false);
      return;
    }
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
