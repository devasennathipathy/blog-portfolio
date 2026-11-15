import { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, signOut } from 'firebase/auth';
import { auth } from './firebase.js';
import { api } from './api.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, admin: false, loading: Boolean(auth) });
  useEffect(() => {
    if (!auth) return;
    let active = true;
    let revision = 0;
    const unsubscribe = onIdTokenChanged(auth, async user => {
      const current = ++revision;
      try {
        const token = user ? await user.getIdTokenResult() : null;
        if (!active || current !== revision) return;
        setState({ user, admin: token?.claims.admin === true, loading: false });
        if (user) api('/me', { authenticated: true }).catch(() => {});
      } catch {
        if (active && current === revision) setState({ user: null, admin: false, loading: false });
      }
    });
    return () => { active = false; unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ ...state, configured: Boolean(auth), logout: () => signOut(auth) }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
