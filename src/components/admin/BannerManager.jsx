import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HiCalendar, HiCheck, HiExternalLink, HiEye, HiPhotograph,
  HiPencil, HiPlus, HiRefresh, HiTrash, HiUpload, HiX,
} from 'react-icons/hi';
import { deleteBanner, fetchAdminBanners, saveBanner } from '../../api/banners';
import { uploadProductImage } from '../../api/products';

const EMPTY_BANNER = {
  bannerId: '', title: '', banner_kind: 'festival', desktop_image: '', mobile_image: '',
  alt_text: '', headline: '', animated_words: '', headline_suffix: '',
  headline_color: '#FFFFFF', animated_word_color: '#FCD34D', headline_suffix_color: '#FFFFFF',
  subheading: '', cta_label: '', link_url: '', active: true,
  starts_at: '', ends_at: '', sort_order: 0,
};

const BANNER_KINDS = [
  ['festival', 'Festival'], ['offer', 'Offer'], ['sale', 'Sale'],
  ['discount', 'Discount'], ['new-products', 'New products'], ['general', 'General'],
];

const toLocalDateTimeInput = value => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const BannerManager = ({ showToast }) => {
  const [banners, setBanners] = useState([]);
  const [formData, setFormData] = useState(EMPTY_BANNER);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [showForm, setShowForm] = useState(false);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const loadBanners = useCallback(async () => {
    try {
      const data = await fetchAdminBanners();
      setBanners(data || []);
    } catch (error) {
      console.error('Failed to fetch banners', error);
      showToast?.('Could not load home banners.', null, 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadBanners(); }, [loadBanners]);

  const openCreate = () => {
    setFormData({ ...EMPTY_BANNER, sort_order: banners.length });
    setShowForm(true);
  };

  const openEdit = banner => {
    setFormData({
      ...EMPTY_BANNER,
      ...banner,
      bannerId: banner.suitId,
      animated_words: Array.isArray(banner.animated_words) ? banner.animated_words.join(', ') : (banner.animated_words || ''),
      starts_at: toLocalDateTimeInput(banner.starts_at),
      ends_at: toLocalDateTimeInput(banner.ends_at),
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadImage = async (file, field) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast?.('Please select a valid image file.', null, 'error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showToast?.('Banner images must be smaller than 20 MB.', null, 'error');
      return;
    }
    try {
      setUploading(field);
      const url = await uploadProductImage(file);
      setFormData(current => ({ ...current, [field]: url }));
      showToast?.(`${field === 'desktop_image' ? 'Desktop' : 'Mobile'} banner uploaded.`, null, 'success');
    } catch (error) {
      console.error('Banner upload failed', error);
      showToast?.('Banner upload failed. Please try again.', null, 'error');
    } finally { setUploading(''); }
  };

  const handleSave = async event => {
    event.preventDefault();
    if (!formData.desktop_image) {
      showToast?.('Upload a desktop banner image first.', null, 'error');
      return;
    }
    try {
      setSaving(true);
      await saveBanner({
        ...formData,
        animated_words: String(formData.animated_words || '').split(',').map(word => word.trim()).filter(Boolean),
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
      });
      showToast?.(`Banner ${formData.bannerId ? 'updated' : 'published'} successfully.`, null, 'success');
      setShowForm(false);
      setFormData(EMPTY_BANNER);
      await loadBanners();
    } catch (error) {
      showToast?.(error.response?.data?.message || 'Could not save banner.', null, 'error');
    } finally { setSaving(false); }
  };

  const toggleActive = async banner => {
    try {
      await saveBanner({ ...banner, bannerId: banner.suitId, active: !banner.active });
      await loadBanners();
    } catch (error) {
      console.error('Banner status update failed', error);
      showToast?.('Could not change banner status.', null, 'error');
    }
  };

  const removeBanner = async banner => {
    if (!window.confirm(`Delete banner “${banner.title}”?`)) return;
    try {
      await deleteBanner(banner.suitId);
      showToast?.('Banner deleted.', null, 'success');
      await loadBanners();
    } catch (error) {
      console.error('Banner deletion failed', error);
      showToast?.('Could not delete banner.', null, 'error');
    }
  };

  const getStatus = banner => {
    const now = Date.now();
    if (!banner.active) return ['Draft', 'bg-stone-100 text-stone-600'];
    if (banner.starts_at && new Date(banner.starts_at).getTime() > now) return ['Scheduled', 'bg-blue-50 text-blue-700'];
    if (banner.ends_at && new Date(banner.ends_at).getTime() < now) return ['Expired', 'bg-red-50 text-red-700'];
    return ['Live', 'bg-emerald-50 text-emerald-700'];
  };

  if (loading) return <div className="p-20 text-center font-bold text-stone-500 animate-pulse">Loading banner library…</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="admin-section-header">
        <div><h2 className="text-2xl font-black text-primary">Home banners</h2><p className="mt-1 text-sm text-stone-500">Publish festival, offer, sale, discount and new-product campaigns.</p></div>
        <div className="flex gap-2">
          <button onClick={loadBanners} className="admin-secondary-button"><HiRefresh /> Refresh</button>
          <button onClick={showForm ? () => setShowForm(false) : openCreate} className="admin-primary-button">{showForm ? <HiX /> : <HiPlus />} {showForm ? 'Close' : 'New banner'}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <strong>Responsive artwork:</strong> upload a wide desktop image (recommended 1920×720, 8:3) and a portrait mobile image (recommended 1080×1350, 4:5). If mobile artwork is omitted, the desktop image is cropped automatically.
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="admin-panel p-5 sm:p-7">
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Internal banner name" required value={formData.title} onChange={value => setFormData(current => ({ ...current, title: value }))} placeholder="Diwali Sale 2026" />
                <SelectField label="Campaign type" value={formData.banner_kind} onChange={value => setFormData(current => ({ ...current, banner_kind: value }))} options={BANNER_KINDS} />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <ImageUploader title="Desktop banner" detail="Recommended: 1920×720" image={formData.desktop_image} uploading={uploading === 'desktop_image'} onChoose={() => desktopInputRef.current?.click()} onClear={() => setFormData(current => ({ ...current, desktop_image: '' }))} />
                <ImageUploader title="Mobile banner" detail="Recommended: 1080×1350" image={formData.mobile_image} uploading={uploading === 'mobile_image'} onChoose={() => mobileInputRef.current?.click()} onClear={() => setFormData(current => ({ ...current, mobile_image: '' }))} />
                <input ref={desktopInputRef} type="file" accept="image/*" hidden onChange={event => uploadImage(event.target.files?.[0], 'desktop_image')} />
                <input ref={mobileInputRef} type="file" accept="image/*" hidden onChange={event => uploadImage(event.target.files?.[0], 'mobile_image')} />
              </div>

              <div className="rounded-2xl border border-violet-100 bg-violet-50/60 p-4 sm:p-5">
                <h3 className="font-black text-primary">Animated banner heading</h3>
                <p className="mt-1 text-xs text-stone-500">The middle word changes automatically every 3 seconds. Separate rotating words with commas.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <Field label="Text before" value={formData.headline} onChange={value => setFormData(current => ({ ...current, headline: value }))} placeholder="This Rakshabandhan gift" />
                  <Field label="Rotating words" value={formData.animated_words} onChange={value => setFormData(current => ({ ...current, animated_words: value }))} placeholder="Cotton, Silk, Organza" />
                  <Field label="Text after" value={formData.headline_suffix} onChange={value => setFormData(current => ({ ...current, headline_suffix: value }))} placeholder="suits" />
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ColorField label="Text before color" value={formData.headline_color} onChange={value => setFormData(current => ({ ...current, headline_color: value }))} />
                  <ColorField label="Rotating words color" value={formData.animated_word_color} onChange={value => setFormData(current => ({ ...current, animated_word_color: value }))} />
                  <ColorField label="Text after color" value={formData.headline_suffix_color} onChange={value => setFormData(current => ({ ...current, headline_suffix_color: value }))} />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Button label (optional)" value={formData.cta_label} onChange={value => setFormData(current => ({ ...current, cta_label: value }))} placeholder="Shop now" />
                <Field label="Supporting text (optional)" value={formData.subheading} onChange={value => setFormData(current => ({ ...current, subheading: value }))} placeholder="Celebrate with special prices across our new collection." />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Click destination" value={formData.link_url} onChange={value => setFormData(current => ({ ...current, link_url: value }))} placeholder="/sale or https://…" icon={<HiExternalLink />} />
                <Field label="Image alt text" value={formData.alt_text} onChange={value => setFormData(current => ({ ...current, alt_text: value }))} placeholder="Festival collection banner" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Starts at" type="datetime-local" value={formData.starts_at} onChange={value => setFormData(current => ({ ...current, starts_at: value }))} icon={<HiCalendar />} />
                <Field label="Ends at" type="datetime-local" value={formData.ends_at} onChange={value => setFormData(current => ({ ...current, ends_at: value }))} icon={<HiCalendar />} />
                <Field label="Display order" type="number" value={formData.sort_order} onChange={value => setFormData(current => ({ ...current, sort_order: value }))} />
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 p-4">
                <input type="checkbox" checked={formData.active} onChange={event => setFormData(current => ({ ...current, active: event.target.checked }))} className="h-4 w-4" />
                <span><strong className="block text-sm text-primary">Published</strong><small className="text-stone-500">The banner appears when its schedule is active.</small></span>
              </label>
              <button type="submit" disabled={saving || Boolean(uploading)} className="admin-primary-button min-w-48"><HiCheck /> {saving ? 'Saving…' : formData.bannerId ? 'Save banner' : 'Publish banner'}</button>
            </div>

            <div className="space-y-4">
              <h3 className="flex items-center gap-2 font-black text-primary"><HiEye /> Responsive preview</h3>
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
                {formData.desktop_image ? <div className="relative aspect-[8/3] w-full bg-cover bg-center" style={{ backgroundImage: `url(${formData.desktop_image})` }}><PreviewOverlay data={formData} /></div> : <div className="grid aspect-[8/3] place-items-center text-sm text-stone-400">Desktop preview</div>}
              </div>
              <div className="mx-auto w-48 overflow-hidden rounded-[1.5rem] border-4 border-stone-800 bg-stone-100 shadow-xl">
                {(formData.mobile_image || formData.desktop_image) ? <div className="relative aspect-[4/5] w-full bg-cover bg-center" style={{ backgroundImage: `url(${formData.mobile_image || formData.desktop_image})` }}><PreviewOverlay data={formData} compact /></div> : <div className="grid aspect-[4/5] place-items-center text-xs text-stone-400">Mobile preview</div>}
              </div>
            </div>
          </div>
        </form>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {banners.map(banner => {
          const [status, statusClass] = getStatus(banner);
          return (
            <article key={banner.suitId} className="admin-panel overflow-hidden">
              <picture><source media="(max-width: 640px)" srcSet={banner.mobile_image || banner.desktop_image} /><img src={banner.desktop_image} alt={banner.alt_text || banner.title} className="aspect-[8/3] w-full bg-stone-100 object-cover" /></picture>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase text-stone-400">{banner.banner_kind}</p><h3 className="mt-1 font-black text-primary">{banner.title}</h3></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>{status}</span></div>
                <p className="mt-3 text-xs text-stone-500">Order {banner.sort_order || 0}{banner.starts_at ? ` · Starts ${new Date(banner.starts_at).toLocaleDateString('en-IN')}` : ''}</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(banner)} className="admin-secondary-button flex-1"><HiPencil /> Edit</button>
                  <button onClick={() => toggleActive(banner)} className="admin-secondary-button"><HiPhotograph /> {banner.active ? 'Unpublish' : 'Publish'}</button>
                  <button onClick={() => removeBanner(banner)} className="grid h-11 w-11 place-items-center rounded-xl border border-red-100 text-red-600 hover:bg-red-50" aria-label={`Delete ${banner.title}`}><HiTrash /></button>
                </div>
              </div>
            </article>
          );
        })}
        {!banners.length && <div className="admin-panel col-span-full grid min-h-64 place-items-center p-8 text-center"><div><HiPhotograph className="mx-auto text-5xl text-stone-200" /><p className="mt-3 font-bold text-stone-500">No banners yet. Publish your first home campaign.</p></div></div>}
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, type = 'text', placeholder = '', required = false, icon }) => <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-stone-600">{label}</span><span className="relative block">{icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">{icon}</span>}<input required={required} type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} className={`asset-control ${icon ? 'asset-control-with-icon' : ''}`} /></span></label>;

