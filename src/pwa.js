import { AWS_CONFIG } from './lib/aws-config';

const INSTALLATION_KEY = 'kamlesh_pwa_installation_id';
const API_URL = AWS_CONFIG.apiBaseUrl;
let deferredInstallPrompt = null;

export const canInstallPwa = () => Boolean(deferredInstallPrompt);

export const promptPwaInstall = async () => {
  if (!deferredInstallPrompt) return { outcome: 'unavailable' };
  const promptEvent = deferredInstallPrompt;
  deferredInstallPrompt = null;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;
  window.dispatchEvent(new CustomEvent('kamlesh:pwa-install-state', { detail: choice }));
  return choice;
};

const getAuthHeaders = () => {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const username = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  const token = username && localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${username}.idToken`);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getInstallationId = () => {
  let installationId = localStorage.getItem(INSTALLATION_KEY);
  if (!installationId) {
    installationId = globalThis.crypto?.randomUUID?.() || `install-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(INSTALLATION_KEY, installationId);
  }
  return installationId;
};

export const isStandalonePwa = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const trackPwaInstallation = async installed => {
  try {
    await fetch(`${API_URL}/pwa/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        installationId: getInstallationId(),
        installed: installed === true,
        displayMode: isStandalonePwa() ? 'standalone' : 'browser',
        platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
      }),
    });
  } catch (error) {
    console.warn('PWA installation tracking is unavailable:', error);
  }
};

const urlBase64ToUint8Array = value => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), character => character.charCodeAt(0));
};

export const enablePushNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    throw new Error('Push notifications are not supported on this device.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');

  const registration = await navigator.serviceWorker.ready;
  const keyResponse = await fetch(`${API_URL}/push/public-key`);
  if (!keyResponse.ok) throw new Error('Push notifications are not configured yet.');
  const { publicKey } = await keyResponse.json();
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const response = await fetch(`${API_URL}/push/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify({ installationId: getInstallationId(), subscription: subscription.toJSON() }),
  });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Could not save notification subscription.');
  navigator.vibrate?.([300, 120, 300, 120, 600]);
  return subscription;
};

export const registerServiceWorker = () => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    window.dispatchEvent(new CustomEvent('kamlesh:pwa-install-ready'));
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => trackPwaInstallation(isStandalonePwa()))
      .catch(error => console.error('Service worker registration failed:', error));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    trackPwaInstallation(true);
    window.dispatchEvent(new CustomEvent('kamlesh:pwa-installed'));
  });
};
