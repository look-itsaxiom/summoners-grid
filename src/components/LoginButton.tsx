import { useAuth } from '../hooks/useAuth';
import './LoginButton.css';

export function LoginButton() {
  const { isLoggedIn, isLoading, address, email, login, logout } = useAuth();

  if (isLoading) {
    return <div className="login-btn loading">Connecting...</div>;
  }

  if (isLoggedIn) {
    return (
      <div className="login-info">
        <div className="wallet-info">
          <span className="wallet-icon">&#x1f4b3;</span>
          <span className="wallet-address">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
          {email && <span className="wallet-email">{email}</span>}
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </div>
    );
  }

  return (
    <button className="login-btn" onClick={login}>
      Connect Wallet
    </button>
  );
}
