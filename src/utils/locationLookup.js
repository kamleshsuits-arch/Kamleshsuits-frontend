// Bound third-party lookups so a slow provider cannot leave checkout spinning.
export const fetchLocationJson = async (url, timeoutMs = 4500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Address lookup is temporarily unavailable. Please enter your PIN code.');
    return await response.json();
  } finally { clearTimeout(timer); }
};

const pinCache = new Map();
export const lookupPincode = async pin => {
  if (!/^[1-9]\d{5}$/.test(pin)) throw new Error('Enter a valid 6-digit PIN code.');
  if (pinCache.has(pin)) return pinCache.get(pin);
  const data = await fetchLocationJson(`https://api.postalpincode.in/pincode/${pin}`);
  const office = data?.[0]?.Status === 'Success' ? data[0].PostOffice?.[0] : null;
  if (!office) throw new Error('PIN code not found. Check the six digits and try again.');
  pinCache.set(pin, office);
  return office;
};

const addressCache = new Map();
export const lookupCoordinates = async (latitude, longitude) => {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Please select a location on the map.');
  const key = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  if (addressCache.has(key)) return addressCache.get(key);
  const url = new URL(import.meta.env.VITE_REVERSE_GEOCODER_URL || 'https://nominatim.openstreetmap.org/reverse');
  Object.entries({ format: 'jsonv2', lat: latitude, lon: longitude, zoom: 18, addressdetails: 1, 'accept-language': 'en' }).forEach(([name, value]) => url.searchParams.set(name, value));
  let result;
  try { result = await fetchLocationJson(url); } catch { /* Try the locality-level address below. */ }
  if (result?.address?.country_code && result.address.country_code !== 'in') throw new Error('Please choose a delivery location in India.');
  // Buildings may have no postcode while the containing locality does.
  if (!/^[1-9]\d{5}$/.test(result?.address?.postcode || '')) {
    url.searchParams.set('zoom', '10');
    try {
      const locality = await fetchLocationJson(url, 3000);
      if (locality.address?.country_code && locality.address.country_code !== 'in') throw new Error('Please choose a delivery location in India.');
      result = { ...locality, ...result, address: { ...locality.address, ...result?.address, postcode: locality.address?.postcode } };
    } catch (error) { if (error.message.includes('in India')) throw error; }
  }
  if (!result?.address) throw new Error('Your map pin is saved. Please enter your delivery PIN code and address.');
  const a = result.address;
  const place = {
    countryCode: a.country_code?.toUpperCase(), postcode: /^[1-9]\d{5}$/.test(a.postcode || '') ? a.postcode : '',
    city: a.city || a.town || a.municipality || a.village || a.county || '',
    locality: a.neighbourhood || a.suburb || a.village || a.hamlet || a.road || '',
    principalSubdivision: a.state || '', pinnedHouse: [a.house_number, a.road].filter(Boolean).join(', '),
  };
  if (place.postcode) addressCache.set(key, place);
  return place;
};
