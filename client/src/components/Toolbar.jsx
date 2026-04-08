import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../store';
import useScreenshot from '../hooks/useScreenshot';
import { saveDesign } from '../api';
import './Toolbar.css';

export default function Toolbar() {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { capture, download } = useScreenshot();
  const nickname = useStore((s) => s.nickname);
  const selectedModel = useStore((s) => s.selectedModel);
  const selectedBrand = useStore((s) => s.selectedBrand);
  const partsConfig = useStore((s) => s.partsConfig);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());

  const handleSave = () => download();

  const handleShare = async () => {
    if (!selectedModel || !nickname) return;
    setSaving(true);
    try {
      const thumbnailPath = await capture();
      if (!thumbnailPath) return;
      const title = `${selectedBrand} ${selectedModel.name} by ${nickname}`;
      const result = await saveDesign({
        nickname,
        title,
        brand: selectedBrand,
        base_model: selectedModel.id,
        parts_config: partsConfig,
        thumbnail: thumbnailPath,
      });
      navigate(`/design/${result.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="toolbar">
      <div className="toolbar-group">
        <button className="tool-btn" onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button className="tool-btn" onClick={redo} disabled={!canRedo}>
          Redo
        </button>
      </div>
      <div className="toolbar-group">
        <button className="tool-btn accent" onClick={handleSave}>
          Save Image
        </button>
        <button
          className="tool-btn outline"
          onClick={handleShare}
          disabled={saving || !selectedModel}
        >
          {saving ? 'Sharing...' : 'Share to Gallery'}
        </button>
      </div>
      <div className="toolbar-group">
        <button className="tool-btn" onClick={() => navigate('/gallery')}>
          Gallery
        </button>
      </div>
    </div>
  );
}
