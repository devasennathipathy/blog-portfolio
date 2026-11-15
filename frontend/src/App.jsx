import { lazy, Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { ArrowUpRight, BookOpen, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from './lib/auth.jsx';
import { useToast } from './lib/toast.jsx';
import AuthModal from './components/AuthModal.jsx';
import Journal from './components/Blogs.jsx';
import Home from './components/Home.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import { About, Work, NotFound } from './pages/Portfolio.jsx';
import { profile } from './config/profile.js';
const Article = lazy(() => import('./pages/Article.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const Editor = lazy(() => import('./pages/Editor.jsx'));

export default function App() {
  const [authModal, setAuthModal] = useState(false);
  const [menu, setMenu] = useState(false);
  const { user, admin, logout, loading } = useAuth();
  const notify = useToast();
  const location = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [location.pathname]);
  useEffect(() => {
    const section = location.pathname === '/about' ? 'About' : ['/work', '/home'].includes(location.pathname) ? 'Projects' : location.pathname.startsWith('/admin') ? 'Admin' : 'Blog';
    document.title = `${profile.name} | ${section} — ${profile.role}`;
  }, [location.pathname]);
  const openAuth = () => { setMenu(false); setAuthModal(true); };
  const doLogout = async () => {
    try { await logout(); notify('You’re signed out. See you soon.'); }
    catch { notify('Unable to sign out. Please try again.', 'error'); }
  };
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header"><div className="header-inner">
      <Link to="/" className="brand" aria-label="DK Portfolio home"><span className="brand-icon">D<span>.</span></span>Portfolio<span className="brand-dot">.</span></Link>
      <nav className="desktop-nav" aria-label="Main navigation"><NavLink end to="/">Blog</NavLink><NavLink to="/work">Projects</NavLink><NavLink to="/about">About</NavLink></nav>
      <div className="header-actions"><span className="availability"><i /> Open to opportunities</span>
        {!loading && (user ? <><span className="user-name" title={user.email}>{user.displayName?.split(' ')[0] || 'Reader'}</span>{admin && <Link className="icon-button" to="/admin" aria-label="Admin panel"><LayoutDashboard size={19} /></Link>}<button className="icon-button logout-button" onClick={doLogout} aria-label="Sign out"><LogOut size={18} /></button></> : <button className="button header-signin" onClick={openAuth}>Sign in <ArrowUpRight size={15} /></button>)}
        <button className="icon-button menu-toggle" aria-label={menu ? 'Close navigation' : 'Open navigation'} aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X size={22} /> : <Menu size={22} />}</button>
      </div>
    </div>{menu && <nav className="mobile-nav" aria-label="Mobile navigation"><NavLink end to="/">Blog</NavLink><NavLink to="/work">Projects</NavLink><NavLink to="/about">About</NavLink><Link to="/admin">Admin panel</Link></nav>}</header>
    {import.meta.env.DEV && import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL && <div className="local-mode-banner"><span /> Local demo <span>·</span> Your changes stay on this device.</div>}
    <main id="main-content"><Suspense fallback={<div className="page-shell"><div className="skeleton admin-skeleton" role="status" aria-label="Loading page" /></div>}><Routes>
      <Route path="/" element={<Journal />} />
      <Route path="/blogs" element={<Journal />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/blog/:slug" element={<Article />} />
      <Route path="/work" element={<Work />} />
      <Route path="/about" element={<About />} />
      <Route path="/admin" element={<Admin openAuth={openAuth} />} />
      <Route path="/admin/new" element={<Editor openAuth={openAuth} />} />
      <Route path="/admin/edit/:id" element={<Editor openAuth={openAuth} />} />
      <Route path="*" element={<NotFound />} />
    </Routes></Suspense></main>
    <footer className="site-footer"><div className="footer-inner"><div><Link className="footer-brand" to="/about"><BookOpen size={17} /> {profile.name} · {profile.role}</Link><p>Building for the web from {profile.location}.</p></div><div className="footer-right"><span>© {new Date().getFullYear()} {profile.name}</span><Link to="/admin">Admin access <ArrowUpRight size={13} /></Link><a href="#main-content">Back to top ↑</a></div></div></footer>
    {authModal && <AuthModal onClose={() => setAuthModal(false)} />}
  </>;
}
