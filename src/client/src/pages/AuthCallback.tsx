import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'champion_forge_auth_token';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Check for token directly (simple redirect)
      const token = searchParams.get('token');
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
        navigate('/lobby', { replace: true });
        return;
      }

      // Check for OAuth code (authorization code flow)
      const code = searchParams.get('code');
      if (code) {
        try {
          const response = await fetch(`${API_URL}/api/oauth/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              code,
              redirect_uri: `${window.location.origin}/auth/callback`,
            }),
          });

          const data = await response.json();

          if (response.ok && data.token) {
            localStorage.setItem(TOKEN_KEY, data.token);
            navigate('/lobby', { replace: true });
            return;
          } else {
            setError(data.error_description || data.error || 'Erro ao autenticar');
          }
        } catch (err) {
          console.error('[Auth] Callback error:', err);
          setError('Erro de conexão');
        }
        return;
      }

      // Check for error
      const errorParam = searchParams.get('error');
      if (errorParam) {
        setError(searchParams.get('error_description') || errorParam);
        return;
      }

      // No token or code, redirect to home
      navigate('/', { replace: true });
    };

    handleCallback();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        color: '#fff',
        padding: '20px',
      }}>
        <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>Erro na Autenticação</h1>
        <p style={{ marginBottom: '20px' }}>{error}</p>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'linear-gradient(135deg, #e67e22, #d35400)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      color: '#fff',
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid #333',
        borderTop: '4px solid #e67e22',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <p style={{ marginTop: '20px' }}>Autenticando...</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
