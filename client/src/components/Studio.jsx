import { useState } from 'react';
import useStore from '../store';
import BrandPanel from './BrandPanel';
import CarViewer from './CarViewer';
import PartsPanel from './PartsPanel';
import Toolbar from './Toolbar';
import MobileBottomSheet from './MobileBottomSheet';
import NicknameModal from './NicknameModal';
import './Studio.css';

export default function Studio() {
  const nickname = useStore((s) => s.nickname);
  const [showNickname, setShowNickname] = useState(!nickname);

  return (
    <div className="studio">
      {showNickname && <NicknameModal onClose={() => setShowNickname(false)} />}

      <div className="studio-layout">
        <BrandPanel />
        <div className="studio-center">
          <CarViewer />
          <Toolbar />
        </div>
        <PartsPanel />
      </div>

      <MobileBottomSheet />
    </div>
  );
}
