import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
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
      <h1 style={{ fontSize: 48, color: 'var(--accent)', letterSpacing: 4 }}>
        WONDER CAR
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
        Coming Soon — Landing Page
      </p>
      <button
        onClick={() => navigate('/studio')}
        style={{
          marginTop: 24,
          padding: '12px 32px',
          background: 'var(--accent)',
          color: '#000',
          fontSize: 16,
          fontWeight: 600,
          borderRadius: 8,
        }}
      >
        Go to Studio
      </button>
    </div>
  );
}
