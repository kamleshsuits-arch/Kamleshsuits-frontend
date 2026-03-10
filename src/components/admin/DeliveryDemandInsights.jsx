import React, { useState, useEffect } from 'react';
import { 
  HiLocationMarker, HiPhone, HiUser, HiClock, HiTrendingUp, 
  HiMap, HiViewGrid, HiTable 
} from 'react-icons/hi';
import { fetchDeliveryDemands } from '../../api/products';
import { format } from 'date-fns';

const DeliveryDemandInsights = () => {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list', 'stats', or 'map'

  useEffect(() => {
    const loadDemands = async () => {
      try {
        const data = await fetchDeliveryDemands();
        setDemands(data || []);
      } catch (err) {
        console.error("Failed to fetch demands", err);
      } finally {
        setLoading(false);
      }
    };
    loadDemands();
  }, []);

  const getStats = () => {
    const cityMap = {};
    const pinMap = {};

    demands.forEach(d => {
      cityMap[d.city] = (cityMap[d.city] || 0) + 1;
      pinMap[d.pincode] = (pinMap[d.pincode] || 0) + 1;
    });

    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topPins = Object.entries(pinMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { topCities, topPins };
  };

  const { topCities, topPins } = getStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif text-primary">Delivery Area Expansion Leads</h2>
          <p className="text-secondary text-sm">Tracking demand from unsupported regions</p>
        </div>
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button 
            onClick={() => setView('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-primary'}`}
          >
            <HiTable size={16} /> Request List
          </button>
          <button 
            onClick={() => setView('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'stats' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-primary'}`}
          >
            <HiTrendingUp size={16} /> Insights
          </button>
          <button 
            onClick={() => setView('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${view === 'map' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-primary'}`}
          >
            <HiMap size={16} /> Heatmap
          </button>
        </div>
      </div>

      {view === 'map' ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                <HiMap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-primary uppercase tracking-widest text-sm">Demand Heatmap</h3>
                <p className="text-stone-400 text-xs">Geographic distribution of delivery requests</p>
              </div>
            </div>
            {/* Map embed centred on Delhi NCR */}
            <div className="rounded-2xl overflow-hidden border border-stone-100 shadow-sm mb-6">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d224345.83923191402!2d77.06889754899583!3d28.527252869492814!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1709999999999!5m2!1sen!2sin"
                width="100%"
                height="380"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Delhi NCR Delivery Demand Map"
              />
            </div>

            {/* Demand distribution by city */}
            {demands.length > 0 ? (
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-4">City Distribution</h4>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const cityMap = {};
                    demands.forEach(d => { cityMap[d.city || 'Unknown'] = (cityMap[d.city || 'Unknown'] || 0) + 1; });
                    const colors = ['bg-accent', 'bg-orange-500', 'bg-amber-500', 'bg-blue-500', 'bg-violet-500', 'bg-emerald-500'];
                    return Object.entries(cityMap)
                      .sort((a, b) => b[1] - a[1])
                      .map(([city, count], i) => (
                        <div key={city} className="flex items-center gap-2 bg-stone-50 px-4 py-2 rounded-full border border-stone-100">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colors[i % colors.length]}`} />
                          <span className="font-bold text-primary text-sm">{city}</span>
                          <span className="text-stone-400 text-xs font-bold">{count} req</span>
                        </div>
                      ));
                  })()}
                </div>
              </div>
            ) : (
              <p className="text-center py-6 text-stone-400 italic text-sm">No demand requests yet. The map will show city clusters when requests come in.</p>
            )}
          </div>
        </div>
      ) : view === 'stats' ? (
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Top Cities */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <HiMap size={24} />
              </div>
              <h3 className="font-bold text-primary uppercase tracking-widest text-sm">Top Demanded Cities</h3>
            </div>
            <div className="space-y-6">
              {topCities.map(([city, count], idx) => (
                <div key={city} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-primary">{city || 'Unknown'}</span>
                    <span className="text-xs font-black text-secondary">{count} Requests</span>
                  </div>
                  <div className="h-2 bg-stone-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(count / demands.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topCities.length === 0 && <p className="text-center py-8 text-stone-400 italic">No demand data yet</p>}
            </div>
          </div>

          {/* Top PIN Codes */}
          <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                <HiLocationMarker size={24} />
              </div>
              <h3 className="font-bold text-primary uppercase tracking-widest text-sm">Top PIN Codes</h3>
            </div>
            <div className="space-y-6">
              {topPins.map(([pin, count], idx) => (
                <div key={pin} className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono font-bold text-primary">{pin}</span>
                    <span className="text-xs font-black text-secondary">{count} Requests</span>
                  </div>
                  <div className="h-2 bg-stone-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                      style={{ width: `${(count / demands.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              {topPins.length === 0 && <p className="text-center py-8 text-stone-400 italic">No demand data yet</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-stone-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/50 border-b border-stone-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Customer</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Contact</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Location</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-stone-400">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {demands.map((demand) => (
                  <tr key={demand.suitId} className="hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-400">
                          <HiUser size={16} />
                        </div>
                        <span className="font-bold text-primary">{demand.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-secondary text-sm">
                        <HiPhone className="text-stone-300" />
                        {demand.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-primary">{demand.city}</span>
                        <span className="text-[10px] text-stone-400 uppercase tracking-widest">{demand.pincode}</span>
                        <p className="text-xs text-stone-500 line-clamp-1 mt-1">{demand.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-stone-400 text-xs">
                        <HiClock />
                        {demand.created_at ? format(new Date(demand.created_at), 'dd MMM, HH:mm') : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
                {demands.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-20 text-center text-stone-400 italic">
                      No delivery area expansion requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDemandInsights;
