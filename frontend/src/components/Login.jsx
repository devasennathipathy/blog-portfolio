import { useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal.jsx';

export function AccountPage({ initialMode = 'login' }) {
  const navigate = useNavigate();
  return <><div className="gate-shell"><span className="eyebrow">ACCOUNT ACCESS</span><h1>Welcome to Blog Portfolio.</h1><p>Sign in or create an account to continue.</p></div><AuthModal initialMode={initialMode} onClose={() => navigate('/', { replace: true })} /></>;
}
export default AccountPage;
