import { useNavigate } from 'react-router-dom';

export default function DesignDetail() {
  const navigate = useNavigate();

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
    }}>
      <h1 style={{ color: 'var(--accent)' }}>Design Detail</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Coming Soon</p>
      <button
        onClick={() => navigate('/gallery')}
        style={{
          marginTop: 24,
          padding: '8px 24px',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}
      >
        Back to Gallery
      </button>
    </div>
  );
}
