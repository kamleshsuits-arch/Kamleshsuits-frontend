import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import AsyncBoundary from './components/common/AsyncBoundary';
const ProductDetails = React.lazy(() => import('./pages/ProductDetails'));
const Products = React.lazy(() => import('./pages/Products'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const AuthTest = React.lazy(() => import('./pages/AuthTest'));
const AccountPage = React.lazy(() => import('./pages/AccountPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminBanners = React.lazy(() => import('./pages/AdminBanners'));
const NewArrivals = React.lazy(() => import('./pages/NewArrivals'));
const Sale = React.lazy(() => import('./pages/Sale'));
const TermsAndConditions = React.lazy(() => import('./pages/TermsAndConditions'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const TrackOrder = React.lazy(() => import('./pages/TrackOrder'));
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Toast from './components/common/Toast';
import { useCart } from './hooks/useCart';

import BottomNav from './components/common/BottomNav';
import LaunchScreen from './components/common/LaunchScreen';
const LocationModal = React.lazy(() => import('./components/common/LocationModal'));
const NotificationCenter = React.lazy(() => import('./components/common/NotificationCenter'));
const InstallPrompt = React.lazy(() => import('./components/common/InstallPrompt'));

const RouteFallback = () => (
  <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
    <span className="text-sm font-semibold text-stone-500">Loading…</span>
  </div>
);

function App() {
  const { toast, hideToast, deliveryLocation } = useCart();
  const location = useLocation();
  const [showLaunch, setShowLaunch] = React.useState(() => {
    return !sessionStorage.getItem('hasSeenLaunch');
  });
  const [initialCollectionReady, setInitialCollectionReady] = React.useState(false);
  const [showLocationWelcome, setShowLocationWelcome] = React.useState(false);
  const [locationStepComplete, setLocationStepComplete] = React.useState(false);
  const [installPromptVisible, setInstallPromptVisible] = React.useState(false);

  const closeLocationWelcome = React.useCallback(() => {
    sessionStorage.setItem('kamlesh_location_prompt_seen', 'true');
    setShowLocationWelcome(false);
    setLocationStepComplete(true);
  }, []);

  const handleLaunchComplete = React.useCallback(() => {
    sessionStorage.setItem('hasSeenLaunch', 'true');
    setShowLaunch(false);
  }, []);

  const handleInitialCollectionReady = React.useCallback(() => {
    setInitialCollectionReady(true);
  }, []);

  React.useEffect(() => {
    if (showLaunch || location.pathname !== '/' || showLocationWelcome || locationStepComplete) return;
    // A saved location or a completed welcome step needs no second location prompt.
    if (deliveryLocation || sessionStorage.getItem('kamlesh_location_prompt_seen')) {
      setLocationStepComplete(true);
      return;
    }
    const timer = window.setTimeout(() => setShowLocationWelcome(true), 6000);
    return () => window.clearTimeout(timer);
  }, [showLaunch, deliveryLocation, location.pathname, showLocationWelcome, locationStepComplete]);

  const isAuthPage = ['/login', '/signup', '/auth-test'].includes(location.pathname);
  const isHome = location.pathname === '/';
  const isSpecialSession = ['/new-arrivals', '/sale', '/wishlist'].includes(location.pathname);
  const skipGlobalPadding = isHome || isSpecialSession;

  return (
    <div className={`flex flex-col min-h-screen ${!isAuthPage ? 'pb-16 md:pb-0' : ''}`}>
      {showLaunch && <LaunchScreen ready={!isHome || initialCollectionReady} onComplete={handleLaunchComplete} />}
      <AsyncBoundary optional>
      <React.Suspense fallback={null}>
        <LocationModal isOpen={showLocationWelcome && isHome} onClose={closeLocationWelcome} welcome />
        {isHome && !showLaunch && locationStepComplete && !showLocationWelcome && <InstallPrompt delayMs={6000} onVisibilityChange={setInstallPromptVisible} />}
        {!isAuthPage && <NotificationCenter loaderComplete={!showLaunch} popupBlocked={(showLocationWelcome && isHome) || installPromptVisible} />}
      </React.Suspense>
      </AsyncBoundary>
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
        <AsyncBoundary key={location.pathname}>
        <React.Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Home onInitialCollectionReady={handleInitialCollectionReady} />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/product" element={<Products />} />
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
        </React.Suspense>
        </AsyncBoundary>
      </main>
      {!isAuthPage && location.pathname !== '/cart' && <BottomNav />}
      {!isAuthPage && <Footer />}
    </div>
  );
}

export default App;
