import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiCheckCircle, HiClock, HiRefresh, HiSearch, HiShoppingBag, HiTruck, HiXCircle } from 'react-icons/hi';
import { trackGuestOrder } from '../api/products';
import { formatPrice } from '../utils/currency';
import { getGuestOrderReferences, saveGuestOrderReference } from '../utils/guestOrders';

const STATUS_STEPS = ['Awaiting Confirmation', 'Confirmed', 'Shipped', 'Delivered'];

const normalizeOrderId = (value) => {
  const cleaned = value.trim().toUpperCase();
  return cleaned && !cleaned.startsWith('#') ? `#${cleaned}` : cleaned;
};

const StatusProgress = ({ status }) => {
  if (status === 'Cancelled') {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">
        <HiXCircle size={20} /> This order was cancelled.
      </div>
    );
  }

  const activeIndex = Math.max(0, STATUS_STEPS.indexOf(status));
  return (
    <div className="grid grid-cols-4 gap-1" aria-label={`Order status: ${status}`}>
      {STATUS_STEPS.map((step, index) => (
        <div key={step} className="text-center">
          <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${index <= activeIndex ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`}>
            {index < activeIndex ? <HiCheckCircle size={18} /> : index + 1}
          </div>
          <p className={`mt-2 text-[10px] font-bold leading-tight ${index <= activeIndex ? 'text-emerald-700' : 'text-stone-400'}`}>{step}</p>
        </div>
      ))}
    </div>
  );
};

const OrderCard = ({ order }) => (
  <article className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
    <div className="flex flex-col gap-3 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="text-xs font-bold text-stone-500">Order ID</p>
        <h2 className="mt-1 break-all text-base font-black text-primary">{order.orderId}</h2>
        <p className="mt-1 text-xs text-stone-500">Placed {new Date(order.created_at).toLocaleString()}</p>
      </div>
      <span className="self-start rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">{order.status}</span>
    </div>

    <div className="py-6">
      <StatusProgress status={order.status} />
    </div>

    <div className="space-y-3 border-t border-stone-100 pt-5">
      {order.items?.map((item, index) => (
        <div key={`${item.suitId}-${index}`} className="flex items-center gap-3">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">
            {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-primary">{item.title}</p>
            <p className="text-xs text-stone-500">Quantity: {item.quantity || 1}{item.selectedColor ? ` • ${item.selectedColor}` : ''}</p>
          </div>
          <p className="text-sm font-black text-primary">{formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}</p>
        </div>
      ))}
    </div>

    <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
      <div>
        <p className="text-xs font-bold text-stone-500">Delivery area</p>
        <p className="mt-1 font-semibold text-primary">{[order.delivery?.area, order.delivery?.city, order.delivery?.state, order.delivery?.pincode].filter(Boolean).join(', ')}</p>
      </div>
      <div className="sm:text-right">
        <p className="text-xs font-bold text-stone-500">Order total</p>
        <p className="mt-1 text-lg font-black text-primary">{formatPrice(order.total)}</p>
      </div>
    </div>
  </article>
);

const TrackOrder = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [form, setForm] = useState({ orderId: '', phone: '' });
  const [error, setError] = useState('');

  const loadSavedOrders = useCallback(async (showLoader = false) => {
    const references = getGuestOrderReferences();
    if (showLoader) setLoading(true); else setRefreshing(true);
    try {
      const results = await Promise.allSettled(references.map(reference => trackGuestOrder(reference)));
      setOrders(results.filter(result => result.status === 'fulfilled').map(result => result.value).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSavedOrders(true);
    const interval = setInterval(() => loadSavedOrders(false), 30000);
    return () => clearInterval(interval);
  }, [loadSavedOrders]);

  const handleLookup = async (event) => {
    event.preventDefault();
    setError('');
    setRefreshing(true);
    try {
      const orderId = normalizeOrderId(form.orderId);
      const phone = form.phone.replace(/\D/g, '').slice(-10);
      if (!orderId || !/^\d{10}$/.test(phone)) throw new Error('Enter your order ID and 10-digit mobile number.');
      const order = await trackGuestOrder({ orderId, phone });
      saveGuestOrderReference({ orderId, phone, createdAt: order.created_at });
      setOrders(current => [order, ...current.filter(item => item.orderId !== order.orderId)]);
      setForm({ orderId: '', phone: '' });
    } catch (lookupError) {
      setError(lookupError.response?.data?.message || lookupError.message || 'Order not found. Check the details and try again.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white"><HiShoppingBag size={28} /></div>
          <h1 className="font-serif text-3xl text-primary sm:text-4xl">Track Your Order</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600">No account is needed. Orders placed on this device appear automatically and refresh every 30 seconds.</p>
        </div>

        <form onSubmit={handleLookup} className="mb-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="text-lg font-black text-primary">Find an order from another device</h2>
          <p className="mt-1 text-sm text-stone-500">Use the order ID shown after checkout and the same mobile number used for delivery.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
            <input value={form.orderId} onChange={event => setForm({ ...form, orderId: event.target.value })} placeholder="#ORD-..." aria-label="Order ID" className="min-h-12 rounded-xl border border-stone-300 px-4 text-sm outline-none focus:border-primary" />
            <input type="tel" inputMode="numeric" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="10-digit mobile number" aria-label="Mobile number" className="min-h-12 rounded-xl border border-stone-300 px-4 text-sm outline-none focus:border-primary" />
            <button disabled={refreshing} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white disabled:opacity-60"><HiSearch size={18} /> Find Order</button>
          </div>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </form>

        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-primary">Your Order History</h2>
            <p className="text-xs text-stone-500">Saved privately on this device</p>
          </div>
          <button onClick={() => loadSavedOrders(false)} disabled={refreshing} className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-primary disabled:opacity-50"><HiRefresh className={refreshing ? 'animate-spin' : ''} /> Refresh</button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-stone-500"><HiClock className="mx-auto mb-3 animate-pulse text-3xl" />Loading your orders...</div>
        ) : orders.length > 0 ? (
          <div className="space-y-5">{orders.map(order => <OrderCard key={order.orderId} order={order} />)}</div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white py-14 text-center">
            <HiShoppingBag className="mx-auto mb-4 text-4xl text-stone-300" />
            <h3 className="text-lg font-bold text-primary">No orders saved on this device</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">Place an order, or use the form above if you already have an order ID.</p>
            <Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">Browse Products</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrder;
