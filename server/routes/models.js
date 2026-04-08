import { Router } from 'express';

const router = Router();

const catalog = [
  {
    brand: 'Lamborghini',
    models: [
      { id: 'lamborghini-aventador', name: 'Aventador', type: 'Sports' },
      { id: 'lamborghini-urus', name: 'Urus', type: 'SUV' },
      { id: 'lamborghini-huracan', name: 'Huracán', type: 'Sports' },
    ],
  },
  {
    brand: 'Mercedes-Benz',
    models: [
      { id: 'mercedes-s-class', name: 'S-Class', type: 'Sedan' },
      { id: 'mercedes-amg-gt', name: 'AMG GT', type: 'Sports' },
      { id: 'mercedes-g-wagon', name: 'G-Wagon', type: 'SUV' },
    ],
  },
  {
    brand: 'Mercedes-Maybach',
    models: [
      { id: 'maybach-s680', name: 'S 680', type: 'Sedan' },
      { id: 'maybach-gls600', name: 'GLS 600', type: 'SUV' },
    ],
  },
  {
    brand: 'Bugatti',
    models: [
      { id: 'bugatti-chiron', name: 'Chiron', type: 'Sports' },
      { id: 'bugatti-veyron', name: 'Veyron', type: 'Sports' },
    ],
  },
  {
    brand: 'Rolls-Royce',
    models: [
      { id: 'rolls-royce-phantom', name: 'Phantom', type: 'Sedan' },
      { id: 'rolls-royce-cullinan', name: 'Cullinan', type: 'SUV' },
    ],
  },
  {
    brand: 'Jaguar',
    models: [
      { id: 'jaguar-f-type', name: 'F-Type', type: 'Sports' },
      { id: 'jaguar-xj', name: 'XJ', type: 'Sedan' },
    ],
  },
  {
    brand: 'Ferrari',
    models: [
      { id: 'ferrari-488', name: '488', type: 'Sports' },
      { id: 'ferrari-sf90', name: 'SF90', type: 'Sports' },
      { id: 'ferrari-laferrari', name: 'LaFerrari', type: 'Sports' },
    ],
  },
  {
    brand: 'Porsche',
    models: [
      { id: 'porsche-911', name: '911', type: 'Sports' },
      { id: 'porsche-taycan', name: 'Taycan', type: 'Sedan' },
      { id: 'porsche-cayenne', name: 'Cayenne', type: 'SUV' },
    ],
  },
  {
    brand: 'McLaren',
    models: [
      { id: 'mclaren-720s', name: '720S', type: 'Sports' },
      { id: 'mclaren-p1', name: 'P1', type: 'Sports' },
    ],
  },
  {
    brand: 'BMW',
    models: [
      { id: 'bmw-m8', name: 'M8', type: 'Sports' },
      { id: 'bmw-x7', name: 'X7', type: 'SUV' },
      { id: 'bmw-i7', name: 'i7', type: 'Sedan' },
    ],
  },
  {
    brand: 'Land Rover',
    models: [
      { id: 'land-rover-range-rover', name: 'Range Rover', type: 'SUV' },
      { id: 'land-rover-defender', name: 'Defender', type: 'SUV' },
    ],
  },
  {
    brand: 'Aston Martin',
    models: [
      { id: 'aston-martin-db11', name: 'DB11', type: 'Sports' },
      { id: 'aston-martin-vantage', name: 'Vantage', type: 'Sports' },
    ],
  },
  {
    brand: 'Tesla',
    models: [
      { id: 'tesla-cybertruck', name: 'Cybertruck', type: 'Truck' },
      { id: 'tesla-model-s', name: 'Model S', type: 'Sedan' },
      { id: 'tesla-roadster', name: 'Roadster', type: 'Sports' },
    ],
  },
];

// GET /api/models
router.get('/', (req, res) => {
  res.json(catalog);
});

const partsMap = {
  wheels: [
    { id: 'sport-22', name: 'Sport 22"', description: 'Aggressive multi-spoke design' },
    { id: 'classic-20', name: 'Classic 20"', description: 'Timeless 5-spoke design' },
    { id: 'turbine-21', name: 'Turbine 21"', description: 'Aerodynamic turbine design' },
    { id: 'multi-spoke', name: 'Multi-spoke', description: 'Elegant multi-spoke pattern' },
    { id: 'forged-19', name: 'Forged 19"', description: 'Lightweight forged alloy' },
  ],
  spoiler: [
    { id: 'gt-wing', name: 'GT Wing', description: 'High-rise racing wing' },
    { id: 'lip-spoiler', name: 'Lip Spoiler', description: 'Subtle lip design' },
    { id: 'duck-tail', name: 'Duck Tail', description: 'Classic duck tail shape' },
    { id: 'none', name: 'None', description: 'No spoiler' },
  ],
  grille: [
    { id: 'mesh-chrome', name: 'Mesh Chrome', description: 'Chrome mesh pattern' },
    { id: 'horizontal-bar', name: 'Horizontal Bar', description: 'Classic bar design' },
    { id: 'honeycomb', name: 'Honeycomb', description: 'Sporty honeycomb pattern' },
    { id: 'vertical-slat', name: 'Vertical Slat', description: 'Modern vertical slats' },
  ],
  headlights: [
    { id: 'led-slim', name: 'LED Slim', description: 'Slim LED strip design' },
    { id: 'round-classic', name: 'Round Classic', description: 'Classic round headlights' },
    { id: 'aggressive', name: 'Aggressive', description: 'Sharp angular design' },
    { id: 'matrix-led', name: 'Matrix LED', description: 'Advanced matrix LED' },
  ],
  bumper: [
    { id: 'aggressive-01', name: 'Aggressive', description: 'Wide air intakes, sporty' },
    { id: 'elegant-01', name: 'Elegant', description: 'Clean, refined lines' },
    { id: 'sport-01', name: 'Sport', description: 'Balanced sporty design' },
  ],
  color: [
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
  ],
  finish: [
    { id: 'glossy', name: 'Glossy', roughness: 0.1, metalness: 0.3 },
    { id: 'matte', name: 'Matte', roughness: 0.8, metalness: 0.2 },
    { id: 'metallic', name: 'Metallic', roughness: 0.2, metalness: 0.8 },
    { id: 'carbon-fiber', name: 'Carbon Fiber', roughness: 0.4, metalness: 0.6 },
  ],
};

// GET /api/models/parts/:category
router.get('/parts/:category', (req, res) => {
  const parts = partsMap[req.params.category];
  if (!parts) return res.status(404).json({ error: 'Unknown category' });
  res.json(parts);
});

export default router;
