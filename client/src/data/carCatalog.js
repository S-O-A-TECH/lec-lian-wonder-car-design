export const defaultPartsConfig = {
  wheels: 'original',
  spoiler: 'none',
  grille: 'mesh-chrome',
  headlights: 'led-slim',
  bumper: 'elegant-01',
  color: '#0d0d0d',
  finish: 'glossy',
  windowTint: 'transparent',
};

export const finishPresets = {
  glossy: {
    roughness: 0.05,
    metalness: 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: 0.03,
    reflectivity: 0.5,
    envMapIntensity: 2.0,
  },
  matte: {
    roughness: 1.0,
    metalness: 0.0,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    reflectivity: 0.0,
    envMapIntensity: 0.1,
  },
  metallic: {
    roughness: 0.05,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.02,
    reflectivity: 1.0,
    envMapIntensity: 3.0,
  },
};

// All wheel GLBs are pre-standardized via Blender: axle=X, center=origin, diameter=1.0
export const wheelPresets = [
  { id: 'original', name: 'Original', path: null, desc: 'Factory wheels' },
  { id: 'sport-22', name: 'Sport 22"', path: '/models/wheels/sport-22.glb', desc: 'Aggressive sport design' },
  { id: 'classic-20', name: 'Classic 20"', path: '/models/wheels/classic-20.glb', desc: 'Elegant classic spokes' },
  { id: 'turbine-21', name: 'Turbine 21"', path: '/models/wheels/turbine-21.glb', desc: 'Aerodynamic turbine style' },
  { id: 'multi-spoke', name: 'Multi-Spoke', path: '/models/wheels/multi-spoke.glb', desc: 'Premium multi-spoke' },
];

export const colorPresets = [
  // Whites
  { id: '#f2f2f2', name: 'Pearl White' },
  { id: '#e8e4df', name: 'Arctic White' },
  // Blacks
  { id: '#0d0d0d', name: 'Jet Black' },
  { id: '#1c1c1e', name: 'Obsidian Black' },
  // Greys & Silver
  { id: '#7a7d80', name: 'Silver Metallic' },
  { id: '#4e5154', name: 'Gunmetal Grey' },
  { id: '#8e9196', name: 'Nardo Grey' },
  // Blues
  { id: '#1b3a5c', name: 'Deep Navy' },
  { id: '#2c5f8a', name: 'Estoril Blue' },
  // Reds
  { id: '#8c1a1a', name: 'Racing Red' },
  { id: '#5a1020', name: 'Burgundy Wine' },
  // Green
  { id: '#274028', name: 'British Racing Green' },
  // Special / Luxury
  { id: '#b8860b', name: 'Champagne Gold' },
  { id: '#ff6b00', name: 'Lambo Orange' },
  { id: '#3d2b1f', name: 'Espresso Brown' },
];
