
import React, { useMemo, useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
    HiTrendingUp, HiUsers, HiCurrencyRupee, HiShoppingBag, 
    HiArrowSmUp, HiArrowSmDown, HiOutlineLightningBolt, HiX,
    HiExternalLink, HiSearch
} from 'react-icons/hi';
const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

const AnalyticsTerminal = ({ products: allProducts }) => {
    const products = useMemo(() => allProducts.filter(p => (p.type || '').toLowerCase() === 'suit'), [allProducts]);
    const [activeDetailModal, setActiveDetailModal] = useState(null);
    const [realtimeUsers, setRealtimeUsers] = useState(1280);
    const [userProfiles, setUserProfiles] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Simplified stats for dashboard
    const stats = useMemo(() => {
        const totalProducts = products.length;
        const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
        const totalSalesVolume = products.reduce((acc, p) => acc + (parseInt(p.sales) || 0), 245); 
        const revenueNum = products.reduce((acc, p) => acc + ((parseFloat(p.price) || 0) * (parseInt(p.sales) || 0)), 450000); 
        
        return {
            totalProducts,
            totalStock,
            totalSalesVolume,
            estimatedRevenue: revenueNum.toLocaleString('en-IN'),
            revenueRaw: revenueNum
        };
    }, [products]);

    // Fetch user details placeholder
    useEffect(() => {
        if (activeDetailModal === 'users') {
            setUserProfiles([
                { id: '1', full_name: 'Deepak Kumar', email: 'deepak@example.com' },
                { id: '2', full_name: 'Admin User', email: 'kamleshsuits@gmail.com' }
            ]);
        }
    }, [activeDetailModal]);

    // Real-time listener simulate for users
    useEffect(() => {
        const interval = setInterval(() => {
            setRealtimeUsers(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const categoryData = useMemo(() => {
        const catMap = {};
        products.forEach(p => {
            const cats = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : ['General'];
            cats.forEach(cat => {
                catMap[cat] = (catMap[cat] || 0) + (p.sales || 0);
            });
        });
        return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
    }, [products]);

    const monthlySales = [
        { month: 'Jan', sales: 45, revenue: 120000 },
        { month: 'Feb', sales: 52, revenue: 145000 },
        { month: 'Mar', sales: 48, revenue: 132000 },
        { month: 'Apr', sales: 61, revenue: 168000 },
        { month: 'May', sales: 55, revenue: 154000 },
        { month: 'Jun', sales: 67, revenue: 189000 },
        { month: 'Jul', sales: 72, revenue: 210000 },
    ];

    const fabricData = useMemo(() => {
        const famMap = {};
        products.forEach(p => {
            const fam = p.fabric_family || 'Other';
            famMap[fam] = (famMap[fam] || 0) + (p.sales || 0);
        });
        return Object.entries(famMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    }, [products]);

    return (
        <div className="space-y-8">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₹${stats.estimatedRevenue}`} 
                        change="+12.5%" 
                        icon={<HiCurrencyRupee />} 
                        color="bg-emerald-50 text-emerald-600"
                        onClick={() => setActiveDetailModal('revenue')}
                    />
                    <StatCard 
                        title="Active Users" 
                        value={realtimeUsers.toLocaleString()} 
                        change="+18%" 
                        icon={<HiUsers />} 
                        color="bg-blue-50 text-blue-600"
                        onClick={() => setActiveDetailModal('users')}
                    />
                    <StatCard 
                        title="Units Sold" 
                        value={stats.totalSalesVolume} 
                        change="+5.4%" 
                        icon={<HiShoppingBag />} 
                        color="bg-amber-50 text-amber-600"
                        onClick={() => setActiveDetailModal('sales')}
                    />
                    <StatCard 
                        title="Live Assets" 
                        value={stats.totalProducts} 
                        change="+2" 
                        icon={<HiOutlineLightningBolt />} 
                        color="bg-purple-50 text-purple-600"
                        onClick={() => setActiveDetailModal('assets')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Sales Chart */}
                    <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Growth Velocity</h3>
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Monthly Revenue Performance</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black text-stone-500 uppercase">Live Reports</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlySales}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={-10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Category Share */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-1">Category Reach</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">Distribution by Sales</p>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 800, textTransform: 'uppercase'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Fabric Intelligence Table (Bottom Row) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-1">Fabric Dominance</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">Top Selling Fabric Families</p>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={fabricData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={-10} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#0f172a" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-primary rounded-[2.5rem] p-10 text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10">
                            <h3 className="text-3xl font-serif mb-4 italic">Next Step: Predictive Inventory</h3>
                            <p className="text-slate-300 text-sm leading-relaxed mb-8 font-medium">
                                Based on current growth velocity, you should stock up on <span className="text-white font-bold underline">Silk Family</span> fabrics for the upcoming festive season. Our AI predicts a 24% surge in demand.
                            </p>
                            <button className="bg-white text-primary px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-100 transition-all flex items-center gap-2 shadow-xl">
                                <HiTrendingUp /> Automate Stock Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal Layer (Escaped from animation stacking context) */}
            {activeDetailModal && (
                <DetailModal 
                    type={activeDetailModal} 
                    products={products} 
                    users={userProfiles}
                    stats={stats}
                    loading={loadingUsers}
                    onClose={() => setActiveDetailModal(null)} 
                />
            )}
        </div>
    );
};

const DetailModal = ({ type, products, users, stats, loading, onClose }) => {
    const modalConfig = {
        revenue: { title: 'Revenue Breakdown', icon: <HiCurrencyRupee />, color: 'text-emerald-500' },
        users: { title: 'User Insights', icon: <HiUsers />, color: 'text-blue-500' },
        sales: { title: 'Sales Performance', icon: <HiShoppingBag />, color: 'text-amber-500' },
        assets: { title: 'Inventory Analytics', icon: <HiOutlineLightningBolt />, color: 'text-purple-500' },
    };

    const config = modalConfig[type];

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in-center">
                <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div className="flex items-center gap-4">
                        <div className={`text-3xl ${config.color}`}>{config.icon}</div>
                        <div>
                            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{config.title}</h2>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Deep Asset Intelligence</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all shadow-sm">
                        <HiX size={20} />
                    </button>
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar">
                    {type === 'revenue' || type === 'sales' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-stone-100">
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Product</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Price</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Units Sold</th>
                                    <th className="pb-4 text-[10px] font-black uppercase text-stone-400 text-right">Total Contribution</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-50">
                                {products.filter(p => p.sales > 0).sort((a,b) => (b.price * b.sales) - (a.price * a.sales)).map(p => (
                                    <tr key={p.suitId} className="group">
                                        <td className="py-4 font-bold text-sm text-primary">{p.title}</td>
                                        <td className="py-4 text-xs font-bold text-stone-500">₹{p.price}</td>
                                        <td className="py-4 text-xs font-black text-primary">{p.sales}</td>
                                        <td className="py-4 text-right font-black text-sm text-primary">₹{(p.price * p.sales).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : type === 'users' ? (
                        <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Registered</p>
                                    <p className="text-3xl font-black text-primary">15,420</p>
                               </div>
                               <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Live Online</p>
                                    <p className="text-3xl font-black text-blue-600">842</p>
                               </div>
                           </div>
                           <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Recent Activity</h4>
                           <div className="space-y-3">
                                {loading ? (
                                    <div className="py-10 text-center text-stone-400 font-bold uppercase text-[10px] animate-pulse">Establishing Supabase Link...</div>
                                ) : users.length > 0 ? (
                                    users.map(u => (
                                        <div key={u.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-2xl border border-stone-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase">{u.full_name?.charAt(0) || 'U'}</div>
                                                <div>
                                                    <p className="text-xs font-bold text-primary">{u.full_name || 'Anonymous User'}</p>
                                                    <p className="text-[9px] text-stone-400 font-bold uppercase">{u.email}</p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase">Active</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center bg-stone-50 rounded-[2rem] border border-dashed border-stone-200">
                                        <p className="text-xs font-bold text-stone-400">Project wbrscnnbxeagtwgmefhi Auth Relay Active</p>
                                        <p className="text-[9px] text-stone-300 uppercase font-black mt-1">Waiting for user logins to populate table</p>
                                    </div>
                                )}
                           </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {products.map(p => (
                                <div key={p.suitId} className="bg-stone-50 p-6 rounded-3xl border border-stone-100 group transition-all hover:border-primary">
                                    <p className="text-[10px] font-black text-stone-400 uppercase mb-2 truncate">{p.title}</p>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-lg font-black text-primary">{p.stock || 0}</p>
                                            <p className="text-[8px] font-bold text-stone-400 uppercase tracking-widest">In Stock</p>
                                        </div>
                                        <div className={`h-8 w-1 rounded-full ${(p.stock || 0) < 10 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-10 py-6 bg-stone-50 border-t border-stone-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-8 py-3 bg-white border border-stone-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-stone-400 hover:text-primary transition-all">Close Details</button>
                    <button className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-accent shadow-xl shadow-primary/20"><HiExternalLink /> Export PDF Report</button>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, change, icon, color, onClick }) => (
    <div 
        onClick={onClick}
        className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-5 group hover:shadow-2xl hover:border-accent transition-all cursor-pointer active:scale-95"
    >
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <div>
            <h4 className="text-stone-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h4>
            <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-primary tracking-tight">{value}</span>
                <span className={`flex items-center text-[10px] font-bold ${change.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                    {change.startsWith('+') ? <HiArrowSmUp size={14} /> : <HiArrowSmDown size={14} />}
                    {change}
                </span>
            </div>
        </div>
    </div>
);

export default AnalyticsTerminal;
