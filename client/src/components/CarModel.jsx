import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { finishPresets, wheelPresets } from '../data/carCatalog';

const TARGET_SIZE = 4.5;

// Detect if a mesh is part of a wheel assembly
const WHEEL_RE = /wheel|rim|tire|tyre|hub|brake|caliper|disc|disk|rotor/i;
const WHEEL_EXCLUDE_RE = /steering|pedal|arch|vent|light|lamp|mirror|wiper/i;

// Detect interior/blocker meshes that should not be paintable from exterior
const BLOCKER_RE = /blocking|blocker|occluder|int_block|seat|leather|steering|steer|carpet|dashboard|console|interior|cabin|upholster/i;

function isWheelMesh(meshName, matName) {
  const combined = meshName + ' ' + matName;
  if (WHEEL_EXCLUDE_RE.test(combined)) return false;
  return WHEEL_RE.test(combined);
}

// Estimate 4 wheel positions from overall car bounding box
// Many models have all 4 wheels baked into single meshes, so we can't
// extract per-wheel positions from mesh bounding boxes. Instead, we
// use the car's overall dimensions to place wheels at standard positions.
function estimateWheelLayout(carBox) {
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  carBox.getCenter(center);
  carBox.getSize(size);

  const wheelRadius = size.y * 0.175;
  const wheelY = carBox.min.y + wheelRadius;
  const xOffset = size.x * 0.43;
  const zFront = center.z + size.z * 0.32;
  const zRear = center.z - size.z * 0.32;

  const positions = [
    { label: 'FL', position: new THREE.Vector3(center.x - xOffset, wheelY, zFront), isRight: false },
    { label: 'FR', position: new THREE.Vector3(center.x + xOffset, wheelY, zFront), isRight: true },
    { label: 'RL', position: new THREE.Vector3(center.x - xOffset, wheelY, zRear), isRight: false },
    { label: 'RR', position: new THREE.Vector3(center.x + xOffset, wheelY, zRear), isRight: true },
  ];

  return { positions, wheelRadius };
}

// Materials that should NEVER be classified as windows, even if transparent.
// Checked against MATERIAL NAME only (not mesh name) to avoid false matches
// like "defaultMaterial" triggering "metal".
const NOT_WINDOW_RE = /leather|seat|interior|fabric|carpet|upholster|cloth|suede|alcantara|paint|body|chrome|metallic|plastic|carbon|trim|bumper|fender|hood|trunk|door|panel|grille|grill|spoiler|skirt|diffuser|exhaust|logo|badge|license|rubber|vinyl/i;

// Detect if a material/mesh is a window or glass part
function isWindowMaterial(matName, meshName, material) {
  const name = (matName + ' ' + meshName).toLowerCase();

  // Exclude known non-window materials — check MATERIAL name only
  if (NOT_WINDOW_RE.test(matName.toLowerCase())) return false;

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
    name.includes('windshield_shad') ||
    name.includes('glasswindows') ||
    name.includes('tinted_glass')
  ) return true;

  // Property-based detection — only if name is generic/unknown
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

