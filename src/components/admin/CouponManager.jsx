import React, { useState, useEffect } from 'react';
import { 
    HiPlus, HiTrash, HiCheck, HiX, HiTag, HiCalendar, 
    HiCurrencyRupee, HiChatAlt, HiUserGroup, HiSparkles, HiPencil
} from 'react-icons/hi';
import { fetchCoupons, saveCoupon, deleteCoupon } from '../../api/coupons';
import { useAuth } from '../../context/AuthContext';

const CouponManager = ({ showToast }) => {
    const { user } = useAuth();
    const token = user?.token;
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    const [formData, setFormData] = useState({
        code: '',
        discount: '',
        type: 'flat',
        min_purchase: '',
        usage_limit: '',
        expires_at: '',
        description: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await fetchCoupons();
            setCoupons(data);
        } catch (error) {
            console.error('Failed to fetch coupons:', error);
            showToast('System Error: Could not retrieve active coupons.', null, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (coupon) => {
        setFormData({
            code: coupon.code,
            discount: coupon.discount,
            type: coupon.discount_type || 'flat',
            min_purchase: coupon.min_purchase || '',
            usage_limit: coupon.usage_limit || '',
            expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
            description: coupon.description || ''
        });
        setIsEditing(true);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await saveCoupon(formData);
            showToast(`Success: Coupon ${formData.code} ${isEditing ? 'updated' : 'live now'}.`, null, 'success');
            setShowForm(false);
            setIsEditing(false);
            setFormData({ code: '', discount: '', type: 'flat', min_purchase: '', usage_limit: '', expires_at: '', description: '' });
            loadData();
        } catch (error) {
            showToast('Error: ' + error.message, null, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (code) => {
        if (!window.confirm(`Deactivate coupon ${code}?`)) return;
        try {
            await deleteCoupon(code);
            showToast('Success: Coupon purged from system.', null, 'success');
            loadData();
        } catch (error) {
            showToast('Error: Failed to delete coupon.', null, 'error');
        }
    };

    if (loading) return <div className="p-20 text-center text-stone-400 animate-pulse font-black uppercase tracking-widest text-xs">Syncing Coupon Database...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-primary uppercase tracking-tight">Voucher Command Center</h2>
                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-1">Manage dynamic & seasonal rewards</p>
                </div>
                <button 
                    onClick={() => {
                        if (showForm) setIsEditing(false);
                        setShowForm(!showForm);
                        if (!showForm) setFormData({ code: '', discount: '', type: 'flat', min_purchase: '', usage_limit: '', expires_at: '', description: '' });
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all shadow-xl shadow-primary/20"
                >
                    {showForm ? <HiX /> : <HiPlus />} {showForm ? 'Close Terminal' : 'Generate New Code'}
                </button>
            </div>

            {/* Quick Presets */}
            {!showForm && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickPreset 
                        icon={<HiSparkles className="text-amber-500" />} 
                        label="Festival" 
                        onClick={() => { setShowForm(true); setIsEditing(false); setFormData({...formData, description: 'Diwali Festive Special', code: 'DIWALI2025'}); }} 
                    />
                    <QuickPreset 
                        icon={<HiUserGroup className="text-blue-500" />} 
                        label="New User" 
                        onClick={() => { setShowForm(true); setIsEditing(false); setFormData({...formData, description: 'Welcome Gift for New Users', code: 'WELCOME500'}); }} 
                    />
                    <QuickPreset 
                        icon={<HiTag className="text-emerald-500" />} 
                        label="Seasonal" 
                        onClick={() => { setShowForm(true); setIsEditing(false); setFormData({...formData, description: 'Winter Season Clearance', code: 'WINTER20'}); }} 
                    />
                    <QuickPreset 
                        icon={<HiChatAlt className="text-purple-500" />} 
                        label="Loyalty" 
                        onClick={() => { setShowForm(true); setIsEditing(false); setFormData({...formData, description: 'Special reward for repeated user', code: 'MASTER10'}); }} 
                    />
                </div>
            )}

            {/* Creation Form */}
            {showForm && (
                <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-sm animate-in zoom-in-95 duration-300">
                    <div className="mb-8 flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                            {isEditing ? <HiPencil /> : <HiPlus />}
                        </div>
                        <h3 className="text-xl font-black text-primary uppercase">{isEditing ? 'Modify Coupon DNA' : 'Initialize New Voucher'}</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <InputBox 
                                label="Coupon Code" 
                                value={formData.code} 
                                onChange={(v) => setFormData({...formData, code: v.toUpperCase()})} 
                                placeholder="E.G. FESTIVAL20" 
                                disabled={isEditing}
                            />
                            {isEditing && <p className="text-[8px] font-bold text-stone-400 uppercase -mt-4 ml-1">Note: Code identifier is immutable</p>}
                            <div className="grid grid-cols-2 gap-4">
                                <InputBox label="Discount Value" type="number" value={formData.discount} onChange={(v) => setFormData({...formData, discount: v})} placeholder="Value" />
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Type</label>
                                    <select 
                                        value={formData.type} 
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary appearance-none focus:ring-2 focus:ring-accent shadow-sm"
                                    >
                                        <option value="flat">₹ Flat Off</option>
                                        <option value="percent">% Percentage</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <InputBox label="Min Purchase" type="number" value={formData.min_purchase} onChange={(v) => setFormData({...formData, min_purchase: v})} placeholder="0" />
                                <InputBox label="Usage Limit" type="number" value={formData.usage_limit} onChange={(v) => setFormData({...formData, usage_limit: v})} placeholder="Infinite" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <InputBox label="Expiry Date" type="date" value={formData.expires_at} onChange={(v) => setFormData({...formData, expires_at: v})} />
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Event Description</label>
                                <textarea 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Diwali 2025 Special Reward..."
                                    className="w-full h-[150px] px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary focus:ring-2 focus:ring-accent shadow-sm resize-none"
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-accent transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                {isSaving ? 'Synching Cloud...' : <>{isEditing ? <HiPencil /> : <HiCheck />} {isEditing ? 'COMMIT UPDATES' : 'Activate Coupon DNA'}</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-stone-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-stone-50/50 border-b border-stone-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-stone-400 tracking-widest">Rewards Code</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-stone-400 tracking-widest">Logic</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-stone-400 tracking-widest">Usage</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-stone-400 tracking-widest">Status</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-stone-400 tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                        {coupons.map(c => (
                            <tr key={c.code} className="hover:bg-stone-50 transition-colors group">
                                <td className="px-8 py-6">
                                    <span className="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-black tracking-widest">{c.code}</span>
                                    <p className="text-[9px] text-stone-400 mt-2 font-bold uppercase truncate max-w-[200px]">{c.description || 'No description'}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <HiTag className="text-accent" />
                                        <span className="text-sm font-black text-primary">
                                            {c.discount_type === 'percent' ? `${c.discount}%` : `₹${c.discount}`} OFF
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-stone-400 mt-1 font-bold uppercase tracking-tighter">Min Purchase: ₹{c.min_purchase || 0}</p>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: c.usage_limit ? `${(c.used_count / c.usage_limit) * 100}%` : '5%' }} />
                                        </div>
                                        <span className="text-[10px] font-black text-stone-500 uppercase">{c.used_count} / {c.usage_limit || '∞'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${(!c.expires_at || new Date(c.expires_at) > new Date()) ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                        <span className="text-[10px] font-black text-stone-500 uppercase">
                                            {c.expires_at ? `Expires ${new Date(c.expires_at).toLocaleDateString()}` : 'Perpetual Asset'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleEdit(c)} className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm">
                                            <HiPencil size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(c.code)} className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                            <HiTrash size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {coupons.length === 0 && (
                    <div className="py-20 text-center text-stone-400 bg-stone-50/30">
                        <HiTag className="mx-auto text-4xl mb-4 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No Active Coupon DNA Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuickPreset = ({ icon, label, onClick }) => (
    <button onClick={onClick} className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4 group hover:shadow-xl hover:border-primary transition-all active:scale-95">
        <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{label}</span>
    </button>
);

const InputBox = ({ label, value, onChange, type = "text", placeholder, icon }) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>}
            <input 
                type={type} 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full ${icon ? 'pl-14' : 'px-6'} py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary focus:ring-2 focus:ring-accent shadow-sm transition-all`}
            />
        </div>
    </div>
);

export default CouponManager;
