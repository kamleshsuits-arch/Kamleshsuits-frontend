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
import { HelmetProvider } from 'react-helmet-async';
import { registerServiceWorker } from './pwa';

registerServiceWorker();

// Crawlers receive the initial HTML tags. React 19 owns metadata after startup;
// remove the marked server tags so navigation cannot leave duplicate previews.
document.head.querySelectorAll('[data-rh="true"]').forEach(tag => tag.remove());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <HelmetProvider>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  </StrictMode>,
)
