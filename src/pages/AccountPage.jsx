import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { HiUser, HiMail, HiCalendar, HiShieldCheck, HiFingerPrint, HiLightningBolt, HiShoppingBag } from 'react-icons/hi';

const AccountPage = () => {
    const { user, loading } = useAuth();

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
                    <div className="h-32 bg-gradient-to-r from-primary to-gray-800 relative">
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
                        <div className="flex gap-2">
                            <span className="px-4 py-1.5 bg-accent/10 text-accent rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-accent/20">
                                {user.groups?.[0] || 'Verified User'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* User Details Section */}
                    <div className="space-y-6">
                        <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <span className="w-4 h-px bg-stone-200" /> Identity Details
                        </h2>
                        
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-5">
                            <DetailRow icon={<HiUser />} label="Full Name" value={name || 'Not Provided'} />
                            <DetailRow icon={<HiMail />} label="Email ID" value={user.email} verified={true} />
                            <DetailRow icon={<HiCalendar />} label="Member ID" value={user.id?.substring(0, 8).toUpperCase()} />
                            <DetailRow icon={<HiLightningBolt />} label="Status" value="Active Secure Connection" />
                        </div>

                        <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <span className="w-4 h-px bg-stone-200" /> Security Settings
                        </h2>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 space-y-4">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <HiShieldCheck className="text-emerald-500 text-xl" />
                                    <div>
                                        <p className="text-sm font-bold text-primary">Two-Factor Authentication</p>
                                        <p className="text-xs text-stone-400">Secure your account with 2FA</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-black text-stone-300 uppercase tracking-widest cursor-not-allowed">Disabled</button>
                             </div>
                        </div>
                    </div>

                    {/* Redesigned Dashboard Activity Section */}
                    <div className="space-y-6">
                         <h2 className="text-xs font-black text-stone-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <span className="w-4 h-px bg-stone-200" /> Activity Command Center
                        </h2>
                        
                        <div className="grid grid-cols-1 gap-4">
                            {/* Performance Card 1 */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-primary transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-primary flex items-center justify-center text-xl group-hover:bg-primary group-hover:text-white transition-colors">
                                        <HiShoppingBag />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Recent Purchases</p>
                                        <p className="text-xl font-black text-primary">04 Active</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-emerald-500 uppercase">In Transit</p>
                                </div>
                            </div>

                            {/* Performance Card 2 */}
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex items-center justify-between group hover:border-primary transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-50 text-accent flex items-center justify-center text-xl group-hover:bg-accent group-hover:text-white transition-colors">
                                        <HiLightningBolt />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Style Points</p>
                                        <p className="text-xl font-black text-primary">850 Tokens</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-amber-500 uppercase">Gold Tier</p>
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
                        <div className="bg-primary rounded-3xl p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                            <h3 className="text-lg font-black uppercase tracking-tighter mb-2 italic">Elite Membership</h3>
                            <p className="text-white/60 text-xs font-medium leading-relaxed mb-6">You're 150 points away from unlocking <span className="text-white font-bold">Free Express Shipping</span> globally on all suits.</p>
                            <button className="w-full py-3 bg-white text-primary rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all transform hover:-translate-y-1 shadow-lg shadow-black/20">Upgrade Profile</button>
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
            <p className="text-[9px] font-black text-stone-300 uppercase tracking-widest mb-1">{label}</p>
            <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-primary truncate">{value}</p>
                {verified && <HiShieldCheck className="text-emerald-500" title="Verified" />}
            </div>
        </div>
    </div>
);

export default AccountPage;