const SelectField = ({ label, value, onChange, options }) => <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-stone-600">{label}</span><select value={value} onChange={event => onChange(event.target.value)} className="asset-control">{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;

const ColorField = ({ label, value, onChange }) => <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white p-3"><input type="color" value={value || '#FFFFFF'} onChange={event => onChange(event.target.value.toUpperCase())} className="h-10 w-12 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><span><strong className="block text-xs text-stone-700">{label}</strong><small className="font-mono text-[10px] text-stone-400">{value}</small></span></label>;

const ImageUploader = ({ title, detail, image, uploading, onChoose, onClear }) => <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black text-primary">{title}</p><p className="text-xs text-stone-400">{detail}</p></div>{image && <button type="button" onClick={onClear} className="text-red-500"><HiX /></button>}</div>{image ? <img src={image} alt="" className="mb-3 aspect-[8/3] w-full rounded-xl object-cover" /> : <div className="mb-3 grid aspect-[8/3] place-items-center rounded-xl border border-dashed border-stone-300 bg-white text-3xl text-stone-300"><HiPhotograph /></div>}<button type="button" onClick={onChoose} disabled={uploading} className="admin-secondary-button w-full"><HiUpload /> {uploading ? 'Uploading…' : image ? 'Replace image' : 'Upload image'}</button></div>;

const PreviewOverlay = ({ data, compact = false }) => {
  const firstWord = String(data.animated_words || '').split(',').map(word => word.trim()).filter(Boolean)[0];
  return <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/75 via-black/20 to-transparent p-3 text-white"><div><p className={`${compact ? 'text-[9px]' : 'text-xs'} font-serif font-bold leading-tight`}><span style={{ color: data.headline_color || '#FFFFFF' }}>{data.headline}</span>{firstWord && <> <span style={{ color: data.animated_word_color || '#FCD34D' }}>{firstWord}</span></>} {data.headline_suffix && <span style={{ color: data.headline_suffix_color || '#FFFFFF' }}>{data.headline_suffix}</span>}</p>{data.subheading && <p className="mt-1 line-clamp-2 text-[7px] text-white/85">{data.subheading}</p>}</div></div>;
};

export default BannerManager;
