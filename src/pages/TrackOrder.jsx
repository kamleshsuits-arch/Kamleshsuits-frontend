import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCash, HiCheckCircle, HiClock, HiCreditCard, HiRefresh,
  HiSearch, HiShoppingBag, HiTruck, HiXCircle,
} from 'react-icons/hi';
import { fetchOrdersByPhone, trackGuestOrder } from '../api/products';
import { formatPrice } from '../utils/currency';
import { getGuestOrderReferences, saveGuestOrderReference } from '../utils/guestOrders';

const ORDER_STATUS_INDEX = {
  'Awaiting Confirmation': 0,
  Pending: 0,
  Confirmed: 1,
  Shipped: 2,
  Delivered: 3,
};

const normalizePaymentStatus = status => ['Not Requested', 'Cash on Delivery'].includes(status) ? 'Unpaid' : status || 'Unpaid';
const paymentIsComplete = status => normalizePaymentStatus(status) === 'Paid';
const formatPaymentMethod = method => ({
  cod: 'Cash on Delivery', cash: 'Cash', upi: 'UPI', phonepe: 'PhonePe',
  upi_after_confirmation: 'UPI after confirmation', bank_transfer: 'Bank transfer',
  card: 'Card', other: 'Other',
}[method] || method || 'Not selected');

