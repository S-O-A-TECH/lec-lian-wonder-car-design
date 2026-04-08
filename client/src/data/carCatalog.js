export const defaultPartsConfig = {
  wheels: 'sport-22',
  spoiler: 'none',
  grille: 'mesh-chrome',
  headlights: 'led-slim',
  bumper: 'elegant-01',
  color: '#0a0a0a',
  finish: 'glossy',
};

export const finishPresets = {
  glossy: { roughness: 0.1, metalness: 0.3 },
  matte: { roughness: 0.8, metalness: 0.2 },
  metallic: { roughness: 0.2, metalness: 0.8 },
  'carbon-fiber': { roughness: 0.4, metalness: 0.6 },
};

export const colorPresets = [
  { id: '#0a0a0a', name: 'Obsidian Black' },
  { id: '#1a1a2e', name: 'Midnight Blue' },
  { id: '#8b0000', name: 'Racing Red' },
  { id: '#f5f5f5', name: 'Pearl White' },
  { id: '#c9a84c', name: 'Champagne Gold' },
  { id: '#2d5a27', name: 'British Racing Green' },
  { id: '#4a4a4a', name: 'Gunmetal Grey' },
  { id: '#ff6b00', name: 'Lambo Orange' },
  { id: '#1e3a5f', name: 'Monaco Blue' },
  { id: '#800020', name: 'Burgundy' },
];
