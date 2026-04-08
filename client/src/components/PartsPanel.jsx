import { useState } from 'react';
import useStore from '../store';
import { colorPresets, finishPresets } from '../data/carCatalog';
import './PartsPanel.css';

const categories = [
  { id: 'color', label: 'Color' },
  { id: 'finish', label: 'Finish' },
  { id: 'wheels', label: 'Wheels' },
  { id: 'spoiler', label: 'Spoiler' },
  { id: 'grille', label: 'Grille' },
  { id: 'headlights', label: 'Lights' },
  { id: 'bumper', label: 'Bumper' },
];

export default function PartsPanel() {
  const [activeCategory, setActiveCategory] = useState('color');
  const partsConfig = useStore((s) => s.partsConfig);
  const setPart = useStore((s) => s.setPart);

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
            <div className="panel-label">PRESET COLORS</div>
            <div className="color-grid">
              {colorPresets.map((c) => (
                <button
                  key={c.id}
                  className={`color-swatch ${partsConfig.color === c.id ? 'active' : ''}`}
                  style={{ background: c.id }}
                  title={c.name}
                  onClick={() => setPart('color', c.id)}
                />
              ))}
            </div>
            <div className="panel-label" style={{ marginTop: 12 }}>CUSTOM COLOR</div>
            <input
              type="color"
              className="color-picker"
              value={partsConfig.color}
              onChange={(e) => setPart('color', e.target.value)}
            />
          </>
        )}

        {activeCategory === 'finish' && (
          <div className="option-grid">
            {Object.keys(finishPresets).map((f) => (
              <button
                key={f}
                className={`option-card ${partsConfig.finish === f ? 'active' : ''}`}
                onClick={() => setPart('finish', f)}
              >
                <span className="option-name">{f.replace('-', ' ')}</span>
              </button>
            ))}
          </div>
        )}

        {!['color', 'finish'].includes(activeCategory) && (
          <div className="option-grid">
            <p className="coming-soon">
              3D 파츠 모델을 추가하면 여기에 옵션이 표시됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
