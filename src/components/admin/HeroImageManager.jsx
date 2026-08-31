import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HiCheck, HiColorSwatch, HiPencil, HiPhotograph, HiPlus, HiRefresh, HiTrash, HiUpload, HiX } from 'react-icons/hi';
import { deleteHeroImage, fetchAdminHeroImages, saveHeroImage } from '../../api/banners';
import { uploadProductImage } from '../../api/products';
import hero1 from '../../assets/hero1.webp';
import hero2 from '../../assets/hero2.jpg';
import rustic from '../../assets/Rustic.jpeg';
import naviBlue from '../../assets/Navi_blue.jpeg';
import brown from '../../assets/Brown.jpeg';

const DEFAULT_IMAGES = [
  { suitId: 'default-rustic', image: rustic, line_one: 'Featured piece', line_two: 'Rustic Suit', line_one_color: '#FDE68A', line_two_color: '#FFFFFF', builtIn: true },
  { suitId: 'default-navi-blue', image: naviBlue, line_one: 'Featured piece', line_two: 'Navi Blue Suit', line_one_color: '#FDE68A', line_two_color: '#FFFFFF', builtIn: true },
  { suitId: 'default-brown', image: brown, line_one: 'Featured piece', line_two: 'Brown Suit', line_one_color: '#FDE68A', line_two_color: '#FFFFFF', builtIn: true },
  { suitId: 'default-elegant', image: hero1, line_one: 'Featured piece', line_two: 'Elegant Suit', line_one_color: '#FDE68A', line_two_color: '#FFFFFF', builtIn: true },
  { suitId: 'default-cotton', image: hero2, line_one: 'Featured piece', line_two: 'Cotton Suit', line_one_color: '#FDE68A', line_two_color: '#FFFFFF', builtIn: true },
];

const EMPTY_HERO = {
  heroImageId: '', image: '', line_one: 'Featured piece', line_two: '',
  line_one_color: '#FDE68A', line_two_color: '#FFFFFF', alt_text: '', active: true, sort_order: 0, product_id: '',
};

const COLOR_PRESETS = ['#FFFFFF', '#FDE68A', '#FCD34D', '#FDBA74', '#FDA4AF', '#C4B5FD', '#86EFAC', '#1C1917', '#7F1D1D'];

