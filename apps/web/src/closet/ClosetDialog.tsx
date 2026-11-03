import { useEffect, useRef, type ReactNode } from 'react';
import Icon from '../Icon';
export default function ClosetDialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const el = ref.current; const origin = document.activeElement as HTMLElement | null; el?.showModal(); return () => { el?.close(); origin?.focus(); }; }, []);
  return <dialog ref={ref} className="closet-dialog" aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="closet-dialog-heading"><h2>{title}</h2><button className="closet-round" aria-label="閉じる" onClick={onClose}><Icon name="close" /></button></div>
    {children}
  </dialog>;
}
