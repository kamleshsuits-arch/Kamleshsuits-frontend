import { HiCheck, HiHome, HiLink, HiPhotograph } from 'react-icons/hi';

const COLOR_PRESETS = ['#FFFFFF', '#FDE68A', '#FCD34D', '#FDBA74', '#FDA4AF', '#C4B5FD', '#1C1917', '#7F1D1D'];

const ProductHeroFeature = ({ value, onChange, variants, productTitle }) => {
  const images = (variants || []).flatMap(variant => variant.images || []).filter(Boolean);
  const selectedImage = images.includes(value.image) ? value.image : (images[0] || '');

  const update = patch => onChange(current => ({ ...current, ...patch }));
  const toggle = () => update({
    enabled: !value.enabled,
    image: value.image || images[0] || '',
    line_two: value.line_two || productTitle || ''
  });

  return (
    <div className="asset-section-card overflow-hidden !p-0">
      <button type="button" onClick={toggle} className={`flex w-full items-center justify-between gap-4 p-5 text-left transition ${value.enabled ? 'bg-gradient-to-r from-amber-50 to-orange-50' : 'bg-white hover:bg-stone-50'}`} aria-pressed={value.enabled}>
        <span className="flex items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${value.enabled ? 'bg-orange-500 text-white' : 'bg-stone-100 text-stone-500'}`}><HiHome size={21} /></span><span><strong className="block text-sm font-black text-stone-900">Feature this product in the homepage hero</strong><small className="mt-1 block text-xs font-medium leading-5 text-stone-500">Reuse an uploaded product image and link it directly to this product page.</small></span></span>
        <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${value.enabled ? 'bg-orange-500' : 'bg-stone-300'}`}><span className={`absolute top-1 grid h-5 w-5 place-items-center rounded-full bg-white text-[10px] text-orange-600 shadow transition ${value.enabled ? 'left-6' : 'left-1'}`}>{value.enabled && <HiCheck />}</span></span>
      </button>

      {value.enabled && (
        <div className="space-y-5 border-t border-orange-100 p-5">
          <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-bold leading-5 text-emerald-800"><HiLink className="mt-0.5 shrink-0" /> The link is created automatically after the product is saved. Customers will open its product details page.</div>

          <div>
            <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-black text-stone-800">Choose the hero image</p><p className="text-xs font-medium text-stone-500">Select any colour or pose already uploaded above.</p></div><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-black text-stone-600">{images.length} available</span></div>
            {images.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">{images.map((image, index) => <button key={`${image}-${index}`} type="button" onClick={() => update({ image })} className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 transition ${selectedImage === image ? 'border-orange-500 ring-2 ring-orange-200' : 'border-stone-200 hover:border-orange-300'}`} aria-label={`Use product image ${index + 1} in homepage hero`}><img src={image} alt="" className="h-full w-full object-cover" />{selectedImage === image && <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-orange-500 text-white shadow"><HiCheck size={13} /></span>}</button>)}</div> : <div className="flex min-h-24 items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 text-xs font-bold text-stone-500"><HiPhotograph size={20} /> Upload product images above first.</div>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HeroTextField label="First line" value={value.line_one} onChange={line_one => update({ line_one })} placeholder="Featured piece" />
            <HeroColorField label="First line colour" value={value.line_one_color} onChange={line_one_color => update({ line_one_color })} />
            <HeroTextField label="Product line" value={value.line_two} onChange={line_two => update({ line_two })} placeholder={productTitle || 'Product name'} />
            <HeroColorField label="Product line colour" value={value.line_two_color} onChange={line_two_color => update({ line_two_color })} />
          </div>

          {selectedImage && <div className="mx-auto max-w-48 overflow-hidden rounded-2xl border-4 border-white bg-stone-100 shadow-xl"><div className="relative aspect-[3/4]"><img src={selectedImage} alt="Homepage hero preview" className="h-full w-full object-cover" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent px-3 pb-3 pt-12"><p className="text-[9px] font-black uppercase tracking-[0.18em]" style={{ color: value.line_one_color }}>{value.line_one}</p><p className="font-serif text-sm font-bold" style={{ color: value.line_two_color }}>{value.line_two || productTitle}</p></div></div></div>}
        </div>
      )}
    </div>
  );
};

const HeroTextField = ({ label, value, onChange, placeholder }) => <label><span className="mb-1.5 block text-xs font-black text-stone-700">{label}</span><input value={value || ''} onChange={event => onChange(event.target.value)} maxLength={100} placeholder={placeholder} className="asset-control" /></label>;

const HeroColorField = ({ label, value, onChange }) => <div><span className="mb-1.5 block text-xs font-black text-stone-700">{label}</span><div className="flex min-h-12 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3"><input type="color" value={value || '#FFFFFF'} onChange={event => onChange(event.target.value.toUpperCase())} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0" aria-label={label} /><div className="flex flex-wrap gap-1">{COLOR_PRESETS.map(color => <button key={color} type="button" onClick={() => onChange(color)} className={`h-5 w-5 rounded-full border-2 ${String(value).toUpperCase() === color ? 'border-primary' : 'border-white'}`} style={{ backgroundColor: color }} aria-label={`Use ${color}`} />)}</div></div></div>;

export default ProductHeroFeature;
