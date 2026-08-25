const STORAGE_KEY = 'kamlesh_guest_order_refs';

export const getGuestOrderReferences = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

export const saveGuestOrderReference = ({ orderId, trackingToken, phone, createdAt }) => {
  if (!orderId) return;
  const current = getGuestOrderReferences().filter(reference => reference.orderId !== orderId);
  const next = [{ orderId, trackingToken, phone, createdAt: createdAt || new Date().toISOString() }, ...current].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
};
