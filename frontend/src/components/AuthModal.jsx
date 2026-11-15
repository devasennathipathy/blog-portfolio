import { useState } from 'react';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ArrowUpRight, Eye, EyeOff, LockKeyhole } from 'lucide-react';
import { auth } from '../lib/firebase.js';
import { useToast } from '../lib/toast.jsx';
import Modal from './Modal.jsx';

const messages = {
  'auth/invalid-credential': 'The email or password is incorrect. Please try again.',
  'auth/wrong-password': 'The email or password is incorrect. Please try again.',
  'auth/user-not-found': 'The email or password is incorrect. Please try again.',
  'auth/email-already-in-use': 'An account already exists with this email. Try signing in.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Please use a stronger password with at least 8 characters.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment before trying again.',
  'auth/network-request-failed': 'Could not connect to Firebase. Please check your connection.',
  'auth/operation-not-allowed': 'Email/password sign-in must be enabled in the Firebase Console.',
  'auth/user-disabled': 'This account has been disabled. Please contact the administrator.',
};

export default function AuthModal({ onClose, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const notify = useToast();
  const changeMode = value => { setMode(value); setError(''); };
  const submit = async event => {
    event.preventDefault();
    if (!auth) return;
    setError('');
    const data = new FormData(event.currentTarget);
    const email = data.get('email').trim();
    const password = data.get('password');
    if (mode === 'signup' && password !== data.get('confirmPassword')) return setError('Your passwords do not match.');
    setBusy(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        notify('If an account exists for that email, you’ll receive a password reset link.');
      } else if (mode === 'signup') {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: data.get('name').trim() });
        await user.getIdToken(true);
        notify('Account created successfully.');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        notify('Welcome back. You’re signed in.');
      }
      onClose();
    } catch (err) { setError(messages[err.code] || 'We couldn’t complete that request. Please check your Firebase setup and try again.'); }
    finally { setBusy(false); }
  };
  return <Modal title={mode === 'signup' ? 'Create an account' : mode === 'reset' ? 'Reset your password' : 'Sign in'} onClose={() => { if (!busy) onClose(); }}>
    <p className="muted">{mode === 'signup' ? 'Enter your details to create an account.' : mode === 'reset' ? 'Enter your email and we’ll send you a reset link.' : 'Enter your email address and password.'}</p>
    {!auth ? <div className="notice"><LockKeyhole size={21} /><div><strong>Account setup is still in progress</strong><p>Sign-in will be available once the site’s Firebase configuration is connected. You can explore all the sample articles in the meantime.</p></div></div> : <>
      {mode !== 'reset' && <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => changeMode('signup')}>Create account</button></div>}
      <form onSubmit={submit} className="form-stack">
        {mode === 'signup' && <label>Your name<input name="name" autoComplete="name" required minLength={2} maxLength={60} placeholder="Your full name" /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com" /></label>
        {mode !== 'reset' && <label>Password<div className="password-field"><input name="password" type={visible ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required minLength={mode === 'signup' ? 8 : 1} maxLength={128} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>}
        {mode === 'signup' && <label>Confirm password<input name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={128} placeholder="One more time" /></label>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button dark full" disabled={busy} type="submit">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}{!busy && <ArrowUpRight size={17} />}</button>
      </form>
      <button className="text-button auth-switch" disabled={busy} onClick={() => changeMode(mode === 'reset' ? 'login' : 'reset')}>{mode === 'reset' ? 'Back to sign in' : 'Forgot your password?'}</button>
      <p className="auth-footnote"><LockKeyhole size={12} /> Your account is secured with Firebase.</p>
    </>}
  </Modal>;
}
