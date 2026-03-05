import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Fix for AWS Cognito: 'global is not defined' in browser
if (typeof global === 'undefined') {
  window.global = window;
}
import { Buffer } from 'buffer';
window.Buffer = Buffer;

import { CartProvider } from './hooks/useCart.jsx';
import { AuthProvider } from './context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
