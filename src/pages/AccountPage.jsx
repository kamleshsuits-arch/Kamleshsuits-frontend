import { useAuth } from '../context/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { HiUser, HiMail, HiCalendar, HiShieldCheck, HiFingerPrint, HiLightningBolt, HiShoppingBag, HiClock, HiBadgeCheck, HiLogout } from 'react-icons/hi';

const AccountPage = () => {
    const { user, loading, logout } = useAuth();
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
        <div className="min-h-screen bg-stone-50 pt-10 pb-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                
                {/* Header Profile Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-stone-200/50 overflow-hidden mb-8 border border-white">
                    <div className="h-32 relative" style={{ background: 'linear-gradient(to right, #434343 0%, black 100%)' }}>
                        <div className="absolute -bottom-12 left-8">
                                <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg bg-accent text-white flex items-center justify-center text-4xl font-black">
                                    {(name[0]).toUpperCase()}
                                </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-8 px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-primary tracking-tight">
                                {name}
                            </h1>
                            <p className="text-stone-400 font-medium">{user.email}</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* User Details Section */}
                    <div className="space-y-6">
                        <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Identity Details
                        </h2>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-5">
                            <DetailRow icon={<HiUser />} label="Full Name" value={name || 'Not Provided'} />
                            <DetailRow icon={<HiMail />} label="Email ID" value={user.email} verified={true} />
                            <DetailRow icon={<HiBadgeCheck />} label="Account ID" value={user.id?.substring(0, 12).toUpperCase()} />
                            <DetailRow icon={<HiClock />} label="Last Login" value={user.authTime ? new Date(user.authTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Just Now'} />
                        </div>

                        <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Account Security
                        </h2>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4">
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

                    {/* Redesigned Dashboard Activity Section */}
                    <div className="space-y-6">
                         <h2 className="text-[11px] font-black text-primary/70 uppercase tracking-[0.4em] flex items-center gap-2">
                             <span className="w-6 h-px bg-accent/30" /> Customer Dashboard
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {/* Performance Card 1 */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-accent transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-primary flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                        <HiShoppingBag />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Active Orders</p>
                                        <p className="text-xl font-black text-primary">00 Total</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-stone-300 uppercase italic">Catalog Sync</p>
                                </div>
                            </div>

                            {/* Performance Card 2 */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-accent transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-accent flex items-center justify-center text-xl group-hover:bg-accent group-hover:text-white transition-colors">
                                        <HiLightningBolt />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Membership Tier</p>
                                        <p className="text-xl font-black text-primary">Premium Member</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-accent uppercase">Standard</p>
                                </div>
                            </div>

                            {/* Performance Card 3 */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-primary transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-emerald-500 flex items-center justify-center text-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                                        <HiShieldCheck />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Total Savings</p>
                                        <p className="text-xl font-black text-primary">₹2,450</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-stone-300 uppercase italic">Lifetime</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action Banner */}
                        <div className="bg-gradient-to-br from-primary to-stone-800 rounded-3xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <h3 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Exclusive Benefits</h3>
                            <p className="text-white/60 text-xs font-medium leading-relaxed mb-6">Complete your profile and get <span className="text-accent font-bold">Priority Support</span> and early access to silk launches.</p>
                            <button className="w-full py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1 shadow-lg shadow-black/20">Edit Profile</button>
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

export default AccountPage;
