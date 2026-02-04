import { useAuth } from '@mysys/game-sdk-client';
import { LoginButton } from '@mysys/game-sdk-client/components';

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="home">
      <h1>Champion Forge</h1>

      {!isAuthenticated ? (
        <div className="login-buttons">
          <LoginButton provider="google" />
          <LoginButton provider="discord" />
        </div>
      ) : (
        <div className="user-info">
          <p>Olá, {user?.nickname}!</p>
          <a href="/game">Jogar</a>
        </div>
      )}
    </div>
  );
}