// Loads a standardized wheel GLB (axle=X, center=origin, diameter=1.0)
// and renders 4 copies at detected positions
function WheelSet({ wheelPath, positions, carScale, yOffset, wheelRadius }) {
  const gltf = useGLTF(wheelPath);

  const wheels = useMemo(() => {
    if (!gltf.scene || positions.length === 0) return [];

    // All wheel models are pre-standardized: axle=X, center=origin, diameter=1.0
    // Scale = targetDiam * carScale (combined, applied via JSX scale prop)
    const targetDiam = wheelRadius * 2;

    return positions.map(({ label, position, isRight }) => {
      const clone = gltf.scene.clone(true);

      // Force tire materials to black rubber, keep rim metallic
      let foundTire = false;
      clone.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const matName = (child.material.name || child.name || '').toLowerCase();
        const isTire = matName.includes('tire') || matName.includes('tyre') ||
          matName.includes('rubber') || matName.includes('pneu');
        if (isTire) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x111111, roughness: 0.9, metalness: 0.0,
          });
          foundTire = true;
        }
      });
      // If no tire material detected by name (single-material models),
      // darken the whole wheel to a dark alloy look
      if (!foundTire) {
        clone.traverse((child) => {
          if (!child.isMesh || !child.material) return;
          child.material = new THREE.MeshStandardMaterial({
            color: 0x333333, roughness: 0.3, metalness: 0.7,
          });
        });
      }

      const wrapper = new THREE.Group();
      wrapper.add(clone);
      return { label, position, isRight, group: wrapper, targetDiam };
    });
  }, [gltf.scene, positions, wheelRadius]);

  if (wheels.length === 0) return null;

  return (
    <group>
      {wheels.map(({ label, position, isRight, group, targetDiam }) => {
        const s = targetDiam * carScale;
        return (
          <primitive
            key={label}
            object={group}
            position={[
              position.x * carScale,
              position.y * carScale + yOffset,
              position.z * carScale,
            ]}
            scale={[s * (isRight ? -1 : 1), s, s]}
          />
        );
      })}
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
  const wheelData = useRef({ hasWheels: false, positions: [], radius: 0.3 });

  useEffect(() => {
    if (!clonedScene) return;
    originals.current.clear();

    // First pass: compute overall bounding box
    const totalBox = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    totalBox.getCenter(center);
    modelCenter.current.copy(center);
    const yMid = center.y;

    // Collect wheel meshes
    const detectedWheelMeshes = [];

    // Second pass: store per-mesh data
    clonedScene.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material;
        const matName = mat.name || child.name || '';
        const meshName = child.name || '';

        // Check if this is a wheel mesh
        const isWheel = isWheelMesh(meshName, matName);
        if (isWheel) {
          detectedWheelMeshes.push(child);
        }

        // Determine zone: upper/lower (Y) + front/rear (Z)
        const meshBox = new THREE.Box3().setFromObject(child);
        const meshCenter = new THREE.Vector3();
        meshBox.getCenter(meshCenter);
        const isUpper = meshCenter.y > yMid;
        const isFront = meshCenter.z > center.z;
        const zone = (isFront ? 'front' : 'rear') + '-' + (isUpper ? 'upper' : 'lower');

        // Create a zone-aware key: "matName::front-upper" etc.
        const zoneKey = matName + '::' + zone;

        const combinedName = matName + ' ' + meshName;
        const isWindow = isWindowMaterial(matName, child.name || '', mat);

        // Check if seat/leather material with white/light color needs default dark color
        const matLower = matName.toLowerCase();
        const isSeatLike = /seat|leather|upholster/i.test(matLower) && !isWindow;
        const origColor = mat.color;
        const isWhiteish = origColor && (origColor.r + origColor.g + origColor.b) > 2.5;
        const needsSeatFix = isSeatLike && isWhiteish;

        originals.current.set(child.uuid, {
          material: mat.clone(),
          matName,
          zoneKey,
          isWindow,
          isOriginallyOpaque: !mat.transparent || mat.opacity >= 0.95,
          isWheel,
          isBlocker: BLOCKER_RE.test(combinedName),
          needsSeatFix,
          hasVertexColors: !!mat.vertexColors,
        });
      }
    });

    // Estimate wheel layout from car bounding box
    wheelData.current.hasWheels = detectedWheelMeshes.length > 0;
    const layout = estimateWheelLayout(totalBox);
    wheelData.current.positions = layout.positions;
    wheelData.current.radius = layout.wheelRadius;

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
        } else if (orig.isOriginallyOpaque) {
          // Originally opaque glass (e.g. dark tinted factory glass) —
          // keep original material to hide empty interiors
          child.material = orig.material.clone();
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
        child.renderOrder = 999;
        return;
      }

      // === NON-WINDOW MATERIALS ===
      const userColor = materialColors[orig.zoneKey] || materialColors[orig.matName] || null;

      if (userColor) {
        // Painted: use user color but preserve surface detail maps
        const origMat = orig.material;
        child.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(userColor),
          roughness: finish.roughness,
          metalness: finish.metalness,
          clearcoat: finish.clearcoat || 0,
          clearcoatRoughness: finish.clearcoatRoughness || 0,
          reflectivity: finish.reflectivity || 0.5,
          envMapIntensity: finish.envMapIntensity || 1.5,
          normalMap: origMat.normalMap || null,
          roughnessMap: origMat.roughnessMap || null,
          aoMap: origMat.aoMap || null,
          vertexColors: orig.hasVertexColors,
        });
        child.material.name = orig.matName;
      } else if (orig.needsSeatFix) {
        // White seat/leather → force dark leather color
        child.material = orig.material.clone();
        child.material.color = new THREE.Color(0x1a1410);
        child.material.roughness = 0.7;
        child.material.metalness = 0.0;
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

  // Toggle wheel visibility when custom wheels selected
  const selectedWheels = partsConfig.wheels;
  const hasCustomWheels = selectedWheels && selectedWheels !== 'original';
  const [wheelPositions, setWheelPositions] = useState([]);
  const [wheelRadius, setWheelRadius] = useState(0.3);

  useEffect(() => {
    if (!clonedScene || originals.current.size === 0) return;

    clonedScene.traverse((child) => {
      if (!child.isMesh) return;
      const orig = originals.current.get(child.uuid);
      if (orig && orig.isWheel) {
        child.visible = !hasCustomWheels;
      }
    });

    // Update wheel positions for WheelSet
    if (hasCustomWheels && wheelData.current.hasWheels) {
      setWheelPositions(wheelData.current.positions);
      setWheelRadius(wheelData.current.radius);
    } else {
      setWheelPositions([]);
    }
  }, [clonedScene, hasCustomWheels]);

  // Get wheel GLB path
  const wheelPreset = wheelPresets.find((w) => w.id === selectedWheels);
  const wheelPath = wheelPreset?.path || null;

  // Click handler — iterates through intersections to find first paintable exterior mesh.
  // Skips windows/wheels/blockers. Once a window is hit, everything behind it
  // is considered interior and is also skipped.
  const handleClick = (e) => {
    e.stopPropagation();
    const intersections = e.intersections || [];
    let passedThroughWindow = false;
    for (const hit of intersections) {
      const mesh = hit.object;
      if (!mesh) continue;
      const orig = originals.current.get(mesh.uuid);
      if (!orig) continue;
      if (orig.isWheel || orig.isBlocker) continue;
      if (orig.isWindow) { passedThroughWindow = true; continue; }
      if (passedThroughWindow) continue; // interior — behind window
      setSelectedMaterial(orig.zoneKey);
      return;
    }
  };

  if (!clonedScene) return null;

  return (
    <group>
      <primitive
        object={clonedScene}
        scale={[scale, scale, scale]}
        position={[0, yOffset, 0]}
        onClick={handleClick}
      />
      {hasCustomWheels && wheelPath && wheelPositions.length > 0 && (
        <Suspense fallback={null}>
          <WheelSet
            wheelPath={wheelPath}
            positions={wheelPositions}
            carScale={scale}
            yOffset={yOffset}
            wheelRadius={wheelRadius}
          />
        </Suspense>
      )}
    </group>
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
