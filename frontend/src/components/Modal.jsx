import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, children, onClose, className = '' }) {
  const ref = useRef();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="modal-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}>
    <div className="modal-inner"><button className="icon-button modal-close" aria-label="Close dialog" onClick={onClose}><X size={21} /></button>
      <h2 id="modal-title">{title}</h2>{children}
    </div>
  </dialog>;
}
