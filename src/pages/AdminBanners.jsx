import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { HiArrowLeft, HiHome, HiPhotograph, HiShieldCheck } from 'react-icons/hi';
import BannerManager from '../components/admin/BannerManager';
import Loader from '../components/common/Loader';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../hooks/useCart';
import './AdminDashboard.css';

const AdminBanners = () => {
  const { isAdmin, loading } = useAuth();
  const { showToast } = useCart();

  if (loading) return <Loader message="Verifying banner access…" />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="admin-dashboard min-h-screen bg-stone-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-xl text-white"><HiPhotograph /></span>
              <div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-700"><HiShieldCheck /> Admin only</div>
                <h1 className="mt-1 text-3xl font-black tracking-tight text-primary">Banner Management</h1>
                <p className="mt-1 text-sm text-stone-500">Manage responsive campaign artwork shown on the home page.</p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-2">
              <Link to="/admin" className="admin-secondary-button"><HiArrowLeft /> Admin dashboard</Link>
              <Link to="/" className="admin-secondary-button"><HiHome /> View home page</Link>
            </nav>
          </div>
        </header>

        <BannerManager showToast={showToast} />
      </div>
    </div>
  );
};

export default AdminBanners;
