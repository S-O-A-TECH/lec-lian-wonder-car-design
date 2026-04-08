import { useState } from 'react';
import useStore from '../store';
import './NicknameModal.css';

export default function NicknameModal({ onClose }) {
  const [name, setName] = useState('');
  const setNickname = useStore((s) => s.setNickname);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 20) return;
    setNickname(trimmed);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <form className="modal-box" onSubmit={handleSubmit}>
        <h2>Welcome to Wonder Car</h2>
        <p>닉네임을 입력하세요</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="닉네임 (1~20자)"
          maxLength={20}
          autoFocus
        />
        <button type="submit" disabled={name.trim().length < 1}>
          시작하기
        </button>
      </form>
    </div>
  );
}
