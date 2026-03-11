/**
 * deliveryUtils.js
 * Shared delivery area utility for frontend.
 * Mirrors the backend region-prefix logic so the UI can do a quick
 * pre-check before hitting the network.
 */

// Supported region prefixes (first 3 digits of pincode)
export const SUPPORTED_PREFIXES = ['110', '122', '123', '124'];

/**
 * Quick client-side check: does this pincode *likely* belong to a supported region?
 * The backend is the definitive source — this is only for instant UI feedback.
 */
export const isLikelySupportedPin = (pin) => {
  if (!pin || String(pin).length !== 6) return false;
  return SUPPORTED_PREFIXES.some((prefix) => String(pin).startsWith(prefix));
};

// State mapping for supported prefixes
export const STATE_MAP = {
  '110': 'Delhi',
  '122': 'Haryana',
  '123': 'Haryana',
  '124': 'Haryana'
};

/**
 * Gets the state name based on pincode prefix
 */
export const getStateFromPin = (pin) => {
  if (!pin || pin.length < 3) return '';
  const prefix = String(pin).substring(0, 3);
  return STATE_MAP[prefix] || '';
};

// Human-readable region names for populating hints
export const SUPPORTED_REGIONS = [
  { prefix: '110', label: 'Delhi' },
  { prefix: '122', label: 'Gurgaon / Gurugram' },
  { prefix: '123', label: 'Rewari' },
  { prefix: '124', label: 'Jhajjar' },
];
