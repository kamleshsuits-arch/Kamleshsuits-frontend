import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchProducts, fetchUserProfile, saveUserProfile } from '../api/products';
import { useAuth } from '../context/AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  
  // Storage key helper
  const getStorageKey = useCallback((key) => {
    return user ? `${key}_${user.id}` : key;
  }, [user]);

  // Initial state loading logic
  const loadInitialState = useCallback((key) => {
    try {
      const storageKey = getStorageKey(key);
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage`, error);
      return [];
    }
  }, [getStorageKey]);

  // --- LOCAL STATE ---
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [deliveryLocation, setDeliveryLocation] = useState(null); // { city: string, pincode: string }
  const [isLoaded, setIsLoaded] = useState(false);
  const syncTimeoutRef = useRef(null);

  // --- INITIAL HYDRATION & SYNC ---
  useEffect(() => {
    const hydrate = async () => {
      // 1. First load from local storage (immediate)
      const localCart = loadInitialState('cartItems');
      const localWishlist = loadInitialState('wishlistItems');
      const localAddresses = loadInitialState('addresses');
      const localLocation = loadInitialState('deliveryLocation');
      setCartItems(localCart);
      setWishlistItems(localWishlist);
      setAddresses(localAddresses);
      if (localLocation && !Array.isArray(localLocation)) setDeliveryLocation(localLocation);
      
      // 2. If logged in, fetch from cloud
      if (user) {
        try {
          const profile = await fetchUserProfile();
          if (profile) {
            // Priority: Cloud data if exists
            if (profile.cartItems?.length > 0 || profile.wishlistItems?.length > 0 || profile.addresses?.length > 0) {
              setCartItems(profile.cartItems || []);
              setWishlistItems(profile.wishlistItems || []);
              setAddresses(profile.addresses || []);
              setDeliveryLocation(profile.deliveryLocation || null);
              
              // Also update current local storage to match cloud
              localStorage.setItem(`cartItems_${user.id}`, JSON.stringify(profile.cartItems || []));
              localStorage.setItem(`wishlistItems_${user.id}`, JSON.stringify(profile.wishlistItems || []));
              localStorage.setItem(`addresses_${user.id}`, JSON.stringify(profile.addresses || []));
              if (profile.deliveryLocation) localStorage.setItem(`deliveryLocation_${user.id}`, JSON.stringify(profile.deliveryLocation));
            }
          }
        } catch (error) {
          console.error("Failed to fetch cloud profile:", error);
        }
      }
      setIsLoaded(true);
    };

    hydrate();
  }, [user, loadInitialState]);

  // --- PERSISTENCE & CLOUD SYNC ---
  useEffect(() => {
    if (!isLoaded) return;

    // Save to local storage
    const storageKeyCart = getStorageKey('cartItems');
    const storageKeyWish = getStorageKey('wishlistItems');
    const storageKeyAddr = getStorageKey('addresses');
    const storageKeyLoc = getStorageKey('deliveryLocation');
    localStorage.setItem(storageKeyCart, JSON.stringify(cartItems));
    localStorage.setItem(storageKeyWish, JSON.stringify(wishlistItems));
    localStorage.setItem(storageKeyAddr, JSON.stringify(addresses));
    if (deliveryLocation) localStorage.setItem(storageKeyLoc, JSON.stringify(deliveryLocation));

    // Debounced Cloud Sync
    if (user) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await saveUserProfile({ cartItems, wishlistItems, addresses, deliveryLocation });
          console.log("Cloud sync successful");
        } catch (err) {
          console.error("Cloud sync failed:", err);
        }
      }, 2000); // 2 second debounce
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [cartItems, wishlistItems, addresses, deliveryLocation, user, isLoaded, getStorageKey]);

  // --- SYNC WITH COLLECTION (CLEANUP) ---
  useEffect(() => {
    if (!isLoaded) return;
    const syncWithCollection = async () => {
      try {
        const allProducts = await fetchProducts();
        if (!allProducts || allProducts.length === 0) return;

        const productIds = new Set(allProducts.map(p => String(p.suitId)));

        setCartItems(prev => {
          const filtered = prev.filter(item => productIds.has(String(item.suitId)));
          return filtered.length !== prev.length ? filtered : prev;
        });

        setWishlistItems(prev => {
          const filtered = prev.filter(item => productIds.has(String(item.suitId)));
          return filtered.length !== prev.length ? filtered : prev;
        });
      } catch (error) {
        console.error("Failed to sync with collection:", error);
      }
    };
    syncWithCollection();
  }, [isLoaded]);

  // --- TOAST STATE ---
  const [toast, setToast] = useState({ show: false, message: '', image: '', type: 'success' });

  const showToast = (message, image, type = 'success') => {
    setToast({ show: true, message, image, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  // --- CART ACTIONS ---
  const addToCart = (product) => {
    if (!product || !product.suitId) return;
    setCartItems((prev) => {
      const existing = prev.find((item) => String(item.suitId) === String(product.suitId));
      if (existing) {
        showToast(`Quantity updated`, product.image || (product.images && product.images[0]), 'success');
        return prev.map((item) =>
          String(item.suitId) === String(product.suitId)
            ? { ...item, quantity: Math.min((item.quantity || 1) + 1, 2) }
            : item
        );
      }
      showToast(`Added to cart`, product.image || (product.images && product.images[0]), 'success');
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, newQty) => {
    if (newQty < 1) {
      removeFromCart(id);
      return;
    }
    if (newQty > 2) return;
    setCartItems((prev) =>
      prev.map((item) => String(item.suitId) === String(id) ? { ...item, quantity: newQty } : item)
    );
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => {
      const itemToRemove = prev.find(item => String(item.suitId) === String(id));
      if (itemToRemove) {
        showToast(`Removed from cart`, itemToRemove.image || (itemToRemove.images && itemToRemove.images[0]), 'error');
      }
      return prev.filter((item) => String(item.suitId) !== String(id));
    });
  };

  const clearCart = () => {
    setCartItems([]);
    showToast("Cart cleared", null, 'info');
  };

  // --- WISHLIST ACTIONS ---
  const addToWishlist = (product) => {
    if (!product || !product.suitId) return;
    setWishlistItems((prev) => {
      if (prev.some((item) => String(item.suitId) === String(product.suitId))) return prev;
      showToast(`Added to wishlist`, product.image || (product.images && product.images[0]), 'success');
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) => {
      const itemToRemove = prev.find(item => String(item.suitId) === String(id));
      if (itemToRemove) {
        showToast(`Removed from wishlist`, itemToRemove.image || (itemToRemove.images && itemToRemove.images[0]), 'error');
      }
      return prev.filter((item) => String(item.suitId) !== String(id));
    });
  };

  const toggleWishlist = (product) => {
    if (!product || !product.suitId) return;
    if (isInWishlist(product.suitId)) {
      removeFromWishlist(product.suitId);
    } else {
      addToWishlist(product);
    }
  };

  // --- ADDRESS ACTIONS ---
  const addAddress = (address) => {
    if (addresses.length >= 3) {
      showToast("Maximum 3 addresses allowed", null, 'error');
      return false;
    }
    const newAddress = { ...address, id: Date.now() };
    setAddresses(prev => [...prev, newAddress]);
    showToast("Address added", null, 'success');
    return true;
  };

  const removeAddress = (id) => {
    setAddresses(prev => prev.filter(a => a.id !== id));
    showToast("Address removed", null, 'error');
  };

  const updateAddress = (id, updated) => {
    setAddresses(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
    showToast("Address updated", null, 'success');
  };

  const isInWishlist = (id) => wishlistItems.some((item) => String(item.suitId) === String(id));
  const isInCart = (id) => cartItems.some((item) => String(item.suitId) === String(id));
  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) * (item.quantity || 1)), 0);

  return (
    <CartContext.Provider 
      value={{ 
        cartItems, addToCart, removeFromCart, clearCart, updateQuantity,
        wishlistItems, addToWishlist, removeFromWishlist, toggleWishlist,
        addresses, addAddress, removeAddress, updateAddress,
        deliveryLocation, setDeliveryLocation,
        isInWishlist, isInCart, subtotal, toast, showToast, hideToast
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
