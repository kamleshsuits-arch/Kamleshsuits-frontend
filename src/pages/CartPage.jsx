// src/pages/CartPage.jsx
import React, { useRef } from 'react';
import { useCart } from '../hooks/useCart.jsx';
import Cart from '../components/cart/Cart';

const CartPage = () => {
  const { cartItems, removeFromCart } = useCart();
  const cartRef = useRef();

  // Removed conflicting GSAP animation that was causing visual issues (white layer/opacity 0)
  // The Cart component now handles its own presentation.

  return <Cart cartItems={cartItems} removeFromCart={removeFromCart} ref={cartRef} />;
};

export default CartPage;