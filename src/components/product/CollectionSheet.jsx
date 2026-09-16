import { useEffect, useRef } from 'react';
import { HiX } from 'react-icons/hi';

export default function CollectionSheet({ title, subtitle, onClose, children, footer }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    const trigger = document.activeElement;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = event => { if (event.matches) onClose(); };
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      desktop.removeEventListener('change', closeOnDesktop);
      dialog.close();
      document.body.style.overflow = previousOverflow;
      trigger?.focus({ preventScroll: true });
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 text-secondary backdrop:bg-stone-950/45 backdrop:backdrop-blur-sm">
      <section className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top,0px)-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ${footer ? 'h-[92dvh]' : ''}`}>
        <header className="shrink-0 border-b border-stone-100 px-5 pb-4 pt-3">
          <div aria-hidden="true" className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
          <div className="flex items-center justify-between gap-3">
            <div><h2 className="font-serif text-2xl text-primary">{title}</h2><p className="mt-1 text-xs text-stone-500">{subtitle}</p></div>
            <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-stone-100 text-primary focus-visible:outline-2 focus-visible:outline-[#681f3b]"><HiX size={20} /></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom,0px)]">{children}</div>
        {footer && <footer className="shrink-0 border-t border-stone-200 bg-white px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer>}
      </section>
    </dialog>
  );
}
