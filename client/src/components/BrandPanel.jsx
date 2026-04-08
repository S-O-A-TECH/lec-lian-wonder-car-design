import { useEffect, useState } from 'react';
import useStore from '../store';
import { fetchModels } from '../api';
import './BrandPanel.css';

export default function BrandPanel() {
  const [catalog, setCatalog] = useState([]);
  const selectedBrand = useStore((s) => s.selectedBrand);
  const selectedModel = useStore((s) => s.selectedModel);
  const selectBrand = useStore((s) => s.selectBrand);
  const selectModel = useStore((s) => s.selectModel);

  useEffect(() => {
    fetchModels().then(setCatalog);
  }, []);

  const brandData = catalog.find((b) => b.brand === selectedBrand);

  return (
    <div className="brand-panel">
      <div className="panel-section">
        <div className="panel-label">BRAND</div>
        <div className="brand-list">
          {catalog.map((b) => (
            <button
              key={b.brand}
              className={`brand-item ${selectedBrand === b.brand ? 'active' : ''}`}
              onClick={() => selectBrand(b.brand)}
            >
              {b.brand}
            </button>
          ))}
        </div>
      </div>

      {brandData && (
        <div className="panel-section">
          <div className="panel-label">BASE MODEL</div>
          <div className="model-list">
            {brandData.models.map((m) => (
              <button
                key={m.id}
                className={`model-item ${selectedModel?.id === m.id ? 'active' : ''}`}
                onClick={() => selectModel(m)}
              >
                <span className="model-name">{m.name}</span>
                <span className="model-type">{m.type}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
