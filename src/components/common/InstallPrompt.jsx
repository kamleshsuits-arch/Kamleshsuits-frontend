import React, { useEffect, useState } from 'react';
import { HiDownload, HiOutlineDeviceMobile, HiX } from 'react-icons/hi';
import { canInstallPwa, isStandalonePwa, promptPwaInstall } from '../../pwa';

const DISMISSED_KEY = 'kamlesh_install_prompt_dismissed';
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const InstallPrompt = ({ delayMs = 6000, onVisibilityChange }) => {
  const [delayFinished, setDelayFinished] = useState(false);
  const [installAvailable, setInstallAvailable] = useState(() => canInstallPwa());
  const [installing, setInstalling] = useState(false);
  const [installHelp, setInstallHelp] = useState('');
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');

  useEffect(() => {
    const timer = window.setTimeout(() => setDelayFinished(true), delayMs);
    const onReady = () => setInstallAvailable(true);
    const onInstalled = () => setDismissed(true);
    const onState = event => {
      setInstallAvailable(false);
      if (event.detail?.outcome === 'accepted') setDismissed(true);
    };
    window.addEventListener('kamlesh:pwa-install-ready', onReady);
    window.addEventListener('kamlesh:pwa-installed', onInstalled);
    window.addEventListener('kamlesh:pwa-install-state', onState);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('kamlesh:pwa-install-ready', onReady);
      window.removeEventListener('kamlesh:pwa-installed', onInstalled);
      window.removeEventListener('kamlesh:pwa-install-state', onState);
    };
  }, [delayMs]);

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  const install = async () => {
    if (!installAvailable) {
      setInstallHelp(isIos()
        ? 'Open this page in Safari. Tap Share (the square with an upward arrow), choose “Add to Home Screen”, then tap “Add”. If shown, keep “Open as Web App” switched on. If the option is missing, look under “Edit Actions”.'
        : 'Open this website in Chrome or Edge and choose “Install app” from the browser menu.');
      return;
    }

    setInstalling(true);
    setInstallHelp('');
    try {
      const choice = await promptPwaInstall();
      if (choice.outcome === 'accepted') {
        dismiss();
      } else if (choice.outcome === 'unavailable') {
        setInstallAvailable(false);
        setInstallHelp('The browser installer is not available. Try “Install app” from your browser menu.');
      }
    } catch (error) {
      console.error('Could not open the PWA installer:', error);
      setInstallHelp('Could not open the browser installer. Please try again from your browser menu.');
    } finally {
      setInstalling(false);
    }
  };

  const visible = delayFinished && !dismissed && !isStandalonePwa() && (installAvailable || isIos());
  useEffect(() => {
    onVisibilityChange?.(visible);
    return () => onVisibilityChange?.(false);
  }, [visible, onVisibilityChange]);

  if (!visible) return null;

  return (
    <aside className="bottom-app-prompt fixed left-1/2 z-[115] w-[calc(100%-1.5rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-amber-200 bg-white p-4 shadow-2xl" role="dialog" aria-label="Install Kamlesh Suits app">
      <button onClick={dismiss} className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 hover:bg-stone-100" aria-label="Dismiss install option"><HiX /></button>
      <div className="flex items-start gap-3 pr-7">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-2xl text-amber-700"><HiOutlineDeviceMobile /></span>
        <div><p className="font-serif text-lg font-black text-primary">Install Kamlesh Suits</p><p className="mt-1 text-xs leading-relaxed text-stone-600">Shop faster and receive order updates directly on your device.</p></div>
      </div>
      {isIos() && !installHelp && <p className="mt-3 text-xs text-stone-600">On iPhone and iPad, add the app through Safari’s Share menu.</p>}
      {installHelp && <p role="status" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold text-stone-700">{installHelp}</p>}
      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-wide text-white disabled:cursor-wait disabled:opacity-70"
      >
        <HiDownload className="text-lg" /> {installing ? 'Opening installer…' : isIos() && !installAvailable ? 'How to install on iPhone / iPad' : 'Install app'}
      </button>
    </aside>
  );
};

export default InstallPrompt;