const OrderProgress = ({ order }) => {
  if (order.status === 'Cancelled') return <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"><HiXCircle size={20} /> This order was cancelled.</div>;

  const statusIndex = ORDER_STATUS_INDEX[order.status] ?? 0;
  const paid = paymentIsComplete(order.paymentStatus);
  const steps = [
    { label: 'Requested', complete: true, current: statusIndex === 0 },
    { label: 'Confirmed', complete: statusIndex >= 1, current: statusIndex === 1 && !paid },
    { label: 'Payment', complete: paid, current: statusIndex >= 1 && !paid },
    { label: 'Shipped', complete: statusIndex >= 2, current: statusIndex === 2 },
    { label: 'Delivered', complete: statusIndex >= 3, current: statusIndex === 3 },
  ];

  return <div className="grid grid-cols-5 gap-1" aria-label={`Order status: ${order.status}`}>
    {steps.map((step, index) => <div key={step.label} className="text-center">
      <div className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${step.complete ? 'bg-emerald-600 text-white' : step.current ? 'bg-amber-500 text-white animate-pulse' : 'bg-stone-200 text-stone-500'}`}>{step.complete && index > 0 ? <HiCheckCircle size={17} /> : index + 1}</div>
      <p className={`mt-2 text-[9px] font-bold leading-tight sm:text-[10px] ${step.complete ? 'text-emerald-700' : step.current ? 'text-amber-700' : 'text-stone-400'}`}>{step.label}</p>
    </div>)}
  </div>;
};

const PaymentCard = ({ order }) => {
  const status = normalizePaymentStatus(order.paymentStatus);
  const paid = paymentIsComplete(status);
  return <div className={`rounded-2xl border p-4 ${paid ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
    <div className="flex items-center gap-3">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white ${paid ? 'bg-emerald-600' : 'bg-amber-500'}`}>{paid ? <HiCheckCircle size={21} /> : <HiCreditCard size={20} />}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-stone-500">Payment</p>
        <p className={`font-black ${paid ? 'text-emerald-800' : 'text-amber-800'}`}>{status}</p>
        <p className="text-xs text-stone-600">Method: {formatPaymentMethod(order.paymentMethod)}</p>
      </div>
      {order.paid_at && <p className="hidden text-right text-[10px] text-stone-500 sm:block">Paid<br />{new Date(order.paid_at).toLocaleString('en-IN')}</p>}
    </div>
  </div>;
};

const OrderCard = ({ order }) => <article className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-7">
  <div className="flex flex-col gap-3 border-b border-stone-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
    <div><p className="text-xs font-bold text-stone-500">Order ID</p><h2 className="mt-1 break-all text-base font-black text-primary">{order.orderId}</h2><p className="mt-1 text-xs text-stone-500">Placed {new Date(order.created_at).toLocaleString('en-IN')}</p></div>
    <span className="self-start rounded-full bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800">{order.status}</span>
  </div>
  <div className="py-6"><OrderProgress order={order} /></div>
  <PaymentCard order={order} />
  <div className="mt-5 space-y-3 border-t border-stone-100 pt-5">
    {order.items?.map((item, index) => <div key={`${item.suitId}-${index}`} className="flex items-center gap-3">
      <div className="h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-stone-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-primary">{item.title}</p><p className="text-xs text-stone-500">Quantity: {item.quantity || 1}{item.selectedColor ? ` • ${item.selectedColor}` : ''}</p></div>
      <p className="text-sm font-black text-primary">{formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}</p>
    </div>)}
  </div>
  <div className="mt-5 grid gap-3 rounded-2xl bg-stone-50 p-4 text-sm sm:grid-cols-2">
    <div><p className="text-xs font-bold text-stone-500">Delivery area</p><p className="mt-1 font-semibold text-primary">{[order.delivery?.area, order.delivery?.city, order.delivery?.state, order.delivery?.pincode].filter(Boolean).join(', ')}</p></div>
    <div className="sm:text-right"><p className="text-xs font-bold text-stone-500">Order total</p><p className="mt-1 text-lg font-black text-primary">{formatPrice(order.total)}</p></div>
  </div>
</article>;

const TrackOrder = () => {
  const [savedOrders, setSavedOrders] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [phone, setPhone] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const loadSavedOrders = useCallback(async () => {
    const references = getGuestOrderReferences();
    try {
      const results = await Promise.allSettled(references.map(reference => trackGuestOrder(reference)));
      setSavedOrders(results.filter(result => result.status === 'fulfilled').map(result => result.value).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadSavedOrders();
    const interval = setInterval(loadSavedOrders, 30000);
    return () => clearInterval(interval);
  }, [loadSavedOrders]);

  const handlePhoneLookup = async event => {
    event.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    setError('');
    setSelectedOrder(null);
    setMatches([]);
    if (!/^\d{10}$/.test(cleanPhone)) { setError('Enter the 10-digit mobile number used for delivery.'); return; }
    try {
      setSearching(true);
      const results = await fetchOrdersByPhone(cleanPhone);
      setMatches(results || []);
      setLookupPhone(cleanPhone);
      if (!results?.length) setError('No orders were found for this mobile number.');
    } catch (lookupError) {
      setError(lookupError.response?.data?.message || 'Could not find orders. Please try again.');
    } finally { setSearching(false); }
  };

  const selectOrder = async summary => {
    try {
      setSearching(true);
      setError('');
      const order = await trackGuestOrder({ orderId: summary.orderId, phone: lookupPhone });
      saveGuestOrderReference({ orderId: order.orderId, phone: lookupPhone, createdAt: order.created_at });
      setSelectedOrder(order);
      setSavedOrders(current => [order, ...current.filter(item => item.orderId !== order.orderId)]);
    } catch (lookupError) {
      setError(lookupError.response?.data?.message || 'Could not load this order.');
    } finally { setSearching(false); }
  };

  return <div className="min-h-screen bg-stone-50 px-3 py-8 sm:px-4 sm:py-12"><div className="mx-auto max-w-4xl">
    <div className="mb-8 text-center"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white"><HiShoppingBag size={28} /></div><h1 className="font-serif text-3xl text-primary sm:text-4xl">Track Your Order</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-stone-600">Enter the mobile number used at checkout, then choose your order by number, date and time.</p></div>

    <form onSubmit={handlePhoneLookup} className="mb-6 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-7">
      <h2 className="text-lg font-black text-primary">Find your orders</h2><p className="mt-1 text-sm text-stone-500">We only show orders matching your exact 10-digit delivery number.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><input type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" aria-label="Mobile number" className="min-h-12 min-w-0 rounded-xl border border-stone-300 px-4 text-sm outline-none focus:border-primary" /><button disabled={searching} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-white disabled:opacity-60"><HiSearch size={18} /> {searching ? 'Searching…' : 'Find Orders'}</button></div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </form>

    {matches.length > 0 && <section className="mb-7 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6"><h2 className="font-black text-primary">Select an order</h2><p className="mt-1 text-xs text-stone-500">{matches.length} order{matches.length === 1 ? '' : 's'} found</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{matches.map(summary => <button key={summary.orderId} onClick={() => selectOrder(summary)} disabled={searching} className={`rounded-2xl border p-4 text-left transition hover:border-primary hover:bg-stone-50 disabled:opacity-60 ${selectedOrder?.orderId === summary.orderId ? 'border-primary bg-stone-50 ring-2 ring-primary/10' : 'border-stone-200'}`}><span className="block break-all text-sm font-black text-primary">{summary.orderId}</span><span className="mt-2 block text-xs font-semibold text-stone-600">{new Date(summary.created_at).toLocaleString('en-IN')}</span><span className="mt-2 flex items-center justify-between text-xs"><span className="rounded-full bg-amber-50 px-2 py-1 font-bold text-amber-700">{summary.status}</span><strong className="text-primary">{formatPrice(summary.total)}</strong></span></button>)}</div></section>}

    {selectedOrder && <div className="mb-8"><OrderCard order={selectedOrder} /></div>}

    <div className="mb-5 flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between"><div><h2 className="text-xl font-black text-primary">Saved on this device</h2><p className="text-xs text-stone-500">These orders refresh automatically every 30 seconds.</p></div><button onClick={loadSavedOrders} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-bold text-primary"><HiRefresh /> Refresh</button></div>
    {loading ? <div className="py-16 text-center text-stone-500"><HiClock className="mx-auto mb-3 animate-pulse text-3xl" />Loading saved orders…</div> : savedOrders.length > 0 ? <div className="space-y-5">{savedOrders.filter(order => order.orderId !== selectedOrder?.orderId).map(order => <OrderCard key={order.orderId} order={order} />)}</div> : !selectedOrder && <div className="rounded-3xl border border-dashed border-stone-300 bg-white py-14 text-center"><HiShoppingBag className="mx-auto mb-4 text-4xl text-stone-300" /><h3 className="text-lg font-bold text-primary">No orders saved on this device</h3><p className="mx-auto mt-2 max-w-md px-4 text-sm text-stone-500">Enter your mobile number above or place a new order.</p><Link to="/" className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">Browse Products</Link></div>}
  </div></div>;
};

export default TrackOrder;
