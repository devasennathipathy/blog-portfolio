import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const notify = useCallback((message, kind = 'success') => {
    clearTimeout(timer.current);
    setToast({ message, kind });
    timer.current = setTimeout(() => setToast(null), 5500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return <ToastContext.Provider value={notify}>{children}
    {toast && <div className={`toast ${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      {toast.kind === 'error' ? <AlertCircle size={19} /> : <CheckCircle2 size={19} />}<span>{toast.message}</span>
      <button aria-label="Dismiss notification" onClick={() => setToast(null)}><X size={16} /></button>
    </div>}
  </ToastContext.Provider>;
}
export const useToast = () => useContext(ToastContext);
