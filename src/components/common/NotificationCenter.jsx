import React, { useEffect, useState } from 'react';
import { HiBell, HiCheckCircle, HiOutlineBell, HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { enablePushNotifications, isStandalonePwa, trackPwaInstallation } from '../../pwa';

const STORAGE_KEY = 'kamlesh_notifications';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(() => isStandalonePwa() && globalThis.Notification?.permission === 'default');
  const [permission, setPermission] = useState(() => globalThis.Notification?.permission || 'unsupported');
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    trackPwaInstallation(isStandalonePwa());
    if (import.meta.env.PROD && globalThis.Notification?.permission === 'granted') {
      enablePushNotifications().catch(() => {});
    }
  }, [user?.id]);

  useEffect(() => {
    const showOptIn = () => setOpen(true);
    window.addEventListener('kamlesh:pwa-installed', showOptIn);
    return () => window.removeEventListener('kamlesh:pwa-installed', showOptIn);
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    const onMessage = event => {
      if (event.data?.type !== 'KAMLESH_NOTIFICATION') return;
      const item = { ...event.data.notification, receivedAt: new Date().toISOString() };
      setNotifications(current => {
        const next = [item, ...current].slice(0, 25);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  const enable = async () => {
    try {
      setBusy(true);
      await enablePushNotifications();
      setPermission('granted');
      setMessage('Notifications enabled');
    } catch (error) {
      setPermission(globalThis.Notification?.permission || 'unsupported');
      setMessage(error.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed bottom-24 right-4 z-[80] md:bottom-8 md:right-8">
      {open && (
        <section className="absolute bottom-16 right-0 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gradient-to-r from-[#3B1F12] to-[#6B3A21] px-5 py-4 text-white">
            <div><p className="font-serif text-lg font-bold">Kamlesh Updates</p><p className="text-[10px] text-amber-100/75">Orders, arrivals and special offers</p></div>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close notifications"><HiX /></button>
          </header>
          {permission !== 'granted' && (
            <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex gap-3"><HiOutlineBell className="mt-0.5 shrink-0 text-xl text-amber-700" /><div><p className="text-sm font-black text-stone-800">Never miss an order update</p><p className="mt-1 text-xs leading-relaxed text-stone-600">Enable notifications for order progress and new Kamlesh Suits collections.</p></div></div>
              <button onClick={enable} disabled={busy || permission === 'denied'} className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-wide text-white disabled:opacity-50">{busy ? 'Enabling…' : permission === 'denied' ? 'Permission blocked in browser' : 'Enable notifications'}</button>
              {message && <p className="mt-2 text-[10px] font-bold text-stone-600" role="status">{message}</p>}
            </div>
          )}
          {permission === 'granted' && <div className="flex items-center gap-2 border-b border-stone-100 px-5 py-3 text-xs font-bold text-emerald-700"><HiCheckCircle /> Notifications are active</div>}
          <div className="max-h-80 overflow-y-auto p-3">
            {notifications.length ? notifications.map((item, index) => (
              <button key={`${item.receivedAt}-${index}`} onClick={() => { if (item.data?.url) window.location.assign(item.data.url); }} className="mb-2 w-full rounded-2xl border border-stone-100 p-3 text-left transition hover:bg-amber-50">
                <p className="text-sm font-black text-primary">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-stone-600">{item.body}</p><p className="mt-2 text-[9px] uppercase tracking-wide text-stone-400">{new Date(item.receivedAt).toLocaleString()}</p>
              </button>
            )) : <div className="px-4 py-10 text-center"><HiBell className="mx-auto text-3xl text-amber-300" /><p className="mt-2 text-sm font-bold text-stone-500">Your updates will appear here.</p></div>}
          </div>
        </section>
      )}
      <button onClick={() => setOpen(current => !current)} className="relative grid h-14 w-14 place-items-center rounded-full bg-primary text-xl text-white shadow-2xl ring-4 ring-white/80 transition hover:scale-105" aria-label="Open Kamlesh Suits notifications"><HiBell />{permission !== 'granted' && <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-amber-400" />}</button>
    </div>
  );
};

export default NotificationCenter;
