import { useState } from 'react';
import BrandPanel from './BrandPanel';
import PartsPanel from './PartsPanel';
import './MobileBottomSheet.css';

export default function MobileBottomSheet() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('parts');

  return (
    <div className="mobile-sheet-container">
      <button className="sheet-handle" onClick={() => setOpen(!open)}>
        <div className="handle-bar" />
        <span>{open ? 'Close' : 'Customize'}</span>
      </button>

      {open && (
        <div className="sheet-content">
          <div className="sheet-tabs">
            <button
              className={`sheet-tab ${tab === 'brand' ? 'active' : ''}`}
              onClick={() => setTab('brand')}
            >
              Brand
            </button>
            <button
              className={`sheet-tab ${tab === 'parts' ? 'active' : ''}`}
              onClick={() => setTab('parts')}
            >
              Parts
            </button>
          </div>
          {tab === 'brand' ? <BrandPanel /> : <PartsPanel />}
        </div>
      )}
    </div>
  );
}
