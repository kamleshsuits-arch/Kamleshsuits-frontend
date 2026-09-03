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
import AdminBanners from './pages/AdminBanners';
import NewArrivals from './pages/NewArrivals';
import Sale from './pages/Sale';
import TermsAndConditions from './pages/TermsAndConditions';
import NotFound from './pages/NotFound';
import TrackOrder from './pages/TrackOrder';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import { useCart } from './hooks/useCart';

import BottomNav from './components/common/BottomNav';
import LaunchScreen from './components/common/LaunchScreen';
import LocationModal from './components/common/LocationModal';
import NotificationCenter from './components/common/NotificationCenter';

function App() {
  const { toast, hideToast, deliveryLocation } = useCart();
  const location = useLocation();
  const [showLaunch, setShowLaunch] = React.useState(() => {
    return !sessionStorage.getItem('hasSeenLaunch');
  });
  const [initialCollectionReady, setInitialCollectionReady] = React.useState(false);
  const [showLocationWelcome, setShowLocationWelcome] = React.useState(false);

  const handleLaunchComplete = React.useCallback(() => {
    sessionStorage.setItem('hasSeenLaunch', 'true');
    setShowLaunch(false);
  }, []);

  const handleInitialCollectionReady = React.useCallback(() => {
    setInitialCollectionReady(true);
  }, []);

  React.useEffect(() => {
    const isPublicPage = !location.pathname.startsWith('/admin') && !['/login', '/signup', '/auth-test'].includes(location.pathname);
    if (showLaunch || deliveryLocation || !isPublicPage || sessionStorage.getItem('kamlesh_location_prompt_seen')) return;
    sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
    setShowLocationWelcome(true);
  }, [showLaunch, deliveryLocation, location.pathname]);

  const isAuthPage = ['/login', '/signup', '/auth-test'].includes(location.pathname);
  const isHome = location.pathname === '/';
  const isSpecialSession = ['/new-arrivals', '/sale', '/wishlist'].includes(location.pathname);
  const skipGlobalPadding = isHome || isSpecialSession;

  return (
    <div className={`flex flex-col min-h-screen ${!isAuthPage ? 'pb-16 md:pb-0' : ''}`}>
      {showLaunch && <LaunchScreen ready={!isHome || initialCollectionReady} onComplete={handleLaunchComplete} />}
      <LocationModal isOpen={showLocationWelcome} onClose={() => setShowLocationWelcome(false)} welcome />
      {!isAuthPage && <NotificationCenter />}
      {!isAuthPage && <Navbar />}
      <Toast 
        show={toast.show} 
        message={toast.message} 
        image={toast.image} 
        type={toast.type} 
        onClose={hideToast} 
      />
      <main className={`flex-grow ${!isAuthPage && !skipGlobalPadding ? 'pt-14 md:pt-0' : ''}`}>
        {/* Global LocationBar removed per request - now page-specific */}
        {/* {!isAuthPage && !skipGlobalPadding && !isProductPage && !deliveryLocation && <LocationBar />} */}
        <Routes>
          <Route path="/" element={<Home onInitialCollectionReady={handleInitialCollectionReady} />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          {/* Placeholder routes for new nav items to prevent 404s if clicked */}
          <Route path="/new-arrivals" element={<NewArrivals />} />
          <Route path="/sale" element={<Sale />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/banners" element={<AdminBanners />} />
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
