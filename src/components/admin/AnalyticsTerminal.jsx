import React, { useMemo, useState, useEffect } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    AreaChart, Area, PieChart, Pie, Cell, Legend, Line
} from 'recharts';
import { 
    HiUsers, HiCurrencyRupee, HiShoppingBag, 
    HiOutlineLightningBolt, HiX, HiExternalLink
} from 'react-icons/hi';
import { fetchAllUsers, fetchAllOrders } from '../../api/products';

const COLORS = ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const AnalyticsTerminal = ({ products: allProducts }) => {
    const products = useMemo(() => allProducts.filter(p => (p.type || '').toLowerCase() === 'suit'), [allProducts]);
    const [activeDetailModal, setActiveDetailModal] = useState(null);
    const [realUsers, setRealUsers] = useState([]);
    const [realOrders, setRealOrders] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setLoadingData(true);
            try {
                const [usersData, ordersData] = await Promise.all([
                    fetchAllUsers(),
                    fetchAllOrders()
                ]);
                setRealUsers(usersData || []);
                setRealOrders(ordersData || []);
            } catch (err) {
                console.error("Failed to fetch analytics data", err);
            } finally {
                setLoadingData(false);
            }
        };
        loadData();
    }, []);

    // Enriched users with order info
    const userProfiles = useMemo(() => {
        return realUsers.map(user => {
            const userOrders = realOrders.filter(o => o.user_id === user.user_id);
            const totalOrders = userOrders.length;
            const isRepeated = totalOrders > 1;
            const lastLogin = user.updated_at || user.created_at; 
            const created = user.created_at || "N/A";
            
            // Try to extract address & phone from the last order if not in user profile
            const lastOrder = userOrders.sort((a,b) => new Date(b.created_at) - new Date(a.created_at))[0];
            const phone = user.phone || lastOrder?.address?.phone || "N/A";
            const addressObj = lastOrder?.address;
            const addressStr = addressObj ? `${addressObj.street}, ${addressObj.city}, ${addressObj.pincode}` : "Unknown";

            return {
                ...user,
                phone,
                addressStr,
                totalOrders,
                isRepeated,
                revenueGenerated: userOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0),
                lastOrderDate: lastOrder?.created_at || "Never",
                lastLogin,
                created
            };
        }).sort((a,b) => b.totalOrders - a.totalOrders);
    }, [realUsers, realOrders]);

    // Computed real stats
    const stats = useMemo(() => {
        const totalProducts = products.length;
        const totalStock = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
        
        let totalSalesVolume = 0;
        let revenueNum = 0;

        realOrders.forEach(order => {
            if (order.status !== 'Cancelled') {
                revenueNum += (parseFloat(order.total) || 0);
                order.items?.forEach(item => {
                    totalSalesVolume += (parseInt(item.quantity) || 1);
                });
            }
        });

        return {
            totalProducts,
            totalStock,
            totalSalesVolume,
            estimatedRevenue: formatCurrency(revenueNum).replace('₹', '').trim(),
            revenueRaw: revenueNum,
            totalUsers: userProfiles.length,
            repeatedUsers: userProfiles.filter(u => u.isRepeated).length
        };
    }, [products, realOrders, userProfiles]);

    // Dynamic Monthly Sales
    const monthlySales = useMemo(() => {
        const dataMap = {};
        realOrders.forEach(order => {
            if (order.status === 'Cancelled') return;
            const d = new Date(order.created_at);
            const y = d.getFullYear();
            const m = d.toLocaleString('default', { month: 'short' });
            const key = `${m} ${y}`;
            
            if (!dataMap[key]) dataMap[key] = { month: key, sales: 0, revenue: 0, dateObj: d };
            dataMap[key].revenue += (parseFloat(order.total) || 0);
            order.items?.forEach(item => {
                dataMap[key].sales += (parseInt(item.quantity) || 1);
            });
        });

        let sorted = Object.values(dataMap).sort((a,b) => a.dateObj - b.dateObj);
        // Fallback for empty
        if (sorted.length === 0) {
            return [
                { month: 'Jan', sales: 0, revenue: 0 },
                { month: 'Feb', sales: 0, revenue: 0 },
                { month: 'Mar', sales: 0, revenue: 0 }
            ];
        }
        return sorted;
    }, [realOrders]);

    // Dynamic Weekly Sales
    const weeklySales = useMemo(() => {
        const dataMap = {};
        realOrders.forEach(order => {
            if (order.status === 'Cancelled') return;
            const d = new Date(order.created_at);
            // Get week number
            const startDate = new Date(d.getFullYear(), 0, 1);
            const days = Math.floor((d - startDate) / (24 * 60 * 60 * 1000));
            const weekNumber = Math.ceil(days / 7);
            const key = `Week ${weekNumber}, ${d.getFullYear()}`;
            
            if (!dataMap[key]) dataMap[key] = { week: key, sales: 0, revenue: 0, dateObj: d };
            dataMap[key].revenue += (parseFloat(order.total) || 0);
            order.items?.forEach(item => {
                dataMap[key].sales += (parseInt(item.quantity) || 1);
            });
        });

        let sorted = Object.values(dataMap).sort((a,b) => a.dateObj - b.dateObj).slice(-10); // Last 10 weeks
        if (sorted.length === 0) return [{ week: 'W1', sales: 0, revenue: 0 }];
        return sorted;
    }, [realOrders]);

    const categoryData = useMemo(() => {
        const catMap = {};
        realOrders.forEach(order => {
            if (order.status === 'Cancelled') return;
            order.items?.forEach(item => {
                const cats = Array.isArray(item.categories) && item.categories.length > 0 ? item.categories : ['General'];
                cats.forEach(cat => {
                    catMap[cat] = (catMap[cat] || 0) + (parseInt(item.quantity) || 1);
                });
            });
        });
        
        // If empty fallback
        if (Object.keys(catMap).length === 0) {
            products.forEach(p => {
                const cats = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories : ['General'];
                cats.forEach(cat => {
                    catMap[cat] = (catMap[cat] || 0) + (p.sales || 0);
                });
            });
        }
        
        return Object.entries(catMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 6);
    }, [realOrders, products]);

    const fabricData = useMemo(() => {
        const famMap = {};
        realOrders.forEach(order => {
            if (order.status === 'Cancelled') return;
            order.items?.forEach(item => {
                const fam = item.fabric_family || 'Other';
                famMap[fam] = (famMap[fam] || 0) + (parseInt(item.quantity) || 1);
            });
        });
        
        // fallback
        if (Object.keys(famMap).length === 0) {
            products.forEach(p => {
                const fam = p.fabric_family || 'Other';
                famMap[fam] = (famMap[fam] || 0) + (p.sales || 0);
            });
        }
        
        return Object.entries(famMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
    }, [realOrders, products]);

    return (
        <div className="space-y-8">
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard 
                        title="Total Revenue" 
                        value={`₹${stats.estimatedRevenue}`} 
                        change="Synced" 
                        icon={<HiCurrencyRupee />} 
                        color="bg-emerald-50 text-emerald-600"
                        onClick={() => setActiveDetailModal('revenue')}
                    />
                    <StatCard 
                        title="Registered Users" 
                        value={loadingData ? "..." : stats.totalUsers} 
                        change={`${stats.repeatedUsers} Repeated`} 
                        icon={<HiUsers />} 
                        color="bg-blue-50 text-blue-600"
                        onClick={() => setActiveDetailModal('users')}
                    />
                    <StatCard 
                        title="Units Sold" 
                        value={loadingData ? "..." : stats.totalSalesVolume} 
                        change="All Time" 
                        icon={<HiShoppingBag />} 
                        color="bg-amber-50 text-amber-600"
                        onClick={() => setActiveDetailModal('sales')}
                    />
                    <StatCard 
                        title="Live Assets" 
                        value={stats.totalProducts} 
                        change={`${stats.totalStock} in stock`} 
                        icon={<HiOutlineLightningBolt />} 
                        color="bg-purple-50 text-purple-600"
                        onClick={() => setActiveDetailModal('assets')}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Main Sales Chart: Monthly */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Monthly Growth</h3>
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Revenue Performance</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-stone-50 rounded-full border border-stone-100">
                                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                <span className="text-[10px] font-black text-stone-500 uppercase">Live Reports</span>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
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
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={-10} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={10} />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 800, fontSize: '12px' }}
                                        formatter={(value, name) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : 'Units']}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    <Line yAxisId="right" type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Chart: Weekly Sales Tracker */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-primary uppercase tracking-tight">Weekly Units Tracking</h3>
                                <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-1">Short-term volume</p>
                            </div>
                        </div>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklySales}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700}} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dx={-10} />
                                    <Tooltip 
                                        cursor={{fill: '#f8fafc'}} 
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontWeight: 800 }} 
                                        formatter={(value) => [`${value} Units`, 'Sales']}
                                    />
                                    <Bar dataKey="sales" fill="#1e293b" radius={[10, 10, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Fabric & Category Intelligence */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Category Share */}
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-1">Category Reach</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">Distribution by Units Sold</p>
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

                    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-100">
                        <h3 className="text-xl font-black text-primary uppercase tracking-tight mb-1">Fabric Dominance</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-8">Top Selling Fabric Families</p>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={fabricData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} dy={10} />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 8, fontWeight: 700}} width={80} />
                                    <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="value" fill="#0f172a" radius={[0, 10, 10, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detail Modal Layer */}
            {activeDetailModal && (
                <DetailModal 
                    type={activeDetailModal} 
                    products={products} 
                    users={userProfiles}
                    orders={realOrders}
                    stats={stats}
                    loading={loadingData}
                    onClose={() => setActiveDetailModal(null)} 
                />
            )}
        </div>
    );
};

