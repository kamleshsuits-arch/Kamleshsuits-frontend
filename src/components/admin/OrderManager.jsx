
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllOrders, updateOrderStatus } from '../../api/products';
import { 
    HiTrendingUp, HiUsers, HiCube, HiRefresh, HiSearch, 
    HiChevronDown, HiChevronUp, HiOfficeBuilding, HiTruck,
    HiClock, HiCheckCircle, HiExclamationCircle, HiPrinter, HiCollection, HiPhone
} from 'react-icons/hi';
import { formatPrice } from '../../utils/currency';

const OrderStatusPill = ({ status }) => {
    const styles = {
        'Awaiting Confirmation': 'bg-amber-50 text-amber-700 border-amber-200',
        'Confirmed': 'bg-violet-50 text-violet-700 border-violet-200',
        'Pending': 'bg-orange-50 text-orange-600 border-orange-200',
        'Shipped': 'bg-blue-50 text-blue-600 border-blue-200',
        'Delivered': 'bg-emerald-50 text-emerald-600 border-emerald-200',
        'Cancelled': 'bg-red-50 text-red-600 border-red-200'
    };
    
    return (
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${styles[status] || styles['Pending']}`}>
            {status}
        </span>
    );
};

const OrderManager = ({ showToast, onPendingCountChange }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(null);

    const loadOrders = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const data = await fetchAllOrders();
            // Sort by Date DESC
            const sortedOrders = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setOrders(sortedOrders);
            onPendingCountChange?.(sortedOrders.filter(order => ['Awaiting Confirmation', 'Pending'].includes(order.status)).length);
        } catch (error) {
            console.error('Failed to load orders:', error);
            if (showLoader && showToast) showToast('Failed to load order stream.', null, 'error');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [onPendingCountChange, showToast]);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(() => loadOrders(false), 15000);
        const handleFocus = () => loadOrders(false);
        window.addEventListener('focus', handleFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, [loadOrders]);

    const handleStatusUpdate = async (order, status) => {
        try {
            setUpdatingOrder(order.orderId);
            const paymentStatus = status === 'Confirmed'
                ? (order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Pending')
                : order.paymentStatus;
            const updated = await updateOrderStatus(order.orderId, status, paymentStatus);
            setOrders(current => current.map(item => item.orderId === order.orderId ? { ...item, ...updated } : item));
            if (['Awaiting Confirmation', 'Pending'].includes(order.status) && !['Awaiting Confirmation', 'Pending'].includes(status)) {
                onPendingCountChange?.(Math.max(0, orders.filter(item => ['Awaiting Confirmation', 'Pending'].includes(item.status)).length - 1));
            }
            if (showToast) showToast(`Order marked ${status}.`, null, 'success');
        } catch (error) {
            console.error('Failed to update order:', error);
            if (showToast) showToast('Could not update order. Please try again.', null, 'error');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const search = searchTerm.toLowerCase();
        return (
            order.orderId?.toLowerCase().includes(search) ||
            order.user_name?.toLowerCase().includes(search) ||
            order.user_email?.toLowerCase().includes(search) ||
            order.user_phone?.toLowerCase().includes(search)
        );
    });

    const StatCard = ({ label, value, icon, color }) => (
        <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-sm flex items-center gap-6 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
            <div className={`w-14 h-14 ${color} text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                {React.cloneElement(icon, { size: 24 })}
            </div>
            <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-1">{label}</p>
                <p className="text-2xl font-black text-primary">{value}</p>
            </div>
            <div className="absolute top-0 right-0 p-8 text-stone-50 opacity-0 group-hover:opacity-100 transition-opacity">
                {React.cloneElement(icon, { size: 48 })}
            </div>
        </div>
    );

    if (loading) return (
        <div className="flex justify-center py-20 animate-pulse">
            <div className="text-center">
                <HiRefresh className="mx-auto text-4xl text-accent animate-spin mb-4" />
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Synchronizing Order Stream...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {orders.some(order => ['Awaiting Confirmation', 'Pending'].includes(order.status)) && (
                <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white animate-pulse">
                            <HiPhone size={21} />
                        </span>
                        <div>
                            <p className="text-sm font-black text-amber-900">Customers are waiting for your confirmation call</p>
                            <p className="text-xs text-amber-700">Call each customer, verify the order, then press “Confirm Order After Call.”</p>
                        </div>
                    </div>
                    <span className="rounded-full bg-amber-200 px-4 py-2 text-xs font-black uppercase tracking-wider text-amber-900">
                        {orders.filter(order => ['Awaiting Confirmation', 'Pending'].includes(order.status)).length} waiting
                    </span>
                </div>
            )}
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Revenue" value={formatPrice(orders.reduce((acc, o) => acc + o.total, 0))} icon={<HiTrendingUp />} color="bg-primary" />
                <StatCard label="Active Orders" value={orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} icon={<HiCube />} color="bg-accent" />
                <StatCard label="Awaiting Confirmation" value={orders.filter(o => ['Awaiting Confirmation', 'Pending'].includes(o.status)).length} icon={<HiClock />} color="bg-orange-500" />
                <StatCard label="Total Reach" value={new Set(orders.map(o => o.user_id)).size} icon={<HiUsers />} color="bg-emerald-500" />
            </div>

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-xl font-black text-primary uppercase tracking-tight">Order Management</h2>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Global Transaction Ledger</p>
                </div>
                
                <div className="flex w-full gap-3 md:w-auto">
                    <div className="relative flex-1 md:w-96">
                        <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input
                            type="text"
                            placeholder="Search by ID, Customer, Phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-xs font-bold transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => loadOrders(false)}
                        aria-label="Refresh orders"
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-500 hover:text-primary"
                    >
                        <HiRefresh size={18} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-stone-50/80">
                            <tr>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Order & ID</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Customer Details</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Payload Amount</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Method</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Current Phase</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {filteredOrders.map((order) => (
                                <React.Fragment key={order.orderId}>
                                    <tr className={`hover:bg-stone-50/50 transition-colors ${['Awaiting Confirmation', 'Pending'].includes(order.status) ? 'bg-amber-50/50' : ''} ${expandedOrder === order.orderId ? 'shadow-inner' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-primary tracking-tight">{order.orderId}</span>
                                                <span className="text-[9px] text-stone-400 font-bold uppercase tracking-wider">{new Date(order.created_at).toLocaleDateString()} @ {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-black text-primary uppercase">{order.user_name || "Guest Customer"}</span>
                                                <a href={`tel:+91${order.user_phone}`} className="text-[10px] text-blue-700 font-black underline underline-offset-2">{order.user_phone || "No Phone"}</a>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 font-black text-sm text-primary">
                                            {formatPrice(order.total)}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${order.paymentMethod === 'cod' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]' : 'bg-[#5f259f] shadow-[0_0_8px_rgba(95,37,159,0.5)]'}`} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{order.paymentMethod}</span>
                                            </div>
                                            <p className="text-[9px] text-stone-400 mt-1">{order.paymentStatus || 'Not Requested'}</p>
                                        </td>
                                        <td className="px-8 py-5">
                                            <OrderStatusPill status={order.status} />
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button 
                                                onClick={() => setExpandedOrder(expandedOrder === order.orderId ? null : order.orderId)}
                                                className={`p-2 rounded-xl transition-all ${expandedOrder === order.orderId ? 'bg-primary text-white scale-110' : 'text-stone-400 hover:text-primary hover:bg-white border border-transparent hover:border-stone-100'}`}
                                            >
                                                {expandedOrder === order.orderId ? <HiChevronUp size={20} /> : <HiChevronDown size={20} />}
                                            </button>
                                        </td>
                                    </tr>

                                    {/* Expanded Order Detail Phase */}
                                    {expandedOrder === order.orderId && (
                                        <tr>
                                            <td colSpan="6" className="px-10 py-10 bg-white/50 animate-in slide-in-from-top-4 duration-500 border-x border-stone-100/50">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                                    {/* Delivery Intel */}
                                                    <div className="space-y-6">
                                                        <div className="flex items-center gap-2 text-accent">
                                                            <HiOfficeBuilding size={16} />
                                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Courier Dispatch Logic</h4>
                                                        </div>
                                                        <div className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm space-y-3">
                                                            <p className="text-sm font-black text-primary leading-tight">{order.address?.name}</p>
                                                            <p className="text-[11px] text-stone-500 font-medium leading-relaxed">{order.address?.houseNo}, {order.address?.area}</p>
                                                            <p className="text-[11px] text-stone-500 font-medium">{order.address?.landmark && `Ref: ${order.address.landmark}`}</p>
                                                            <p className="text-[11px] font-black text-primary uppercase tracking-widest">{order.address?.city}, {order.address?.state} - {order.address?.pincode}</p>
                                                            <div className="pt-2 flex items-center gap-3">
                                                                <span className="bg-stone-100 text-[8px] font-black text-stone-500 px-3 py-1 rounded-full uppercase tracking-tighter border border-stone-200">TYPE: {order.address?.type || 'Home'}</span>
                                                                <span className="bg-stone-100 text-[8px] font-black text-stone-500 px-3 py-1 rounded-full uppercase tracking-tighter border border-stone-200">VERIFIED</span>
                                                            </div>
                                                            <a
                                                                href={`tel:+91${order.user_phone}`}
                                                                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg"
                                                            >
                                                                <HiPhone size={16} /> Call Customer: {order.user_phone}
                                                            </a>
                                                        </div>
                                                    </div>

                                                    {/* Item Payload */}
                                                    <div className="md:col-span-2 space-y-6">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2 text-accent">
                                                                <HiCollection size={16} />
                                                                <h4 className="text-[10px] font-black uppercase tracking-widest">Inventory Manifest ({order.items?.length})</h4>
                                                            </div>
                                                            <button className="flex items-center gap-2 text-[9px] font-black text-stone-400 uppercase tracking-widest hover:text-primary transition-colors">
                                                                <HiPrinter size={16} /> Generate slip
                                                            </button>
                                                        </div>
                                                        <div className="bg-white rounded-[2rem] border border-stone-100 shadow-sm overflow-hidden">
                                                            <div className="divide-y divide-stone-50">
                                                                {order.items?.map((item, idx) => (
                                                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-stone-50/50 transition-colors">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className="w-12 h-16 bg-stone-100 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                                                                                <img src={item.image} className="w-full h-full object-cover" />
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-xs font-black text-primary uppercase tracking-tight line-clamp-1">{item.title}</p>
                                                                                <div className="flex gap-2 items-center mt-1">
                                                                                    <span className="text-[8px] font-black bg-stone-100 text-stone-500 px-2 py-0.5 rounded uppercase tracking-tighter">QTY: {item.quantity}</span>
                                                                                    {item.selectedColor && (
                                                                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-stone-500 uppercase">
                                                                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.selectedColor.toLowerCase() }} />
                                                                                            {item.selectedColor}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-xs font-black text-primary">{formatPrice(item.price * item.quantity)}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <div className="bg-stone-50/50 p-6 flex justify-between items-center border-t border-stone-100">
                                                                <div>
                                                                    <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mb-1">Total Payload Value</p>
                                                                    <p className="text-lg font-black text-primary">{formatPrice(order.total)}</p>
                                                                </div>
                                                                <div className="flex gap-3">
                                                                    <button
                                                                        disabled={updatingOrder === order.orderId || order.status === 'Cancelled'}
                                                                        onClick={() => handleStatusUpdate(order, 'Cancelled')}
                                                                        className="bg-white text-stone-500 border border-stone-200 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-40"
                                                                    >Cancel Order</button>
                                                                    {['Awaiting Confirmation', 'Pending'].includes(order.status) ? (
                                                                        <button
                                                                            disabled={updatingOrder === order.orderId}
                                                                            onClick={() => handleStatusUpdate(order, 'Confirmed')}
                                                                            className="bg-emerald-600 text-white border border-emerald-600 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl disabled:opacity-50 flex items-center gap-2"
                                                                        >
                                                                            <HiCheckCircle size={14} /> Confirm Order After Call
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            disabled={updatingOrder === order.orderId || ['Shipped', 'Delivered', 'Cancelled'].includes(order.status)}
                                                                            onClick={() => handleStatusUpdate(order, 'Shipped')}
                                                                            className="bg-primary text-white border border-primary px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-accent hover:border-accent transition-all flex items-center gap-2 disabled:opacity-50"
                                                                        >
                                                                            <HiTruck size={14} /> Mark Shipped
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}

                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <HiSearch className="mx-auto text-4xl text-stone-200 mb-4" />
                                        <p className="text-xs font-black text-stone-400 uppercase tracking-widest">No matching transactions found in the ledger.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default OrderManager;