const HeroImageManager = ({ showToast }) => {
  const [savedImages, setSavedImages] = useState([]);
  const [formData, setFormData] = useState(EMPTY_HERO);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const loadImages = useCallback(async () => {
    try {
      setSavedImages(await fetchAdminHeroImages() || []);
    } catch (error) {
      console.error('Failed to fetch hero images', error);
      showToast?.('Could not load saved hero images.', null, 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadImages(); }, [loadImages]);

  const openCreate = () => {
    setFormData({ ...EMPTY_HERO, sort_order: DEFAULT_IMAGES.length + savedImages.length });
    setShowForm(true);
    setTimeout(() => document.getElementById('hero-image-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const openEdit = item => {
    setFormData({ ...EMPTY_HERO, ...item, heroImageId: item.suitId });
    setShowForm(true);
    setTimeout(() => document.getElementById('hero-image-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  };

  const uploadImage = async file => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast?.('Please select a valid image file.', null, 'error');
    if (file.size > 20 * 1024 * 1024) return showToast?.('Hero images must be smaller than 20 MB.', null, 'error');
    try {
      setUploading(true);
      const image = await uploadProductImage(file);
      setFormData(current => ({ ...current, image }));
      showToast?.('Hero image uploaded.', null, 'success');
    } catch (error) {
      console.error('Hero image upload failed', error);
      showToast?.('Hero image upload failed. Please try again.', null, 'error');
    } finally { setUploading(false); }
  };

  const handleSave = async event => {
    event.preventDefault();
    if (!formData.image) return showToast?.('Upload a hero image first.', null, 'error');
    try {
      setSaving(true);
      await saveHeroImage({ ...formData, alt_text: formData.alt_text || formData.line_two });
      showToast?.(`Hero image ${formData.heroImageId ? 'updated' : 'added'}.`, null, 'success');
      setShowForm(false);
      setFormData(EMPTY_HERO);
      await loadImages();
    } catch (error) {
      showToast?.(error.response?.data?.message || 'Could not save hero image.', null, 'error');
    } finally { setSaving(false); }
  };

  const removeImage = async item => {
    if (!window.confirm(`Delete hero image “${item.line_two || 'Untitled'}”?`)) return;
    try {
      await deleteHeroImage(item.suitId);
      showToast?.('Hero image deleted.', null, 'success');
      await loadImages();
    } catch (error) {
      console.error('Hero image deletion failed', error);
      showToast?.('Could not delete hero image.', null, 'error');
    }
  };

  const images = [...DEFAULT_IMAGES, ...savedImages];

  return (
    <section className="admin-panel overflow-hidden border-amber-200">
      <div className="border-b border-amber-100 bg-gradient-to-r from-amber-50 via-white to-rose-50 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2"><HiPhotograph className="text-amber-700" /><h2 className="text-xl font-black text-primary">Hero image carousel</h2></div>
            <p className="mt-1 max-w-2xl text-sm text-stone-500">Separate from campaign banners. Manage the portrait product photos and the two caption lines shown over each highlighted image.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadImages} className="admin-secondary-button"><HiRefresh /> Refresh</button>
            <button type="button" onClick={showForm ? () => setShowForm(false) : openCreate} className="admin-primary-button">{showForm ? <HiX /> : <HiPlus />} {showForm ? 'Close' : 'Add hero image'}</button>
          </div>
        </div>
      </div>

      {showForm && (
        <form id="hero-image-editor" onSubmit={handleSave} className="scroll-mt-24 border-b border-stone-200 bg-white p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(240px,360px)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="relative mx-auto aspect-[3/4] max-w-64 overflow-hidden rounded-2xl bg-stone-200 shadow-lg">
                {formData.image ? <img src={formData.image} alt="Hero preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-5xl text-stone-300"><HiPhotograph /></div>}
                {formData.image && <HeroCaption item={formData} />}
              </div>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={event => uploadImage(event.target.files?.[0])} />
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="admin-secondary-button mt-4 w-full"><HiUpload /> {uploading ? 'Uploading…' : formData.image ? 'Replace hero image' : 'Upload hero image'}</button>
            </div>

            <div className="space-y-5">
              <div>
                <h3 className="font-black text-primary">Two text lines below the image</h3>
                <p className="mt-1 text-xs text-stone-500">Edit each paragraph and select its font color. The preview updates immediately.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="First paragraph" value={formData.line_one} onChange={value => setFormData(current => ({ ...current, line_one: value }))} placeholder="Featured piece" maxLength={60} />
                <ColorField label="First paragraph font color" value={formData.line_one_color} onChange={value => setFormData(current => ({ ...current, line_one_color: value }))} />
                <TextField label="Second paragraph" value={formData.line_two} onChange={value => setFormData(current => ({ ...current, line_two: value }))} placeholder="Rustic Suit" maxLength={100} />
                <ColorField label="Second paragraph font color" value={formData.line_two_color} onChange={value => setFormData(current => ({ ...current, line_two_color: value }))} />
              </div>
              <button type="submit" disabled={saving || uploading} className="admin-primary-button min-w-48"><HiCheck /> {saving ? 'Saving…' : formData.heroImageId ? 'Save hero image' : 'Add hero image'}</button>
            </div>
          </div>
        </form>
      )}

      <div className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div><h3 className="font-black text-primary">Current hero images</h3><p className="text-xs text-stone-500">Built-in and admin-added images currently available to the homepage carousel.</p></div>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-700">{images.length} images</span>
        </div>
        {loading ? <div className="py-10 text-center text-sm font-bold text-stone-400">Loading hero images…</div> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {images.map((item, index) => (
              <article key={item.suitId} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
                  <img src={item.image} alt={item.alt_text || item.line_two} className="h-full w-full object-cover" />
                  <HeroCaption item={item} />
                  <span className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white backdrop-blur-sm">0{index + 1}</span>
                </div>
                <div className="p-3">
                  <p className="truncate text-xs font-black text-primary">{item.line_two || 'Untitled hero'}</p>
                  {item.product_id && <span className="mt-2 inline-flex rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-black uppercase text-emerald-700">Linked product</span>}
                  {item.builtIn ? <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2 py-1 text-[9px] font-black uppercase text-stone-500">Built in</span> : (
                    <div className="mt-2 flex gap-2">
                      <button type="button" onClick={() => openEdit(item)} className="admin-secondary-button flex-1"><HiPencil /> Edit</button>
                      <button type="button" onClick={() => removeImage(item)} className="grid h-11 w-11 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50" aria-label={`Delete ${item.line_two || 'hero image'}`}><HiTrash /></button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const HeroCaption = ({ item }) => <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-12"><p className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: item.line_one_color || '#FDE68A' }}>{item.line_one}</p><p className="mt-0.5 font-serif text-sm font-bold" style={{ color: item.line_two_color || '#FFFFFF' }}>{item.line_two}</p></div>;

const TextField = ({ label, value, onChange, placeholder, maxLength }) => <label className="block"><span className="mb-1.5 flex items-center justify-between text-xs font-black uppercase tracking-wide text-stone-600"><span>{label}</span><small className="font-medium normal-case text-stone-400">{String(value || '').length}/{maxLength}</small></span><input value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)} placeholder={placeholder} className="asset-control" /></label>;

const ColorField = ({ label, value, onChange }) => <div className="rounded-xl border border-stone-200 bg-white p-3"><div className="flex items-center gap-3"><HiColorSwatch className="text-stone-400" /><input aria-label={`${label} picker`} type="color" value={value || '#FFFFFF'} onChange={event => onChange(event.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><span className="min-w-0 flex-1"><strong className="block text-xs text-stone-700">{label}</strong><small className="font-mono text-[10px] text-stone-500">{value}</small></span></div><div className="mt-3 flex flex-wrap gap-1.5">{COLOR_PRESETS.map(color => <button key={color} type="button" title={color} aria-label={`Use ${color}`} onClick={() => onChange(color)} className={`h-6 w-6 rounded-full border-2 shadow-sm ${String(value).toUpperCase() === color ? 'border-primary ring-2 ring-primary/15' : 'border-white'}`} style={{ backgroundColor: color }} />)}</div></div>;

export default HeroImageManager;
