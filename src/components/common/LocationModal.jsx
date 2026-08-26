import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { HiCheckCircle, HiLocationMarker, HiShieldCheck, HiX, HiXCircle } from 'react-icons/hi';
import { useCart } from '../../hooks/useCart';
import { validateDelivery } from '../../api/products';
import { getStateFromPin, isLikelySupportedPin } from '../../utils/deliveryUtils';

const reverseGeocode = async (latitude, longitude) => {
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    try {
      const preciseUrl = new URL(import.meta.env.VITE_REVERSE_GEOCODER_URL || 'https://nominatim.openstreetmap.org/reverse');
      preciseUrl.searchParams.set('format', 'jsonv2');
      preciseUrl.searchParams.set('lat', latitude);
      preciseUrl.searchParams.set('lon', longitude);
      preciseUrl.searchParams.set('zoom', '18');
      preciseUrl.searchParams.set('addressdetails', '1');
      preciseUrl.searchParams.set('accept-language', 'en');
      const preciseResponse = await fetch(preciseUrl, { headers: { Accept: 'application/json' } });
      if (preciseResponse.ok) {
        const precise = await preciseResponse.json();
        const address = precise.address || {};
        if (address.country_code && address.country_code.toLowerCase() !== 'in') throw new Error('Kamlesh Suits currently delivers only within India.');
        const mapped = {
          countryCode: address.country_code?.toUpperCase(),
          postcode: address.postcode || '',
          city: address.city || address.town || address.municipality || address.village || address.county || '',
          locality: address.neighbourhood || address.suburb || address.village || address.hamlet || address.road || '',
          principalSubdivision: address.state || '',
        };
        if (/^\d{6}$/.test(String(mapped.postcode).replace(/\D/g, ''))) return mapped;
      }
    } catch (preciseError) {
      if (preciseError.message?.includes('only within India')) throw preciseError;
      console.warn('Precise postal lookup failed, using fallback:', preciseError);
    }
  }

  const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    url.searchParams.set('latitude', latitude);
    url.searchParams.set('longitude', longitude);
  }
  url.searchParams.set('localityLanguage', 'en');
  const response = await fetch(url);
  if (!response.ok) throw new Error('Could not read your location.');
  const place = await response.json();
  if (place.countryCode && place.countryCode !== 'IN') throw new Error('Kamlesh Suits currently delivers only within India.');
  return place;
};

const resolvePincode = async pincode => {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const data = await response.json();
  const office = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null;
  return {
    city: office?.District || office?.Division || '',
    area: office?.Name || office?.Block || '',
    state: office?.State || getStateFromPin(pincode),
  };
};

