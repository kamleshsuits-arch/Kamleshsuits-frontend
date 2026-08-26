import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { HiCheckCircle, HiClock, HiLocationMarker, HiPhone, HiRefresh, HiSearch, HiTruck, HiUserGroup } from 'react-icons/hi';
import { format } from 'date-fns';
import { fetchDeliveryDemands, updateDeliveryDemand } from '../../api/products';

const STATUSES = ['New', 'Contacted', 'Planned', 'Serviceable', 'Closed'];
const STATUS_STYLES = {
  New: 'bg-amber-50 text-amber-700 border-amber-200',
  Contacted: 'bg-blue-50 text-blue-700 border-blue-200',
  Planned: 'bg-violet-50 text-violet-700 border-violet-200',
  Serviceable: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Closed: 'bg-stone-100 text-stone-600 border-stone-200',
};

const DeliveryDemandInsights = ({ showToast }) => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [draftNotes, setDraftNotes] = useState({});
  const [lastSynced, setLastSynced] = useState(null);

  const loadDemands = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true); else setRefreshing(true);
      const data = await fetchDeliveryDemands();
      const sorted = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setDemands(sorted);
      setDraftNotes(current => Object.fromEntries(sorted.map(item => [item.suitId, current[item.suitId] ?? item.admin_notes ?? ''])));
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to fetch delivery requests', error);
      showToast?.('Could not refresh delivery requests.', null, 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDemands(true);
    const interval = setInterval(() => loadDemands(false), 10000);
    const handleFocus = () => loadDemands(false);
    window.addEventListener('focus', handleFocus);
    return () => { clearInterval(interval); window.removeEventListener('focus', handleFocus); };
  }, [loadDemands]);

  const updateRequest = async (demand, status = demand.status || 'New') => {
    try {
      setUpdatingId(demand.suitId);
      const updated = await updateDeliveryDemand(demand.suitId, { status, admin_notes: draftNotes[demand.suitId] || '' });
      setDemands(current => current.map(item => item.suitId === demand.suitId ? { ...item, ...updated } : item));
      showToast?.(`Delivery request marked ${status}.`, null, 'success');
    } catch (error) {
      console.error('Failed to update delivery request', error);
      showToast?.('Could not update this delivery request.', null, 'error');
    } finally { setUpdatingId(null); }
  };

  const filteredDemands = useMemo(() => {
    const query = search.trim().toLowerCase();
    return demands.filter(demand => {
      const status = demand.status || 'New';
      const statusMatch = statusFilter === 'All' || (statusFilter === 'Open' && !['Serviceable', 'Closed'].includes(status)) || status === statusFilter;
      const searchMatch = !query || [demand.name, demand.phone, demand.city, demand.pincode, demand.address].some(value => String(value || '').toLowerCase().includes(query));
      return statusMatch && searchMatch;
    });
  }, [demands, search, statusFilter]);

  const insights = useMemo(() => {
    const locations = demands.reduce((map, demand) => {
      const key = String(demand.city || demand.pincode || 'Unknown').trim();
      map[key] = (map[key] || 0) + 1;
      return map;
    }, {});
    return Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [demands]);

  const newCount = demands.filter(item => (item.status || 'New') === 'New').length;
  const plannedCount = demands.filter(item => item.status === 'Planned').length;
  const serviceableCount = demands.filter(item => item.status === 'Serviceable').length;

  if (loading) return <div className="p-20 text-center text-stone-500 animate-pulse font-bold">Loading live delivery requests…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="admin-section-header">
        <div>
          <div className="flex items-center gap-3"><h2 className="text-2xl font-black text-primary">Delivery requests</h2><span className="live-status"><span /> Live</span></div>
          <p className="mt-1 text-sm text-stone-500">Contact customers, plan new service areas, and track every request to completion.</p>
        </div>
        <button onClick={() => loadDemands(false)} disabled={refreshing} className="admin-secondary-button"><HiRefresh className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      <div className="admin-kpi-grid">
        <SummaryCard label="New requests" value={newCount} icon={<HiClock />} tone="amber" />
        <SummaryCard label="Expansion planned" value={plannedCount} icon={<HiTruck />} tone="violet" />
        <SummaryCard label="Now serviceable" value={serviceableCount} icon={<HiCheckCircle />} tone="emerald" />
        <SummaryCard label="Total demand" value={demands.length} icon={<HiUserGroup />} tone="blue" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="admin-panel overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-stone-200 p-4 md:flex-row md:items-center">
            <div className="relative flex-1"><HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, phone, city or PIN" className="admin-search-input" /></div>
            <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="admin-filter-select"><option>Open</option><option>All</option>{STATUSES.map(status => <option key={status}>{status}</option>)}</select>
            <span className="text-xs font-bold text-stone-500">{filteredDemands.length} shown</span>
          </div>

          <div className="divide-y divide-stone-100">
            {filteredDemands.map(demand => {
              const status = demand.status || 'New';
              return (
                <div key={demand.suitId} className="p-5 hover:bg-stone-50/60">
                  <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr_210px]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><p className="font-black text-primary">{demand.name || 'Customer'}</p><span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>{status}</span></div>
                      <a href={`tel:${demand.phone}`} className="mt-2 flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline"><HiPhone /> {demand.phone}</a>
                      <p className="mt-2 flex items-start gap-2 text-sm text-stone-600"><HiLocationMarker className="mt-0.5 shrink-0" /> {demand.address || 'Address not provided'}, {demand.city || 'Unknown'} — {demand.pincode}</p>
                      <p className="mt-2 text-xs text-stone-400">Requested {demand.created_at ? format(new Date(demand.created_at), 'dd MMM yyyy, HH:mm') : 'recently'}</p>
                    </div>
                    <textarea value={draftNotes[demand.suitId] || ''} onChange={event => setDraftNotes(current => ({ ...current, [demand.suitId]: event.target.value }))} placeholder="Add call notes or expansion plan…" className="min-h-24 rounded-xl border border-stone-200 bg-white p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10" />
                    <div className="space-y-3">
                      <select value={status} onChange={event => updateRequest(demand, event.target.value)} disabled={updatingId === demand.suitId} className="admin-filter-select w-full">{STATUSES.map(item => <option key={item}>{item}</option>)}</select>
                      <button onClick={() => updateRequest(demand, status)} disabled={updatingId === demand.suitId} className="admin-primary-button w-full">{updatingId === demand.suitId ? 'Saving…' : 'Save notes'}</button>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredDemands.length === 0 && <div className="p-16 text-center text-sm text-stone-500">No delivery requests match this view.</div>}
          </div>
        </div>

        <aside className="admin-panel h-fit p-5">
          <h3 className="font-black text-primary">Demand hotspots</h3><p className="mt-1 text-xs text-stone-500">Top cities and PIN areas from live requests.</p>
          <div className="mt-5 space-y-4">
            {insights.map(([location, count]) => <div key={location}><div className="flex justify-between text-sm"><span className="font-bold text-stone-700">{location}</span><span className="text-stone-500">{count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-100"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(12, (count / Math.max(demands.length, 1)) * 100)}%` }} /></div></div>)}
            {!insights.length && <p className="text-sm text-stone-400">Waiting for demand data.</p>}
          </div>
          <p className="mt-6 border-t border-stone-100 pt-4 text-xs text-stone-400">Last synced {lastSynced ? format(lastSynced, 'HH:mm:ss') : '—'} · refreshes every 10 seconds</p>
        </aside>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value, icon, tone }) => <div className="admin-kpi-card"><span className={`admin-kpi-icon admin-kpi-icon-${tone}`}>{icon}</span><div><p>{label}</p><strong>{value}</strong></div></div>;

export default DeliveryDemandInsights;
