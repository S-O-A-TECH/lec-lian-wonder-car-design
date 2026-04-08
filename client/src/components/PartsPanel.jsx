import { useState } from 'react';
import useStore from '../store';
import { colorPresets, finishPresets } from '../data/carCatalog';
import './PartsPanel.css';

const categories = [
  { id: 'color', label: 'Color' },
  { id: 'finish', label: 'Finish' },
  { id: 'windows', label: 'Windows' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'spoiler', label: 'Spoiler' },
  { id: 'grille', label: 'Grille' },
  { id: 'headlights', label: 'Lights' },
];

export default function PartsPanel() {
  const [activeCategory, setActiveCategory] = useState('color');
  const partsConfig = useStore((s) => s.partsConfig);
  const setPart = useStore((s) => s.setPart);
  const selectedMaterial = useStore((s) => s.selectedMaterial);
  const materialColors = useStore((s) => s.materialColors);
  const setMaterialColor = useStore((s) => s.setMaterialColor);
  const setSelectedMaterial = useStore((s) => s.setSelectedMaterial);

  const currentColor = selectedMaterial
    ? (materialColors[selectedMaterial] || '#0d0d0d')
    : partsConfig.color;

  const handleColorSelect = (colorId) => {
    if (selectedMaterial) {
      setMaterialColor(selectedMaterial, colorId);
    }
  };

  const handleCustomColor = (e) => {
    handleColorSelect(e.target.value);
  };

  const handleClearSelection = () => {
    setSelectedMaterial(null);
  };

  return (
    <div className="parts-panel">
      <div className="panel-label">CUSTOMIZE</div>
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`cat-tab ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="parts-options">
        {activeCategory === 'color' && (
          <>
            <div className="selected-part-info">
              {selectedMaterial ? (
                <>
                  <div className="panel-label">SELECTED PART</div>
                  <div className="selected-part-name">
                    <span>{selectedMaterial}</span>
                    <button className="clear-btn" onClick={handleClearSelection}>X</button>
                  </div>
                  <p className="hint-text">Pick a color below to paint this part</p>
                </>
              ) : (
                <>
                  <div className="panel-label">HOW TO PAINT</div>
                  <p className="hint-text">Click on any part of the car to select it, then choose a color</p>
                </>
              )}
            </div>

            {selectedMaterial && (
              <>
                <div className="panel-label" style={{ marginTop: 8 }}>COLORS</div>
                <div className="color-grid">
                  {colorPresets.map((c) => (
                    <button
                      key={c.id}
                      className={`color-swatch ${currentColor === c.id ? 'active' : ''}`}
                      style={{ background: c.id }}
                      title={c.name}
                      onClick={() => handleColorSelect(c.id)}
                    />
                  ))}
                </div>
                <div className="panel-label" style={{ marginTop: 12 }}>CUSTOM</div>
                <input
                  type="color"
                  className="color-picker"
                  value={currentColor}
                  onChange={handleCustomColor}
                />
              </>
            )}

            {/* Show all painted parts */}
            {Object.keys(materialColors).length > 0 && (
              <>
                <div className="panel-label" style={{ marginTop: 16 }}>PAINTED PARTS</div>
                <div className="painted-list">
                  {Object.entries(materialColors).map(([matName, color]) => (
                    <button
                      key={matName}
                      className={`painted-item ${selectedMaterial === matName ? 'active' : ''}`}
                      onClick={() => setSelectedMaterial(matName)}
                    >
                      <span className="zone-color-dot" style={{ background: color }} />
                      <span className="painted-name">
                        {matName.includes('::') ? matName.replace('::', ' — ') : matName}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {activeCategory === 'finish' && (
          <>
            <div className="panel-label">SURFACE FINISH</div>
            <div className="finish-grid">
              {Object.entries(finishPresets).map(([id, preset]) => (
                <button
                  key={id}
                  className={`finish-card ${partsConfig.finish === id ? 'active' : ''}`}
                  onClick={() => setPart('finish', id)}
                >
                  <div
                    className="finish-preview"
                    style={{
                      background: `radial-gradient(circle at 35% 35%,
                        rgba(255,255,255,${0.8 - preset.roughness * 0.7}) 0%,
                        rgba(100,100,100,${0.3 + preset.metalness * 0.5}) 50%,
                        rgba(30,30,30,0.9) 100%)`,
                    }}
                  />
                  <span className="finish-name">{id.replace('-', ' ')}</span>
                  <span className="finish-desc">
                    {id === 'glossy' && 'Deep shine, clear coat'}
                    {id === 'matte' && 'Flat, no reflection'}
                    {id === 'metallic' && 'Reflective metallic shine'}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {activeCategory === 'windows' && (
          <>
            <div className="panel-label">WINDOW TINT</div>
            <div className="finish-grid">
              <button
                className={`finish-card ${partsConfig.windowTint === 'transparent' ? 'active' : ''}`}
                onClick={() => setPart('windowTint', 'transparent')}
              >
                <div className="finish-preview" style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(200,220,255,0.3) 100%)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }} />
                <div>
                  <span className="finish-name">Transparent</span>
                  <span className="finish-desc">Clear glass, see interior</span>
                </div>
              </button>
              <button
                className={`finish-card ${partsConfig.windowTint === 'tinted' ? 'active' : ''}`}
                onClick={() => setPart('windowTint', 'tinted')}
              >
                <div className="finish-preview" style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #333 50%, #111 100%)',
                  border: '1px solid #333',
                }} />
                <div>
                  <span className="finish-name">Tinted</span>
                  <span className="finish-desc">Dark mirror glass</span>
                </div>
              </button>
            </div>
          </>
        )}

        {!['color', 'finish', 'windows'].includes(activeCategory) && (
          <div className="option-grid">
            <p className="coming-soon">
              3D parts models coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
