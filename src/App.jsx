import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthTest from './pages/AuthTest';
import AccountPage from './pages/AccountPage';
import AdminDashboard from './pages/AdminDashboard';
import NewArrivals from './pages/NewArrivals';
import Sale from './pages/Sale';
import TermsAndConditions from './pages/TermsAndConditions';
import NotFound from './pages/NotFound';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import { useCart } from './hooks/useCart';

import BottomNav from './components/common/BottomNav';
import LocationBar from './components/common/LocationBar';
import LaunchScreen from './components/common/LaunchScreen';

function App() {
  const { toast, hideToast, deliveryLocation } = useCart();
  const location = useLocation();
  const [showLaunch, setShowLaunch] = React.useState(() => {
    return !sessionStorage.getItem('hasSeenLaunch');
  });

  const handleLaunchComplete = () => {
    sessionStorage.setItem('hasSeenLaunch', 'true');
    setShowLaunch(false);
  };

  const isAuthPage = ['/login', '/signup', '/auth-test'].includes(location.pathname);
  const isHome = location.pathname === '/';

  return (
    <div className={`flex flex-col min-h-screen ${!isAuthPage ? 'pb-16 md:pb-0' : ''}`}>
      {showLaunch && <LaunchScreen onComplete={handleLaunchComplete} />}
      {!isAuthPage && <Navbar />}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        image={toast.image} 
        type={toast.type} 
        onClose={hideToast} 
      />
      <main className={`flex-grow ${!isAuthPage && !isHome ? 'pt-14' : ''}`}>
        {!isAuthPage && !isHome && !deliveryLocation && <LocationBar />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          {/* Placeholder routes for new nav items to prevent 404s if clicked */}
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth-test" element={<AuthTest />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          {/* Catch-all 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && location.pathname !== '/cart' && <BottomNav />}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;