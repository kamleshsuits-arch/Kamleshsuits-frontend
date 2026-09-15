import React, { useCallback, useEffect, useState } from 'react';
import { HiBell, HiDeviceMobile, HiRefresh, HiSpeakerphone } from 'react-icons/hi';
import { fetchAdminNotifications, fetchPwaInstalls, sendAdminNotification, fetchNotificationRecipients } from '../../api/notifications';

const NotificationManager = ({ showToast }) => {
  const [installs, setInstalls] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ title: '', body: '', url: '/' });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState([]);
  const [recipientReady, setRecipientReady] = useState(false);
  const [audienceMode, setAudienceMode] = useState('selected');
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setRecipientReady(false);
    try {
      const [installData, notificationData, recipientData] = await Promise.all([fetchPwaInstalls(), fetchAdminNotifications(), fetchNotificationRecipients()]);
      setInstalls(installData || []);
      setHistory(notificationData || []);
      setRecipients(recipientData);
      setSelected(current => current.filter(id => recipientData.some(item => item.id === id)));
      setRecipientReady(true);
    } catch (error) { showToast?.(error.response?.data?.message || 'Could not load notification data.', null, 'error'); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  const submit = async event => {
    event.preventDefault();
    try {
      setSending(true);
      if (!recipientReady || (audienceMode === 'selected' && !selected.length)) return;
      const result = await sendAdminNotification({ ...form, audience: { mode: audienceMode, ...(audienceMode === 'selected' ? { recipientIds: selected } : {}) } });
      showToast?.(`Notification sent to ${result.delivery?.sent || 0} device(s).`, null, 'success');
      setForm({ title: '', body: '', url: '/' });
      setSelected([]);
      await load();
    } catch (error) { showToast?.(error.response?.data?.message || 'Notification could not be sent.', null, 'error'); }
    finally { setSending(false); }
  };

  const installedCount = installs.filter(item => item.installed).length;
  return <div className="space-y-6">
    <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-stone-700">New in-stock products and newly launched vouchers automatically notify all devices with notifications enabled. Bulk imports send one alert per collection type. Editing an existing product or voucher does not send a launch alert.</p>
    <div className="grid gap-4 sm:grid-cols-3">
      <Stat icon={<HiDeviceMobile />} label="Installed PWAs" value={installedCount} />
      <Stat icon={<HiBell />} label="Known devices" value={installs.length} />
      <Stat icon={<HiSpeakerphone />} label="Broadcasts" value={history.length} />
    </div>
    <section className="admin-panel p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black text-primary">Push notification</h2><p className="text-sm text-stone-500">Send to selected customers or everyone who enabled notifications.</p></div><button disabled={sending} onClick={load} className="admin-secondary-button"><HiRefresh /> Refresh</button></div>
      <form onSubmit={submit} className="grid gap-4 lg:grid-cols-2">
        <fieldset disabled={sending} className="lg:col-span-2 rounded-xl border border-stone-200 p-4">
          <legend className="px-1 font-bold">Recipients</legend>
          <div className="flex flex-wrap gap-5">
            <label className="flex items-center gap-2"><input type="radio" name="audience" checked={audienceMode === 'selected'} onChange={() => setAudienceMode('selected')} /> Select one or more</label>
            <label className="flex items-center gap-2"><input type="radio" name="audience" checked={audienceMode === 'all'} onChange={() => setAudienceMode('all')} /> All recipients ({recipients.length})</label>
          </div>
          <p className="mt-2 text-xs text-stone-500">Only devices with notifications enabled appear here. Signed-in customers are grouped across their devices; guests appear separately.</p>
          {!recipientReady ? <p role="status" className="mt-3 text-sm">Recipient list unavailable or loading. Use Refresh to retry.</p> : !recipients.length ? <p className="mt-3 text-sm">No notification subscribers yet.</p> : audienceMode === 'selected' && <>
            <input aria-label="Search notification recipients" className="asset-control mt-3" placeholder="Search email or guest device" value={search} onChange={event => setSearch(event.target.value)} />
            <div className="mt-2 flex gap-4 text-sm"><button type="button" onClick={() => setSelected(recipients.filter(item => item.label.toLowerCase().includes(search.toLowerCase())).map(item => item.id))}>Select all shown</button><button type="button" onClick={() => setSelected([])}>Clear selection</button></div>
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-stone-100">
              {recipients.filter(item => item.label.toLowerCase().includes(search.toLowerCase())).map(item => <label key={item.id} className="flex items-center gap-3 py-3"><input type="checkbox" checked={selected.includes(item.id)} onChange={event => setSelected(current => event.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))} /><span className="min-w-0 break-all">{item.label}<span className="block text-xs text-stone-500">{item.devices} device(s)</span></span></label>)}
            </div>
            <p className="mt-2 text-sm font-bold" role="status">{selected.length} recipient(s) selected</p>
          </>}
        </fieldset>
        <label><span className="mb-1 block text-xs font-black uppercase text-stone-600">Title</span><input className="asset-control" maxLength={80} required value={form.title} onChange={event => setForm(current => ({ ...current, title: event.target.value }))} placeholder="New festive collection" /></label>
        <label><span className="mb-1 block text-xs font-black uppercase text-stone-600">Open link</span><input className="asset-control" maxLength={500} required pattern="/.*" value={form.url} onChange={event => setForm(current => ({ ...current, url: event.target.value }))} placeholder="/new-arrivals" /></label>
        <label className="lg:col-span-2"><span className="mb-1 block text-xs font-black uppercase text-stone-600">Message</span><textarea className="asset-control min-h-28" maxLength={220} required value={form.body} onChange={event => setForm(current => ({ ...current, body: event.target.value }))} placeholder="Discover the latest designs now." /></label>
        <button disabled={sending || !recipientReady || !recipients.length || (audienceMode === 'selected' && !selected.length)} className="admin-primary-button w-fit min-w-48"><HiSpeakerphone /> {sending ? 'Sending…' : audienceMode === 'all' ? `Send to all ${recipients.length} recipients` : `Send to ${selected.length} selected recipient(s)`}</button>
      </form>
    </section>
    <section className="admin-panel overflow-hidden"><div className="border-b border-stone-100 p-5"><h3 className="font-black text-primary">Notification history</h3></div>{loading ? <p className="p-8 text-center text-sm text-stone-400">Loading…</p> : history.length ? <div className="divide-y divide-stone-100">{history.map(item => <article key={item.suitId} className="flex items-start justify-between gap-4 p-4"><div className="min-w-0"><p className="font-bold text-primary">{item.title}</p><p className="mt-1 break-words text-sm text-stone-500">{item.body}</p><p className="mt-2 text-[10px] text-stone-400">{new Date(item.created_at).toLocaleString()} · {item.source === 'inventory_added' ? 'Automatic: new inventory' : item.source === 'voucher_launched' ? 'Automatic: new voucher' : 'Manual broadcast'}</p></div><span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{item.delivery?.sent || 0} sent{item.status && <span className="block">{item.status}</span>}{item.delivery?.failed > 0 && <span className="block text-red-700">{item.delivery.failed} failed</span>}</span></article>)}</div> : <p className="p-8 text-center text-sm text-stone-400">No broadcasts yet.</p>}</section>
    <section className="admin-panel overflow-hidden">
      <div className="border-b border-stone-100 p-5"><h3 className="font-black text-primary">PWA installations</h3><p className="mt-1 text-xs text-stone-500">Registered app devices and their most recent activity.</p></div>
      {loading ? <p className="p-8 text-center text-sm text-stone-400">Loading…</p> : installedCount ? <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-stone-50 text-[10px] uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">User</th><th className="px-5 py-3">Platform</th><th className="px-5 py-3">Installed</th><th className="px-5 py-3">Last seen</th></tr></thead><tbody className="divide-y divide-stone-100">{installs.filter(item => item.installed).map(item => <tr key={item.suitId}><td className="px-5 py-3 font-bold text-primary">{item.user_email || 'Guest device'}</td><td className="px-5 py-3 text-stone-600">{item.platform || 'Unknown'}</td><td className="px-5 py-3 text-stone-600">{item.installed_at ? new Date(item.installed_at).toLocaleString() : 'Recorded'}</td><td className="px-5 py-3 text-stone-600">{new Date(item.last_seen_at).toLocaleString()}</td></tr>)}</tbody></table></div> : <p className="p-8 text-center text-sm text-stone-400">No PWA installations recorded yet.</p>}
    </section>
  </div>;
};

const Stat = ({ icon, label, value }) => <div className="admin-panel flex items-center gap-4 p-5"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-xl text-amber-700">{icon}</span><div><p className="text-2xl font-black text-primary">{value}</p><p className="text-xs font-bold uppercase tracking-wide text-stone-400">{label}</p></div></div>;

export default NotificationManager;