const LocationModal = ({ isOpen, onClose, welcome = false }) => {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState(null);
  const { setDeliveryLocation } = useCart();

  useEffect(() => {
    if (!isOpen) return undefined;
    setPincode('');
    setResult(null);
    setError('');
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const saveLocation = async location => {
    const pin = String(location.pincode || '').replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(pin)) throw new Error('We found your area but could not detect its PIN code. Please enter it below.');
    let delivery;
    try {
      delivery = await validateDelivery(pin);
    } catch {
      delivery = { isAllowed: isLikelySupportedPin(pin), estimated: true };
    }
    const isAllowed = delivery.isAllowed === null || delivery.isAllowed === undefined
      ? isLikelySupportedPin(pin)
      : delivery.isAllowed === true;
    const saved = { ...location, pincode: pin, isAllowed, deliveryChecked: true };
    setDeliveryLocation(saved);
    setPincode(pin);
    setResult(saved);
    return saved;
  };

  const handleCurrentLocation = () => {
    setError('');
    setResult(null);
    if (!navigator.geolocation) {
      setError('Location is not supported on this device. Enter your delivery PIN code instead.');
      return;
    }
    setIsLocating(true);
    const saveDetectedPlace = async (place, coords = null, source = 'gps') => {
      const pin = String(place.postcode || '').replace(/\D/g, '').slice(0, 6);
      return saveLocation({
        city: place.city || place.locality || place.principalSubdivision || 'Current location',
        area: place.locality || place.city || '',
        state: place.principalSubdivision || getStateFromPin(pin),
        pincode: pin,
        latitude: coords ? Number(coords.latitude.toFixed(6)) : null,
        longitude: coords ? Number(coords.longitude.toFixed(6)) : null,
        source,
      });
    };

    const getApproximateLocation = async () => {
      const place = await reverseGeocode();
      await saveDetectedPlace(place, null, 'network');
    };

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const place = await reverseGeocode(coords.latitude, coords.longitude);
        await saveDetectedPlace(place, coords);
      } catch (locationError) {
        setError(locationError.message || 'Could not detect your address. Enter your PIN code instead.');
      } finally {
        setIsLocating(false);
      }
    }, async locationError => {
      let permissionState = 'unknown';
      try {
        permissionState = (await navigator.permissions?.query({ name: 'geolocation' }))?.state || 'unknown';
      } catch {
        // Permissions API is not available in some iOS and in-app browsers.
      }

      if (locationError.code === 1 && permissionState === 'denied') {
        setError('Location is blocked in this browser’s site settings. Enable Location for Kamlesh Suits, then tap the button again.');
        setIsLocating(false);
        return;
      }

      try {
        // Some mobile and in-app browsers return PERMISSION_DENIED even after the
        // user taps Allow. An IP-based locality keeps the experience working.
        await getApproximateLocation();
        setError('');
      } catch (fallbackError) {
        if (!window.isSecureContext) {
          setError('Location requires a secure HTTPS connection. Please reopen Kamlesh Suits in your main browser or enter your PIN code.');
        } else {
          setError(fallbackError.message || 'Exact GPS is unavailable in this browser. Please enter your PIN code.');
        }
      } finally {
        setIsLocating(false);
      }
    }, { enableHighAccuracy: true, timeout: 18000, maximumAge: 300000 });
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!/^\d{6}$/.test(pincode)) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }
    setError('');
    setResult(null);
    setIsChecking(true);
    try {
      const details = await resolvePincode(pincode);
      await saveLocation({ ...details, pincode, source: 'pincode' });
    } catch (lookupError) {
      setError(lookupError.message || 'Could not check this PIN code. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close location popup" />
      <section role="dialog" aria-modal="true" aria-labelledby="location-title" className="relative z-10 w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="bg-primary px-5 py-5 text-white sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15"><HiLocationMarker size={24} /></span>
              <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80">Kamlesh Suits</p><h2 id="location-title" className="mt-1 text-lg font-black !text-amber-300 drop-shadow-sm">{welcome ? 'Shop better with your location' : 'Choose your delivery location'}</h2></div>
            </div>
            <button onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10" aria-label="Close"><HiX size={22} /></button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-white/80">Your location helps Kamlesh Suits show delivery availability and relevant shopping insights. We use it only for this experience.</p>
        </div>

        <div className="space-y-5 px-5 py-6 sm:px-7">
          <button type="button" onClick={handleCurrentLocation} disabled={isLocating} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-black text-white shadow-lg disabled:opacity-60">
            <HiLocationMarker size={20} /> {isLocating ? 'Finding your location…' : 'Allow location access'}
          </button>
          <div className="flex items-center gap-3"><span className="h-px flex-1 bg-stone-200" /><span className="text-[10px] font-black uppercase tracking-widest text-stone-400">or enter PIN code</span><span className="h-px flex-1 bg-stone-200" /></div>
          <form onSubmit={handleSubmit} className="grid grid-cols-[1fr_auto] gap-2">
            <input type="text" inputMode="numeric" autoComplete="postal-code" value={pincode} onChange={event => setPincode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit delivery PIN" aria-label="Delivery PIN code" className="min-h-12 min-w-0 rounded-xl border-2 border-stone-200 px-4 text-sm font-bold outline-none focus:border-primary" />
            <button disabled={isChecking} className="min-h-12 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60">{isChecking ? 'Checking…' : 'Check'}</button>
          </form>

          {result && <div className={`rounded-2xl border p-4 ${result.isAllowed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <div className="flex items-start gap-3">{result.isAllowed ? <HiCheckCircle className="mt-0.5 shrink-0 text-emerald-600" size={22} /> : <HiXCircle className="mt-0.5 shrink-0 text-amber-600" size={22} />}<div><p className={`text-sm font-black ${result.isAllowed ? 'text-emerald-800' : 'text-amber-800'}`}>{result.isAllowed ? 'Delivery is available in your area' : 'Delivery is not available in this area yet'}</p><p className="mt-1 text-xs font-semibold text-stone-600">{[result.area, result.city, result.state, result.pincode].filter(Boolean).join(', ')}</p></div></div>
            {result.source === 'network' && <p className="mt-3 text-[10px] font-semibold text-stone-500">Approximate location used because exact GPS was unavailable. You can correct the PIN code above.</p>}
            <button onClick={onClose} className="mt-4 min-h-11 w-full rounded-xl border border-current text-xs font-black uppercase tracking-wider">Continue shopping</button>
          </div>}
          {error && <p role="alert" className="rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">{error}</p>}
          <p className="flex items-start gap-2 text-[10px] leading-relaxed text-stone-500"><HiShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={16} /> Kamlesh Suits does not continuously track your location. You can change it anytime from the location bar.</p>
        </div>
      </section>
    </div>,
    document.body
  );
};

export default LocationModal;
