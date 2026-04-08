import { useNavigate } from 'react-router-dom';

export default function Studio() {
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
      <h1 style={{ color: 'var(--accent)' }}>Design Studio</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Coming Soon</p>
      <button
        onClick={() => navigate('/')}
        style={{
          marginTop: 24,
          padding: '8px 24px',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
