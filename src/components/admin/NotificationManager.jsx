import React, { useCallback, useEffect, useState } from 'react';
import { HiBell, HiDeviceMobile, HiRefresh, HiSpeakerphone } from 'react-icons/hi';
import { fetchAdminNotifications, fetchPwaInstalls, sendAdminNotification } from '../../api/notifications';

const NotificationManager = ({ showToast }) => {
  const [installs, setInstalls] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', url: '/' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      const [installData, notificationData] = await Promise.all([fetchPwaInstalls(), fetchAdminNotifications()]);
      setInstalls(installData || []);
      setHistory(notificationData || []);
    } catch (error) { showToast?.(error.response?.data?.message || 'Could not load notification data.', null, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const submit = async event => {
    event.preventDefault();
    try {
      setSending(true);
      const result = await sendAdminNotification(form);
      showToast?.(`Notification sent to ${result.delivery?.sent || 0} device(s).`, null, 'success');
      setForm({ title: '', body: '', url: '/' });
      await load();
    } catch (error) { showToast?.(error.response?.data?.message || 'Notification could not be sent.', null, 'error'); }
    finally { setSending(false); }
  };

  const installedCount = installs.filter(item => item.installed).length;
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat icon={<HiDeviceMobile />} label="Installed PWAs" value={installedCount} />
      <Stat icon={<HiBell />} label="Known devices" value={installs.length} />
      <Stat icon={<HiSpeakerphone />} label="Broadcasts" value={history.length} />
    </div>
    <section className="admin-panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-primary">Push notification</h2><p className="text-sm text-stone-500">Send an update to every customer who enabled notifications.</p></div><button onClick={load} className="admin-secondary-button"><HiRefresh /> Refresh</button></div>
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <label><span className="mb-1 block text-xs font-black uppercase text-stone-600">Title</span><input className="asset-control" maxLength={80} required value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="New festive collection" /></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-stone-600">Open link</span><input className="asset-control" maxLength={500} required pattern="/.*" value={form.url} onChange={event => setForm(current => ({ ...current, url: event.target.value }))} placeholder="/new-arrivals" /></label>
        <label className="lg:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-stone-600">Message</span><textarea className="asset-control min-h-28" maxLength={220} required value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} placeholder="Discover the latest designs now." /></label>
        <button disabled={sending} className="admin-primary-button w-fit min-w-48"><HiSpeakerphone /> {sending ? 'Sending…' : 'Push to all devices'}</button>
      </form>
    </section>
    <section className="admin-panel overflow-hidden"><div className="border-b border-stone-100 p-5"><h3 className="font-black text-primary">Notification history</h3></div>{loading ? <p className="p-8 text-center text-sm text-stone-400">Loading…</p> : history.length ? <div className="divide-y divide-stone-100">{history.map(item => <article key={item.suitId} className="flex items-start justify-between gap-4 p-4"><div><p className="font-bold text-primary">{item.title}</p><p className="mt-1 text-sm text-stone-500">{item.body}</p><p className="mt-2 text-[10px] text-stone-400">{new Date(item.created_at).toLocaleString()}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{item.delivery?.sent || 0} sent</span></article>)}</div> : <p className="p-8 text-center text-sm text-stone-400">No broadcasts yet.</p>}</section>
    <section className="admin-panel overflow-hidden">
      <div className="border-b border-stone-100 p-5"><h3 className="font-black text-primary">PWA installations</h3><p className="mt-1 text-xs text-stone-500">Registered app devices and their most recent activity.</p></div>
      {loading ? <p className="p-8 text-center text-sm text-stone-400">Loading…</p> : installedCount ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Platform</th><th className="px-5 py-3">Installed</th><th className="px-5 py-3">Last seen</th></tr></thead><tbody className="divide-y divide-stone-100">{installs.filter(item => item.installed).map(item => <tr key={item.suitId}><td className="px-5 py-3 font-bold text-primary">{item.user_email || 'Guest device'}</td><td className="px-5 py-3 text-stone-600">{item.platform || 'Unknown'}</td><td className="px-5 py-3 text-stone-600">{item.installed_at ? new Date(item.installed_at).toLocaleString() : 'Recorded'}</td><td className="px-5 py-3 text-stone-600">{new Date(item.last_seen_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-stone-400">No PWA installations recorded yet.</p>}
    </section>
  </div>;
};

const Stat = ({ icon, label, value }) => <div className="admin-panel flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-xl text-amber-700">{icon}</span><div><p className="text-2xl font-black text-primary">{value}</p><p className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p></div></div>;

export default NotificationManager;
