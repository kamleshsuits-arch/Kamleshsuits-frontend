
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
        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${styles[status] || styles['Pending']}`}>
            {status}
        </span>
    );
};

const normalizePaymentStatus = status => {
    if (!status || ['Not Requested', 'Cash on Delivery'].includes(status)) return 'Unpaid';
    return ['Unpaid', 'Pending', 'Paid', 'Refunded'].includes(status) ? status : 'Unpaid';
};

const normalizePaymentMethod = method => {
    if (method === 'upi_after_confirmation') return 'upi';
    return ['cod', 'cash', 'upi', 'phonepe', 'bank_transfer', 'card', 'other'].includes(method) ? method : 'cod';
};

const paymentMethodLabel = method => ({
    cod: 'Cash on Delivery',
    cash: 'Cash',
    upi: 'UPI',
    phonepe: 'PhonePe',
    bank_transfer: 'Bank Transfer',
    card: 'Card',
    other: 'Other',
}[normalizePaymentMethod(method)]);

const OrderManager = ({ showToast, onPendingCountChange, taxonomy = [] }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [paymentDrafts, setPaymentDrafts] = useState({});

    const loadOrders = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const data = await fetchAllOrders();
            // Sort by Date DESC
            const sortedOrders = (data || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setOrders(sortedOrders);
            setPaymentDrafts(current => {
                const next = { ...current };
                sortedOrders.forEach(order => {
                    if (!next[order.orderId]) {
                        next[order.orderId] = {
                            status: normalizePaymentStatus(order.paymentStatus),
                            method: normalizePaymentMethod(order.paymentMethod),
                        };
                    }
                });
                return next;
            });
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
        if (status === 'Confirmed' && !window.confirm('Confirm that you called the customer and they approved this order.')) return;
        if (status === 'Cancelled' && !window.confirm('Cancel this order after speaking with the customer?')) return;

        try {
            setUpdatingOrder(order.orderId);
            const paymentStatus = normalizePaymentStatus(order.paymentStatus);
            const paymentMethod = normalizePaymentMethod(order.paymentMethod);
            const updated = await updateOrderStatus(order.orderId, status, paymentStatus, paymentMethod);
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

    const handlePaymentUpdate = async order => {
        const draft = paymentDrafts[order.orderId] || {
            status: normalizePaymentStatus(order.paymentStatus),
            method: normalizePaymentMethod(order.paymentMethod),
        };
        try {
            setUpdatingOrder(order.orderId);
            const updated = await updateOrderStatus(order.orderId, order.status, draft.status, draft.method);
            setOrders(current => current.map(item => item.orderId === order.orderId ? { ...item, ...updated } : item));
            setPaymentDrafts(current => ({
                ...current,
                [order.orderId]: { status: draft.status, method: draft.method },
            }));
            if (showToast) showToast(`Payment marked ${draft.status} via ${paymentMethodLabel(draft.method)}.`, null, 'success');
        } catch (error) {
            console.error('Failed to update payment:', error);
            if (showToast) showToast('Could not update payment. Please try again.', null, 'error');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const downloadOrderSlip = (order) => {
        const lines = [
            'KAMLESH SUITS — ORDER SLIP',
            `Order: ${order.orderId}`,
            `Date: ${new Date(order.created_at).toLocaleString('en-IN')}`,
            `Customer: ${order.user_name || 'Customer'} | ${order.user_phone || ''}`,
            `Delivery: ${[order.address?.houseNo, order.address?.area, order.address?.city, order.address?.state, order.address?.pincode].filter(Boolean).join(', ')}`,
            '',
            ...(order.items || []).map(item => `${item.title} | Qty ${item.quantity || 1} | ${formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}`),
            '',
            `Total: ${formatPrice(order.total)}`,
            `Payment: ${paymentMethodLabel(order.paymentMethod)} (${normalizePaymentStatus(order.paymentStatus)})`,
            `Status: ${order.status}`,
        ];
        const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `${String(order.orderId).replace(/[^a-z0-9-]/gi, '_')}-slip.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const filteredOrders = orders.filter(order => {
        const search = searchTerm.toLowerCase();
        const matchesSearch = (
            order.orderId?.toLowerCase().includes(search) ||
            order.user_name?.toLowerCase().includes(search) ||
            order.user_email?.toLowerCase().includes(search) ||
            order.user_phone?.toLowerCase().includes(search) ||
            order.items?.some(item => item.title?.toLowerCase().includes(search))
        );
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || order.items?.some(item => (item.product_category || 'suits') === categoryFilter);
        return matchesSearch && matchesStatus && matchesCategory;
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
                <StatCard label="Total Revenue" value={formatPrice(orders.filter(o => o.status !== 'Cancelled').reduce((acc, o) => acc + Number(o.total || 0), 0))} icon={<HiTrendingUp />} color="bg-primary" />
                <StatCard label="Active Orders" value={orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length} icon={<HiCube />} color="bg-accent" />
                <StatCard label="Awaiting Confirmation" value={orders.filter(o => ['Awaiting Confirmation', 'Pending'].includes(o.status)).length} icon={<HiClock />} color="bg-orange-500" />
                <StatCard label="Total Reach" value={new Set(orders.map(o => o.user_id || o.user_email || o.user_phone || o.orderId)).size} icon={<HiUsers />} color="bg-emerald-500" />
            </div>

            {/* Header & Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-xl font-black text-primary uppercase tracking-tight">Order Management</h2>
                    <p className="text-sm font-medium text-stone-600">View customer details and update each order status</p>
                </div>
                
                <div className="flex w-full flex-wrap gap-3 md:w-auto">
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
                    <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="admin-filter-select">
                        <option>All</option><option>Awaiting Confirmation</option><option>Confirmed</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                    </select>
                    <select value={categoryFilter} onChange={event => setCategoryFilter(event.target.value)} className="admin-filter-select">
                        <option value="all">All categories</option>
                        {taxonomy.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
                    </select>
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
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Order ID & Date</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Customer</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Order Total</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Payment</th>
                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Status</th>
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
                                                <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{paymentMethodLabel(order.paymentMethod)}</span>
                                            </div>
                                            <p className="text-[9px] text-stone-400 mt-1">{normalizePaymentStatus(order.paymentStatus)}</p>
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
                                                            <h4 className="text-sm font-bold">Delivery Address</h4>
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
                                                                <h4 className="text-sm font-bold">Ordered Items ({order.items?.length})</h4>
                                                            </div>
                                                            <button onClick={() => downloadOrderSlip(order)} className="flex items-center gap-2 text-[9px] font-black text-stone-400 uppercase tracking-widest hover:text-primary transition-colors">
                                                                <HiPrinter size={16} /> Download slip
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
                                                                                    <span className="text-[8px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded uppercase">{taxonomy.find(category => category.id === (item.product_category || 'suits'))?.label || 'Suits'}</span>
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
                                                            <div className="border-t border-stone-100 bg-white p-5">
                                                                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                                                    <div>
                                                                        <p className="text-sm font-black text-primary">Payment Management</p>
                                                                        <p className="text-[11px] text-stone-500">Admin can record payment independently from order confirmation.</p>
                                                                    </div>
                                                                    {order.paid_at && <p className="text-[10px] font-bold text-emerald-700">Paid {new Date(order.paid_at).toLocaleString('en-IN')}</p>}
                                                                </div>
                                                                <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                                                                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                                                                        Payment status
                                                                        <select
                                                                            value={paymentDrafts[order.orderId]?.status || normalizePaymentStatus(order.paymentStatus)}
                                                                            onChange={event => setPaymentDrafts(current => ({ ...current, [order.orderId]: { ...(current[order.orderId] || {}), status: event.target.value, method: current[order.orderId]?.method || normalizePaymentMethod(order.paymentMethod) } }))}
                                                                            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold normal-case tracking-normal text-primary outline-none focus:border-accent"
                                                                        >
                                                                            <option value="Unpaid">Unpaid</option>
                                                                            <option value="Pending">Pending</option>
                                                                            <option value="Paid">Paid</option>
                                                                            <option value="Refunded">Refunded</option>
                                                                        </select>
                                                                    </label>
                                                                    <label className="text-[10px] font-black uppercase tracking-wider text-stone-500">
                                                                        Paid via / method
                                                                        <select
                                                                            value={paymentDrafts[order.orderId]?.method || normalizePaymentMethod(order.paymentMethod)}
                                                                            onChange={event => setPaymentDrafts(current => ({ ...current, [order.orderId]: { ...(current[order.orderId] || {}), method: event.target.value, status: current[order.orderId]?.status || normalizePaymentStatus(order.paymentStatus) } }))}
                                                                            className="mt-2 min-h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold normal-case tracking-normal text-primary outline-none focus:border-accent"
                                                                        >
                                                                            <option value="cod">Cash on Delivery</option>
                                                                            <option value="cash">Cash</option>
                                                                            <option value="upi">UPI</option>
                                                                            <option value="phonepe">PhonePe</option>
                                                                            <option value="bank_transfer">Bank Transfer</option>
                                                                            <option value="card">Card</option>
                                                                            <option value="other">Other</option>
                                                                        </select>
                                                                    </label>
                                                                    <button
                                                                        disabled={updatingOrder === order.orderId}
                                                                        onClick={() => handlePaymentUpdate(order)}
                                                                        className="min-h-11 self-end rounded-xl bg-accent px-5 text-xs font-black text-white shadow-lg disabled:opacity-50"
                                                                    >
                                                                        Save Payment
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="bg-stone-50/50 p-6 flex justify-between items-center border-t border-stone-100">
                                                                <div>
                                                                    <p className="text-xs font-bold text-stone-500 mb-1">Order Total</p>
                                                                    <p className="text-lg font-black text-primary">{formatPrice(order.total)}</p>
                                                                </div>
                                                                <div className="flex flex-wrap justify-end gap-3">
                                                                    <button
                                                                        disabled={updatingOrder === order.orderId || ['Delivered', 'Cancelled'].includes(order.status)}
                                                                        onClick={() => handleStatusUpdate(order, 'Cancelled')}
                                                                        className="min-h-11 bg-white text-stone-600 border border-stone-300 px-5 py-2.5 rounded-xl font-bold text-sm hover:text-red-600 hover:border-red-200 transition-all disabled:opacity-40"
                                                                    >Cancel Order</button>
                                                                    {['Awaiting Confirmation', 'Pending'].includes(order.status) ? (
                                                                        <button
                                                                            disabled={updatingOrder === order.orderId}
                                                                            onClick={() => handleStatusUpdate(order, 'Confirmed')}
                                                                            className="min-h-11 bg-emerald-600 text-white border border-emerald-600 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 flex items-center gap-2"
                                                                        >
                                                                            <HiCheckCircle size={14} /> Confirm Order After Call
                                                                        </button>
                                                                    ) : order.status === 'Confirmed' ? (
                                                                        <button
                                                                            disabled={updatingOrder === order.orderId}
                                                                            onClick={() => handleStatusUpdate(order, 'Shipped')}
                                                                            className="min-h-11 bg-primary text-white border border-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:bg-accent hover:border-accent transition-all flex items-center gap-2 disabled:opacity-50"
                                                                        >
                                                                            <HiTruck size={14} /> Mark Shipped
                                                                        </button>
                                                                    ) : order.status === 'Shipped' ? (
                                                                        <button
                                                                            disabled={updatingOrder === order.orderId}
                                                                            onClick={() => handleStatusUpdate(order, 'Delivered')}
                                                                            className="min-h-11 bg-emerald-700 text-white border border-emerald-700 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                                                                        >
                                                                            <HiCheckCircle size={16} /> Mark Delivered
                                                                        </button>
                                                                    ) : (
                                                                        <span className="flex min-h-11 items-center rounded-xl bg-stone-100 px-5 text-sm font-bold text-stone-600">
                                                                            No further action needed
                                                                        </span>
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
                                        <p className="text-sm font-bold text-stone-500">No matching orders found.</p>
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
