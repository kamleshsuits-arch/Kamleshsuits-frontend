import { useEffect, useState } from 'react';
import { HiCheck, HiCloudUpload, HiColorSwatch, HiPhotograph, HiPlus, HiSparkles, HiTrash, HiX } from 'react-icons/hi';
import { BiLoaderAlt } from 'react-icons/bi';
import { uploadProductImage } from '../../api/products';
import { getColorName } from '../../utils/colors';
import { extractDominantSuitColor } from '../../utils/imageColorExtractor';
import { isSupportedProductAsset, optimizeProductAsset } from '../../utils/productAssetOptimizer';
import { createEmptyVariant, MAX_PRODUCT_VARIANTS, MAX_VARIANT_IMAGES } from '../../utils/productVariants';

const ProductVariantManager = ({ variants, onChange, onUploadingChange, showToast }) => {
  const [uploadingCount, setUploadingCount] = useState(0);
  const [progress, setProgress] = useState({});

  useEffect(() => onUploadingChange?.(uploadingCount > 0), [uploadingCount, onUploadingChange]);

  const updateVariant = (id, patch) => onChange(current => current.map(variant => (
    variant.id === id ? { ...variant, ...(typeof patch === 'function' ? patch(variant) : patch) } : variant
  )));

  const removeVariant = id => {
    if (variants.length === 1) return showToast('A product set needs at least one colour variant.', null, 'error');
    onChange(current => current.filter(variant => variant.id !== id));
  };

  const addVariant = () => {
    if (variants.length >= MAX_PRODUCT_VARIANTS) return showToast(`You can add up to ${MAX_PRODUCT_VARIANTS} suit colours in one set.`, null, 'error');
    onChange(current => [...current, createEmptyVariant()]);
  };

  const uploadFiles = async (variant, fileList) => {
    const slots = MAX_VARIANT_IMAGES - variant.images.length;
    const files = Array.from(fileList || []).slice(0, slots);
    if (!files.length) return;
    const accepted = files.filter(file => isSupportedProductAsset(file) && file.size <= 20 * 1024 * 1024);
    if (accepted.length !== files.length) showToast('Unsupported files or files larger than 20 MB were skipped.', null, 'error');
    if (!accepted.length) return;

    setUploadingCount(count => count + 1);
    setProgress(current => ({ ...current, [variant.id]: `Preparing 0 / ${accepted.length}` }));
    try {
      let detected = null;
      if (!variant.images.length) {
        try { detected = await extractDominantSuitColor(accepted[0]); } catch (error) { console.warn('Automatic colour detection failed', error); }
      }

      const uploaded = [];
      for (let index = 0; index < accepted.length; index += 1) {
        setProgress(current => ({ ...current, [variant.id]: `Uploading ${index + 1} / ${accepted.length}` }));
        const optimized = await optimizeProductAsset(accepted[index]);
        uploaded.push(await uploadProductImage(optimized.file));
      }

      updateVariant(variant.id, current => ({
        images: [...current.images, ...uploaded].slice(0, MAX_VARIANT_IMAGES),
        ...(detected ? {
          colorHex: detected.hex,
          colorName: current.colorName || detected.name
        } : {})
      }));
      showToast(`${uploaded.length} pose${uploaded.length > 1 ? 's' : ''} added${detected ? ` · colour detected as ${detected.name}` : ''}.`, null, 'success');
    } catch (error) {
      console.error('Variant image upload failed', error);
      showToast(error.response?.data?.message || 'One or more variant images could not be uploaded.', null, 'error');
    } finally {
      setUploadingCount(count => Math.max(0, count - 1));
      setProgress(current => ({ ...current, [variant.id]: '' }));
    }
  };

  return (
    <div className="asset-section-card space-y-5">
      <div className="rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-4">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-500 text-white"><HiSparkles size={20} /></span>
          <div><p className="text-sm font-black text-stone-900">Add the complete suit set together</p><p className="mt-1 text-xs font-medium leading-5 text-stone-600">Create one card per colour, then upload front, side, back and detail poses inside that colour. The first photo becomes its cover and its dominant suit colour is detected automatically.</p></div>
        </div>
      </div>

      <div className="space-y-4">
        {variants.map((variant, variantIndex) => (
          <section key={variant.id} className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50">
            <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-xs font-black text-white">{variantIndex + 1}</span><div><h4 className="text-sm font-black text-stone-900">Colour variant {variantIndex + 1}</h4><p className="text-[11px] font-medium text-stone-500">{variant.images.length} / {MAX_VARIANT_IMAGES} pose images</p></div></div>
              <button type="button" onClick={() => removeVariant(variant.id)} disabled={variants.length === 1 || uploadingCount > 0} className="grid h-9 w-9 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label={`Remove colour variant ${variantIndex + 1}`}><HiTrash /></button>
            </div>

            <div className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-[88px_1fr_110px]">
                <label className="relative grid min-h-20 cursor-pointer place-items-center overflow-hidden rounded-2xl border-4 border-white shadow ring-1 ring-stone-200" title="Adjust detected colour">
                  <span className="absolute inset-0" style={{ backgroundColor: variant.colorHex }} />
                  <HiColorSwatch className="relative text-white drop-shadow" size={24} />
                  <input type="color" value={variant.colorHex} onChange={event => updateVariant(variant.id, { colorHex: event.target.value, colorName: getColorName(event.target.value) })} className="absolute inset-0 cursor-pointer opacity-0" aria-label={`Colour for variant ${variantIndex + 1}`} />
                </label>
                <div><label className="mb-2 block text-xs font-black text-stone-700">Colour name</label><input value={variant.colorName} onChange={event => updateVariant(variant.id, { colorName: event.target.value })} placeholder="Detected after first image" maxLength={40} className="asset-control" /></div>
                <div><label className="mb-2 block text-xs font-black text-stone-700">Stock</label><input type="number" min="0" value={variant.stock} onChange={event => updateVariant(variant.id, { stock: event.target.value })} className="asset-control" /></div>
              </div>

              {variant.images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {variant.images.map((image, imageIndex) => (
                    <div key={`${image}-${imageIndex}`} className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 bg-white ${imageIndex === 0 ? 'border-orange-400 shadow-md' : 'border-stone-200'}`}>
                      <img src={image} alt={`${variant.colorName || 'Suit'} pose ${imageIndex + 1}`} className="h-full w-full object-cover" />
                      <div className="absolute right-2 top-2 flex gap-1">
                        {imageIndex !== 0 && <button type="button" onClick={() => updateVariant(variant.id, current => ({ images: [image, ...current.images.filter((_, index) => index !== imageIndex)] }))} className="grid h-8 w-8 place-items-center rounded-full bg-white text-emerald-700 shadow" title="Make colour cover"><HiCheck size={14} /></button>}
                        <button type="button" onClick={() => updateVariant(variant.id, current => ({ images: current.images.filter((_, index) => index !== imageIndex) }))} className="grid h-8 w-8 place-items-center rounded-full bg-white text-red-600 shadow" title="Remove pose"><HiX size={14} /></button>
                      </div>
                      {imageIndex === 0 && <span className="absolute bottom-0 left-0 right-0 bg-orange-500/95 py-1.5 text-center text-[10px] font-black uppercase text-white">Colour cover</span>}
                    </div>
                  ))}
                </div>
              )}

              {variant.images.length < MAX_VARIANT_IMAGES && (
                <label className="flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 text-stone-700 transition hover:border-orange-400 hover:text-orange-700">
                  {progress[variant.id] ? <BiLoaderAlt className="animate-spin" size={24} /> : <HiCloudUpload size={25} />}
                  <span><span className="block text-sm font-black">{progress[variant.id] || (variant.images.length ? 'Add more poses' : 'Upload this colour')}</span><span className="mt-1 block text-xs font-medium text-stone-500">Select multiple pose images together</span></span>
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" disabled={Boolean(progress[variant.id])} onChange={event => { uploadFiles(variant, event.target.files); event.target.value = ''; }} className="sr-only" />
                </label>
              )}
            </div>
          </section>
        ))}
      </div>

      <button type="button" onClick={addVariant} disabled={variants.length >= MAX_PRODUCT_VARIANTS || uploadingCount > 0} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50 text-sm font-black text-orange-800 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"><HiPlus /> Add another suit colour ({variants.length}/{MAX_PRODUCT_VARIANTS})</button>
      <div className="flex items-center gap-2 text-xs font-medium text-stone-500"><HiPhotograph className="shrink-0" /> Up to {MAX_PRODUCT_VARIANTS} colours and {MAX_VARIANT_IMAGES} poses per colour. You can correct the detected colour at any time.</div>
    </div>
  );
};

export default ProductVariantManager;