const DetailModal = ({ type, products, users, orders, stats, loading, onClose }) => {
    const modalConfig = {
        revenue: { title: 'Most Sold Items (Revenue Breakdown)', icon: <HiCurrencyRupee />, color: 'text-emerald-500' },
        users: { title: 'Deep User Insights', icon: <HiUsers />, color: 'text-blue-500' },
        sales: { title: 'Orders & Sales Tracking', icon: <HiShoppingBag />, color: 'text-amber-500' },
        assets: { title: 'Inventory Analytics', icon: <HiOutlineLightningBolt />, color: 'text-purple-500' },
    };

    const config = modalConfig[type];

    // Calculate product sales from explicit orders instead of p.sales
    const productSales = useMemo(() => {
        const pMap = {};
        orders.forEach(o => {
            if (o.status === 'Cancelled') return;
            o.items?.forEach(i => {
                if (!pMap[i.suitId]) {
                    pMap[i.suitId] = { id: i.suitId, title: i.title, price: i.price, sold: 0, revenue: 0 };
                }
                pMap[i.suitId].sold += (parseInt(i.quantity) || 1);
                pMap[i.suitId].revenue += (parseFloat(i.price) * (parseInt(i.quantity) || 1));
            });
        });
        const arr = Object.values(pMap).sort((a,b) => b.sold - a.sold);
        return arr;
    }, [orders]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col scale-in-center">
                <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                    <div className="flex items-center gap-4">
                        <div className={`text-3xl ${config.color}`}>{config.icon}</div>
                        <div>
                            <h2 className="text-2xl font-black text-primary uppercase tracking-tight">{config.title}</h2>
                            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Operational Truth & Real Data</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all shadow-sm">
                        <HiX size={20} />
                    </button>
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar">
                    {type === 'revenue' || type === 'sales' ? (
                        <div className="space-y-6">
                            <h3 className="text-sm font-black uppercase text-stone-500 tracking-widest">Most Sold Items</h3>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-stone-100">
                                        <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Product</th>
                                        <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Avg Price</th>
                                        <th className="pb-4 text-[10px] font-black uppercase text-stone-400">Units Sold</th>
                                        <th className="pb-4 text-[10px] font-black uppercase text-stone-400 text-right">Total Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-50">
                                    {productSales.map(p => (
                                        <tr key={p.id} className="group">
                                            <td className="py-4 font-bold text-sm text-primary">{p.title}</td>
                                            <td className="py-4 text-xs font-bold text-stone-500">{formatCurrency(p.price)}</td>
                                            <td className="py-4 text-xs font-black text-primary">{p.sold}</td>
                                            <td className="py-4 text-right font-black text-sm text-primary">{formatCurrency(p.revenue)}</td>
                                        </tr>
                                    ))}
                                    {productSales.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="py-10 text-center text-xs font-bold text-stone-400">No sales recorded yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            {type === 'sales' && (
                                <div className="mt-8 pt-8 border-t border-stone-100">
                                    <h3 className="text-sm font-black uppercase text-stone-500 tracking-widest mb-4">Latest Orders Preview</h3>
                                    <div className="space-y-4">
                                        {orders.slice(0, 10).map(o => (
                                            <div key={o.orderId} className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
                                                <div>
                                                    <p className="text-xs font-bold text-primary">{o.orderId}</p>
                                                    <p className="text-[10px] text-stone-500">{formatDate(o.created_at)} • {o.items?.length || 0} items</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-primary">{formatCurrency(o.total)}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">{o.status || 'Success'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : type === 'users' ? (
                        <div className="space-y-6">
                           <div className="grid grid-cols-3 gap-4">
                               <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">Total Users</p>
                                    <p className="text-3xl font-black text-primary">{stats.totalUsers}</p>
                               </div>
                               <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100">
                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Repeated Buyers</p>
                                    <p className="text-3xl font-black text-blue-600">{stats.repeatedUsers}</p>
                               </div>
                               <div className="bg-emerald-50/30 p-6 rounded-3xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total LTV</p>
                                    <p className="text-2xl font-black text-emerald-600">₹{stats.estimatedRevenue}</p>
                               </div>
                           </div>
                           
                           <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Detailed User Directory</h4>
                           <div className="overflow-x-auto rounded-[2rem] border border-stone-100 shadow-sm">
                                <table className="w-full text-left bg-white">
                                    <thead className="bg-stone-50 border-b border-stone-100">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400">User Profile</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400">Contact / Address</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400">Orders</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400">Last Active</th>
                                            <th className="px-6 py-4 text-[10px] font-black uppercase text-stone-400 text-right">Revenue Gen.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-50">
                                        {loading ? (
                                            <tr><td colSpan="5" className="py-10 text-center text-[10px] font-bold text-stone-400 uppercase animate-pulse">Loading live data...</td></tr>
                                        ) : users.map(u => (
                                            <tr key={u.user_id || u.email} className="hover:bg-stone-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 shrink-0 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white uppercase">{u.name?.charAt(0) || u.email?.charAt(0) || 'U'}</div>
                                                        <div>
                                                            <p className="text-xs font-bold text-primary">{u.name || 'N/A'}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {u.isRepeated && <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded text-[8px] font-black uppercase">Repeated</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-[10px] text-stone-600 font-bold max-w-[150px] truncate" title={u.email}>{u.email}</p>
                                                    <p className="text-[9px] text-stone-400 font-bold uppercase mt-1">{u.phone}</p>
                                                    <p className="text-[9px] text-stone-400 truncate max-w-[150px]" title={u.addressStr}>{u.addressStr}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <HiShoppingBag className="text-stone-300" />
                                                        <span className="text-xs font-black text-primary">{u.totalOrders}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <p className="text-[9px] text-stone-400 uppercase"><span className="font-bold">Last:</span> {formatDate(u.lastOrderDate)}</p>
                                                        <p className="text-[9px] text-stone-400 uppercase"><span className="font-bold">Joined:</span> {formatDate(u.created)}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <p className="text-sm font-black text-emerald-600">{formatCurrency(u.revenueGenerated)}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
                    <button className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-accent shadow-xl shadow-primary/20"><HiExternalLink /> Export Dashboard Data</button>
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
                <span className="text-xl font-black text-primary tracking-tight truncate max-w-[120px]">{value}</span>
                <span className={`flex items-center text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full uppercase`}>
                    {change}
                </span>
            </div>
        </div>
    </div>
);

export default AnalyticsTerminal;
