import { useAuth } from '../context/AuthContext';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { HiUser, HiMail, HiShieldCheck, HiShoppingBag, HiClock, HiBadgeCheck, HiLogout, HiClipboardList, HiHeart, HiHome, HiArrowRight } from 'react-icons/hi';

const AccountPage = () => {
    const { user, isAdmin, loading, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-stone-50">
            <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (!user) return <Navigate to="/login" />;

    // Cognito uses direct fields or userPool Data
    const name = user.name || user.email?.split('@')[0];

    return (
        <div className="min-h-screen bg-stone-50 pt-5 pb-20 sm:pt-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                {/* Header Profile Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden mb-8 border border-white">
                    <div className="h-32 relative" style={{ background: 'linear-gradient(to right, #434343 0%, black 100%)' }}>
                        <div className="absolute -bottom-12 left-4 sm:left-8">
                                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-accent text-white flex items-center justify-center text-4xl font-black">
                                    {(name[0]).toUpperCase()}
                                </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-6 px-4 sm:px-8 sm:pb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="break-words text-2xl sm:text-3xl font-black text-primary tracking-tight">
                                {name}
                            </h1>
                            <p className="break-all text-sm sm:text-base text-stone-400 font-medium">{user.email}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="px-4 py-2 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-accent/20">
                                {user.groups?.[0] || 'Verified User'}
                            </span>
                            <button 
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-5 py-2 bg-red-50 text-red-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                <HiLogout size={14} /> 
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    
                    {/* User Details Section */}
                    <div className="order-2 space-y-6 md:order-1">
                        <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Identity Details
                        </h2>
                        
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-100 space-y-5">
                            <DetailRow icon={<HiUser />} label="Full Name" value={name || 'Not Provided'} />
                            <DetailRow icon={<HiMail />} label="Email ID" value={user.email} verified={true} />
                            <DetailRow icon={<HiBadgeCheck />} label="Account ID" value={user.id?.substring(0, 12).toUpperCase()} />
                            <DetailRow icon={<HiClock />} label="Last Login" value={user.authTime ? new Date(user.authTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just Now'} />
                        </div>

                        <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Account Security
                        </h2>
                        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-stone-100 space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-xl shrink-0">
                                        <HiShieldCheck />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-primary">Login Status</p>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Cloud Verified</p>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-100">Verified</div>
                             </div>
                        </div>
                    </div>

                    {/* Account navigation — shown first on mobile */}
                    <div className="order-1 space-y-6 md:order-2">
                         <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Quick Access
                        </h2>

                        {isAdmin && (
                            <Link
                                to="/admin"
                                className="group flex min-h-24 items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 p-5 text-white shadow-lg shadow-emerald-900/15 transition active:scale-[0.98] sm:p-6"
                            >
                                <span className="flex min-w-0 items-center gap-4">
                                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/20">
                                        <HiShieldCheck />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-base font-black">Admin Management</span>
                                        <span className="mt-1 block text-xs font-medium leading-5 text-white/75">Manage products, confirm orders and view reports.</span>
                                    </span>
                                </span>
                                <HiArrowRight size={22} className="shrink-0 transition-transform group-hover:translate-x-1" />
                            </Link>
                        )}

                        <div className="grid grid-cols-1 gap-4">
                            <QuickLink to="/track-order" icon={<HiClipboardList />} title="Track Orders" description="Check order history and current delivery status." tone="accent" />
                            <QuickLink to="/wishlist" icon={<HiHeart />} title="Saved Pieces" description="Open products saved to your wishlist." tone="rose" />
                            <QuickLink to="/cart" icon={<HiShoppingBag />} title="Shopping Bag" description="Review items waiting in your cart." tone="gold" />
                            <QuickLink to="/" icon={<HiHome />} title="Continue Shopping" description="Browse the complete Kamlesh Suits collection." tone="stone" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ icon, label, value, verified }) => (
    <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 text-stone-400 flex items-center justify-center text-xl shrink-0">
            {icon}
        </div>
        <div className="flex-1 min-w-0 border-b border-stone-50 pb-3">
            <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-primary truncate">{value}</p>
                {verified && <HiBadgeCheck className="text-emerald-500" title="Verified" />}
            </div>
        </div>
    </div>
);

const QUICK_LINK_TONES = {
    accent: 'bg-amber-50 text-amber-700 group-hover:bg-accent group-hover:text-white',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
    gold: 'bg-yellow-50 text-yellow-700 group-hover:bg-yellow-600 group-hover:text-white',
    stone: 'bg-stone-100 text-stone-600 group-hover:bg-primary group-hover:text-white'
};

const QuickLink = ({ to, icon, title, description, tone }) => (
    <Link to={to} className="group flex min-h-20 items-center justify-between gap-3 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition hover:border-stone-200 hover:shadow-md active:scale-[0.99] sm:p-5">
        <span className="flex min-w-0 items-center gap-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl transition-colors ${QUICK_LINK_TONES[tone] || QUICK_LINK_TONES.stone}`}>
                {icon}
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-black text-primary">{title}</span>
                <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">{description}</span>
            </span>
        </span>
        <HiArrowRight size={19} className="shrink-0 text-stone-300 transition-transform group-hover:translate-x-1 group-hover:text-accent" />
    </Link>
);

export default AccountPage;
