import { useEffect, useState, useMemo, useRef, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import useStore from '../store';
import { finishPresets, wheelPresets } from '../data/carCatalog';


const TARGET_SIZE = 4.5;

// Detect if a mesh is part of a wheel assembly.
// Uses (?:^|[^a-z]) before "rim" to prevent matching inside "trim"
const WHEEL_RE = /(?:^|[^a-z])(?:wheel|rim)|tire|tyre|hub|brake|caliper|disc|disk|rotor|rubber|pneu|thread|sidewall/i;
// Tire-specific — used for accurate positioning (tires are centered on hub)
const TIRE_RE = /tire|tyre|rubber|pneu|thread|sidewall/i;
// Mesh-name exclusions: body parts that happen to share wheel material names
const WHEEL_EXCLUDE_RE = /steering|pedal|arch|vent|light|lamp|wiper|parking|grill|grille|trim|decal|gauge|button|spring|exhaust/i;

// Detect interior/blocker meshes that should not be paintable from exterior
const BLOCKER_RE = /blocking|blocker|occluder|int_block|seat|leather|steering|steer|carpet|dashboard|console|interior|cabin|upholster/i;

// Surface finish overlays — click-through to reach actual paint underneath
const OVERLAY_RE = /ext_gloss|ext_matte|ext_light|clear.?coat|finish_overlay|coat_shad/i;

function isWheelMesh(meshName, matName) {
  // Strong positive: mesh name has "Wheel" followed by separator (Wheel_, Wheel.)
  // but NOT "WheelArch", "WheelHouse", "WheelWell", "WheelGuard"
  if (/Wheel[_.\s-]/i.test(meshName) &&
      !/steering|arch|house|well|guard|liner|fender|cover/i.test(meshName)) return true;
  // Check exclude against both mesh and material names
  if (WHEEL_EXCLUDE_RE.test(meshName) || WHEEL_EXCLUDE_RE.test(matName)) return false;
  // Check positive match against combined name
  const combined = meshName + ' ' + matName;
  return WHEEL_RE.test(combined);
}

// Detect actual wheel positions from wheel meshes in the car model.
// Groups meshes by quadrant (FL/FR/RL/RR) relative to car center,
// averages positions within each group, and measures radius directly.
// Falls back to estimation only when wheel meshes can't be grouped.
function detectWheelPositions(wheelMeshes, carBox) {
  const carCenter = new THREE.Vector3();
  const carSize = new THREE.Vector3();
  carBox.getCenter(carCenter);
  carBox.getSize(carSize);

  if (wheelMeshes.length === 0) {
    return fallbackWheelLayout(carCenter, carSize, carBox);
  }

  // Compute bounding box per wheel mesh
  const infos = wheelMeshes.map(mesh => {
    const box = new THREE.Box3().setFromObject(mesh);
    const c = new THREE.Vector3();
    const s = new THREE.Vector3();
    box.getCenter(c);
    box.getSize(s);
    // Radius: half of the largest dimension (works for any axle orientation)
    const radius = Math.max(s.x, s.y, s.z) / 2;
    return { center: c, radius, sizeY: s.y };
  });

  // Auto-detect orientation: longest horizontal axis = front/rear (length)
  const isXLong = carSize.x > carSize.z;

  // Group by quadrant — try carCenter first, then wheelPivot if <4 groups
  function groupByPivot(pivot) {
    const g = { FL: [], FR: [], RL: [], RR: [] };
    for (const info of infos) {
      const isRight = isXLong
        ? info.center.z > pivot.z
        : info.center.x > pivot.x;
      const isFront = isXLong
        ? info.center.x > pivot.x
        : info.center.z > pivot.z;
      g[(isFront ? 'F' : 'R') + (isRight ? 'R' : 'L')].push(info);
    }
    return g;
  }

  let groups = groupByPivot(carCenter);
  const filledGroups = Object.values(groups).filter(g => g.length > 0).length;

  // If carCenter grouping gives <4, try wheel-center pivot
  if (filledGroups < 4 && infos.length >= 4) {
    const wheelPivot = new THREE.Vector3();
    infos.forEach(i => wheelPivot.add(i.center));
    wheelPivot.divideScalar(infos.length);
    const alt = groupByPivot(wheelPivot);
    const altFilled = Object.values(alt).filter(g => g.length > 0).length;
    if (altFilled > filledGroups) groups = alt;
  }

  const positions = [];
  let totalRadius = 0;
  let radiusCount = 0;

  for (const [label, group] of Object.entries(groups)) {
    if (group.length === 0) continue;
    const avg = new THREE.Vector3();
    let maxRadius = 0;
    for (const info of group) {
      avg.add(info.center);
      maxRadius = Math.max(maxRadius, info.radius);
    }
    avg.divideScalar(group.length);
    positions.push({ label, position: avg, isRight: label.endsWith('R') });
    totalRadius += maxRadius;
    radiusCount++;
  }

  if (positions.length < 2) {
    return fallbackWheelLayout(carCenter, carSize, carBox);
  }

  const avgRadius = totalRadius / radiusCount;

  // If we have 2 positions (left+right combined), mirror to get 4
  if (positions.length === 2) {
    const existing = [...positions];
    for (const p of existing) {
      const mirrorLabel = p.label[0] + (p.isRight ? 'L' : 'R');
      if (!positions.find(q => q.label === mirrorLabel)) {
        positions.push({
          label: mirrorLabel,
          position: new THREE.Vector3(
            carCenter.x * 2 - p.position.x,
            p.position.y,
            p.position.z,
          ),
          isRight: !p.isRight,
        });
      }
    }
  }

  // Fix: if left/right wheels are at the same position (combined tire meshes),
  // spread them using car width
  const widthAxis = isXLong ? 'z' : 'x';
  const widthCenter = isXLong ? carCenter.z : carCenter.x;
  const widthSize = isXLong ? carSize.z : carSize.x;
  const wValues = positions.map(p => p.position[widthAxis]);
  const wSpread = wValues.length > 1 ? Math.max(...wValues) - Math.min(...wValues) : 0;
  if (wSpread < widthSize * 0.1) {
    // Left/right not separated — apply track width from car dimensions
    const halfTrack = widthSize * 0.40;
    for (const p of positions) {
      if (p.isRight) p.position[widthAxis] = widthCenter + halfTrack;
      else p.position[widthAxis] = widthCenter - halfTrack;
    }
  }

  return { positions, wheelRadius: avgRadius };
}

function fallbackWheelLayout(carCenter, carSize, carBox) {
  const wheelRadius = carSize.y * 0.175;
  const wheelY = carBox.min.y + wheelRadius;

  // Auto-detect orientation: the car's length (front-rear) is the longest horizontal axis
  const isXLong = carSize.x > carSize.z;
  // lengthAxis = front/rear, widthAxis = left/right
  const lengthSize = isXLong ? carSize.x : carSize.z;
  const widthSize = isXLong ? carSize.z : carSize.x;
  const lengthCenter = isXLong ? carCenter.x : carCenter.z;
  const widthCenter = isXLong ? carCenter.z : carCenter.x;

  const widthOffset = widthSize * 0.40;
  const lengthFront = lengthCenter + lengthSize * 0.30;
  const lengthRear = lengthCenter - lengthSize * 0.30;

  function pos(wSide, lPos) {
    const w = widthCenter + wSide * widthOffset;
    return isXLong
      ? new THREE.Vector3(lPos, wheelY, w)
      : new THREE.Vector3(w, wheelY, lPos);
  }

  return {
    positions: [
      { label: 'FL', position: pos(-1, lengthFront), isRight: false },
      { label: 'FR', position: pos(+1, lengthFront), isRight: true },
      { label: 'RL', position: pos(-1, lengthRear), isRight: false },
      { label: 'RR', position: pos(+1, lengthRear), isRight: true },
    ],
    wheelRadius,
  };
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

// Loads a wheel GLB and renders 4 copies at detected positions.
// Normalization via JSX nested groups (no geometry modification):
//   outer group: position + scale (wheel location + size)
//     inner group: centering offset + axle rotation
//       primitive: raw GLB clone
function WheelSet({ wheelPath, positions, carScale, yOffset, wheelRadius, isXLong }) {
  const gltf = useGLTF(wheelPath);

  // Extract mesh data (geometry + material) from the wheel GLB,
  // baking all node transforms into geometry vertices.
  // This eliminates nested transforms that cause scale artifacts.
  const wheelMeshes = useMemo(() => {
    if (!gltf.scene || positions.length === 0) return null;

    // Step 1: collect all meshes with their world transforms baked into geometry
    gltf.scene.updateMatrixWorld(true);
    const bakedMeshes = [];
    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geom = child.geometry.clone();
      geom.applyMatrix4(child.matrixWorld);
      const mn = (child.material?.name || child.name || '').toLowerCase();
      const isTire = /tire|tyre|rubber|pneu|sidewall|thread/i.test(mn);
      bakedMeshes.push({ geometry: geom, isTire });
    });

    if (bakedMeshes.length === 0) return null;

    // Step 2: compute bounding box of all baked geometries
    const totalBox = new THREE.Box3();
    for (const bm of bakedMeshes) {
      bm.geometry.computeBoundingBox();
      totalBox.union(bm.geometry.boundingBox);
    }
    const wCenter = new THREE.Vector3();
    const wSize = new THREE.Vector3();
    totalBox.getCenter(wCenter);
    totalBox.getSize(wSize);

    // Step 3: center all geometries at origin
    for (const bm of bakedMeshes) {
      bm.geometry.translate(-wCenter.x, -wCenter.y, -wCenter.z);
    }

    // Step 4: detect axle and rotate to X (always X, regardless of car orientation)
    // The flip for isXLong is handled in JSX scale, not geometry rotation.
    const dims = [wSize.x, wSize.y, wSize.z];
    const minIdx = dims.indexOf(Math.min(...dims));
    const targetAxle = 0; // Always X
    if (minIdx !== targetAxle) {
      const rotMat = new THREE.Matrix4();
      if (minIdx === 0 && targetAxle === 2) rotMat.makeRotationY(Math.PI / 2);
      else if (minIdx === 1 && targetAxle === 0) rotMat.makeRotationZ(Math.PI / 2);
      else if (minIdx === 1 && targetAxle === 2) rotMat.makeRotationX(Math.PI / 2);
      else if (minIdx === 2 && targetAxle === 0) rotMat.makeRotationY(Math.PI / 2);
      for (const bm of bakedMeshes) bm.geometry.applyMatrix4(rotMat);
      // Re-measure after rotation
      totalBox.makeEmpty();
      for (const bm of bakedMeshes) {
        bm.geometry.computeBoundingBox();
        totalBox.union(bm.geometry.boundingBox);
      }
      totalBox.getSize(wSize);
    }

    // Step 5: compute normalization scale
    const maxDim = Math.max(wSize.x, wSize.y, wSize.z);
    const normScale = maxDim > 0 ? 1.0 / maxDim : 1;
    const targetDiam = wheelRadius * 2;

    // Step 6: create unified material — all wheel parts visible metallic
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x999999, roughness: 0.25, metalness: 0.85, side: THREE.DoubleSide,
    });

    return { bakedMeshes, normScale, targetDiam, wheelMat };
  }, [gltf.scene, positions, wheelRadius, isXLong]);

  if (!wheelMeshes) return null;

  const { bakedMeshes, normScale, targetDiam, wheelMat } = wheelMeshes;

  return (
    <group>
      {positions.map(({ label, position, isRight }) => {
        const s = targetDiam * carScale * normScale;
        const flip = isRight ? -1 : 1;
        const px = position.x * carScale;
        const pz = position.z * carScale;
        // Clamp Y so wheel bottom never goes below ground (Y=0)
        const renderedRadius = targetDiam * carScale / 2;
        const py = Math.max(position.y * carScale + yOffset, renderedRadius);
        // Always flip on X axis (axle is always baked to X)
        const sx = s * flip;
        const sz = s;
        return (
          <group key={label} position={[px, py, pz]} scale={[sx, s, sz]}>
            {bakedMeshes.map((bm, mi) => (
              <mesh key={mi} geometry={bm.geometry} material={wheelMat} />
            ))}
          </group>
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

    // CRITICAL: R3F's <primitive> may have already applied carScale/position.
    // Temporarily reset to identity for bounding box computation, then restore.
    const savedScale = clonedScene.scale.clone();
    const savedPosition = clonedScene.position.clone();
    clonedScene.scale.set(1, 1, 1);
    clonedScene.position.set(0, 0, 0);
    clonedScene.updateMatrixWorld(true);

    // First pass: compute overall bounding box
    const totalBox = new THREE.Box3().setFromObject(clonedScene);
    const center = new THREE.Vector3();
    totalBox.getCenter(center);
    modelCenter.current.copy(center);
    const yMid = center.y;

    // Collect wheel meshes
    const detectedWheelMeshes = [];
    const tireMeshes = []; // Tire-only meshes for accurate positioning

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
          // Also track tire-specific meshes for positioning
          const combined = meshName + ' ' + matName;
          if (TIRE_RE.test(combined)) {
            tireMeshes.push(child);
          }
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

        // Check if seat/leather/interior material needs default dark color
        const matLower = matName.toLowerCase();
        const isSeatOrInterior = /seat|leather|upholster|putih|carpet|belt/i.test(matLower) && !isWindow;
        const origColor = mat.color;
        const isWhiteish = origColor && (origColor.r + origColor.g + origColor.b) > 2.5;
        const needsSeatFix = isSeatOrInterior && isWhiteish;

        originals.current.set(child.uuid, {
          material: mat.clone(),
          matName,
          zoneKey,
          isWindow,
          isOriginallyOpaque: !mat.transparent || mat.opacity >= 0.95,
          isWheel,
          isBlocker: BLOCKER_RE.test(combinedName),
          isOverlay: OVERLAY_RE.test(matName),
          needsSeatFix,
          hasVertexColors: !!mat.vertexColors,
        });
      }
    });

    // Geometric wheel detection: for models with NO name-based wheel detection,
    // find circular meshes near the car bottom (likely wheels).
    if (detectedWheelMeshes.length === 0) {
      const carHeight = totalBox.max.y - totalBox.min.y;
      const carBottom = totalBox.min.y;
      clonedScene.traverse((child) => {
        if (!child.isMesh) return;
        const orig = originals.current.get(child.uuid);
        if (!orig || orig.isWindow) return;
        const box = new THREE.Box3().setFromObject(child);
        const s = new THREE.Vector3();
        const c = new THREE.Vector3();
        box.getSize(s);
        box.getCenter(c);
        // Circular: two largest dims similar (ratio > 0.7), third much smaller
        const sorted = [s.x, s.y, s.z].sort((a, b) => b - a);
        const isCircular = sorted[0] > 0 && sorted[1] / sorted[0] > 0.7 && sorted[2] / sorted[0] < 0.5;
        // Near bottom: center Y within lower 40% of car
        const isLow = c.y < carBottom + carHeight * 0.4;
        // Small relative to car: max dim < 40% of car height
        const isSmall = sorted[0] < carHeight * 0.4;
        if (isCircular && isLow && isSmall) {
          orig.isWheel = true;
          detectedWheelMeshes.push(child);
          const combined = (child.material?.name || '') + ' ' + (child.name || '');
          if (TIRE_RE.test(combined) || sorted[1] / sorted[0] > 0.9) {
            tireMeshes.push(child);
          }
        }
      });
    }

    wheelData.current.hasWheels = detectedWheelMeshes.length > 0;

    const carSizeVec = new THREE.Vector3();
    totalBox.getSize(carSizeVec);
    const isXLong = carSizeVec.x > carSizeVec.z;

    // Use TIRE meshes for positioning (most accurate — centered on hub)
    const positionMeshes = tireMeshes.length >= 2 ? tireMeshes : detectedWheelMeshes;
    let layout = detectWheelPositions(positionMeshes, totalBox);

    // If tire detection gave <4 groups, try ALL wheel meshes before fallback
    if (layout.positions.length < 4 && positionMeshes !== detectedWheelMeshes && detectedWheelMeshes.length >= 4) {
      layout = detectWheelPositions(detectedWheelMeshes, totalBox);
    }

    // If still <4 groups, use fallback positions.
    // hasWheels stays as-is: true = can hide originals, false = overlay only.
    const needsFallback = layout.positions.length < 4;
    if (needsFallback) {
      layout = fallbackWheelLayout(center, carSizeVec, totalBox);
    }

    // If too many meshes detected as wheels (>30% of total), detection is broken.
    // Reset to avoid hiding the entire car body.
    let totalMeshCount = 0;
    clonedScene.traverse(c => { if (c.isMesh) totalMeshCount++; });
    if (detectedWheelMeshes.length > Math.max(totalMeshCount * 0.20, 80)) {
      // Too many — clear wheel detection, rely on fallback positions only
      detectedWheelMeshes.forEach(m => {
        const orig = originals.current.get(m.uuid);
        if (orig) orig.isWheel = false;
      });
      detectedWheelMeshes.length = 0;
      tireMeshes.length = 0;
    }

    // Use the larger of (tire-detected radius, fallback radius).
    // This ensures wheels are never too small while remaining proportional.
    const fallbackRadius = carSizeVec.y * 0.275;
    const tireRadius = layout.wheelRadius;
    let finalRadius = Math.max(tireRadius, fallbackRadius);

    // Safety cap: never exceed 30% of car height
    const maxRadius = carSizeVec.y * 0.30;
    if (finalRadius > maxRadius) finalRadius = fallbackRadius;

    wheelData.current.positions = layout.positions;
    wheelData.current.radius = finalRadius;
    wheelData.current.isXLong = isXLong;

    // === VERIFICATION SYSTEM ===
    // Record ORIGINAL wheel mesh centers per quadrant for comparison
    // with custom wheel positions. Exposed via window for testing.
    const origWheelCenters = {};
    if (detectedWheelMeshes.length > 0) {
      const groups = { FL: [], FR: [], RL: [], RR: [] };
      for (const m of detectedWheelMeshes) {
        const b = new THREE.Box3().setFromObject(m);
        const c = new THREE.Vector3();
        b.getCenter(c);
        const isR = isXLong ? c.z > center.z : c.x > center.x;
        const isF = isXLong ? c.x > center.x : c.z > center.z;
        groups[(isF?'F':'R')+(isR?'R':'L')].push(c);
      }
      for (const [label, pts] of Object.entries(groups)) {
        if (pts.length === 0) continue;
        const avg = new THREE.Vector3();
        pts.forEach(p => avg.add(p));
        avg.divideScalar(pts.length);
        origWheelCenters[label] = { x: avg.x, y: avg.y, z: avg.z };
      }
    }

    // Compare: custom wheel positions vs original wheel centers
    const mn = modelPath.replace(/^.*\//, '').replace('.glb', '');
    const verification = layout.positions.map(p => {
      const orig = origWheelCenters[p.label];
      if (!orig) return p.label + ':NO_ORIG';
      const dx = p.position.x - orig.x;
      const dy = p.position.y - orig.y;
      const dz = p.position.z - orig.z;
      const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
      return p.label + ':d=' + dist.toFixed(3) +
        '(dx=' + dx.toFixed(3) + ',dy=' + dy.toFixed(3) + ',dz=' + dz.toFixed(3) + ')';
    });
    // Expose for external testing
    window.__wheelVerify = { model: mn, origCenters: origWheelCenters,
      customPositions: layout.positions.map(p => ({ label: p.label, x: p.position.x, y: p.position.y, z: p.position.z })),
      radius: finalRadius, carHeight: carSizeVec.y };

    // Restore scale/position so R3F rendering and CameraFitter work correctly
    clonedScene.scale.copy(savedScale);
    clonedScene.position.copy(savedPosition);
    clonedScene.updateMatrixWorld(true);

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
          // Realistic clear glass — slightly tinted so body color doesn't bleed through
          child.material = new THREE.MeshPhysicalMaterial({
            color: 0x101015,
            roughness: 0.0,
            metalness: 0.1,
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
            envMapIntensity: 1.0,
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
        // White seat/leather/interior → force realistic dark color
        const origMat = orig.material;
        if (origMat.map) {
          // Has texture: tint it dark by multiplying
          child.material = origMat.clone();
          child.material.color = new THREE.Color(0x2a2018);
        } else {
          // No texture: create dark leather material
          child.material = new THREE.MeshStandardMaterial({
            color: 0x1a1410,
            roughness: 0.75,
            metalness: 0.0,
          });
        }
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

    // Only show custom wheels when we CAN hide originals (wheel meshes detected).
    // Models with no detectable wheel meshes can't support wheel replacement
    // — showing custom wheels would overlap with visible originals.
    // Always show custom wheels when positions are available.
    // For models without detectable wheel meshes (hasWheels=false),
    // originals stay visible but custom wheels overlay on top.
    if (hasCustomWheels && wheelData.current.positions.length > 0) {
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
      if (orig.isWheel || orig.isBlocker || orig.isOverlay) continue;
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
            isXLong={wheelData.current.isXLong}
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
