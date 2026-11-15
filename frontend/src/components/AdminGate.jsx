import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

export default function AdminGate({ children, openAuth }) {
  const { user, admin, loading, configured } = useAuth();
  if (loading) return <div className="page-shell"><div className="skeleton admin-skeleton" role="status" aria-label="Checking your access" /></div>;
  if (!user || !admin) return <div className="gate-shell"><div className="gate-icon">{user ? <ShieldCheck size={30} strokeWidth={1.3} /> : <LockKeyhole size={30} strokeWidth={1.3} />}</div><span className="eyebrow">ADMINISTRATOR ACCESS</span><h1>{user ? 'Admin access required' : 'Admin sign in'}</h1><p>{user ? 'You’re signed in as a reader. Only an authorized administrator can manage blog content.' : configured ? 'Sign in with your admin account to create, edit, and publish blog posts.' : 'Admin access will be available once Firebase and MongoDB are connected. You can browse the public portfolio.'}</p>{!user && <button className="button dark" onClick={openAuth}>Admin sign in <ArrowUpRight size={17} /></button>}<Link className="back-link" to="/"><ArrowLeft size={15} /> Back to blog</Link></div>;
  return children;
}
