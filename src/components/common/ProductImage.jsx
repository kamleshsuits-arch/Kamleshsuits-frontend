import { useCallback, useState } from 'react';
import { imageSources } from '../../utils/imageDelivery';
import './ProductImage.css';

// Remount only the image state when a gallery or recycled card changes its source.
export default function ProductImage(props) {
  return <ImageFrame key={props.src || 'missing'} {...props} />;
}

function ImageFrame({ src, alt = '', className = 'h-full w-full object-cover',
  wrapperClassName = 'relative block h-full w-full', sizes, maxWidth = 960,
  compact = false, allowRetry = true, loading = 'lazy', decoding = 'async',
  onLoad, onError, ...props }) {
  const [status, setStatus] = useState(src ? 'loading' : 'error');
  const [original, setOriginal] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const sources = imageSources(src, { enabled: import.meta.env.PROD && !original, sizes, maxWidth });

  const imageRef = useCallback(image => {
    if (image?.complete && image.naturalWidth > 0) setStatus('loaded');
  }, []);

  function failed(event) {
    if (sources.srcSet && !original) {
      // A CDN failure must never hide a working original product photograph.
      setOriginal(true);
    } else {
      setStatus('error');
      onError?.(event);
    }
  }

  return (
    <span className={`product-image ${wrapperClassName}`} data-image-state={status}
      data-compact={compact || undefined} aria-busy={status === 'loading'}>
      {src && <img {...props} {...sources} key={attempt} ref={imageRef} alt={alt}
        className={className} loading={loading} decoding={decoding}
        style={{ ...props.style, visibility: status === 'loaded' ? undefined : 'hidden' }}
        onLoad={event => { setStatus('loaded'); onLoad?.(event); }} onError={failed} />}
      {status !== 'loaded' && <span className="product-image__veil" aria-hidden={props['aria-hidden']}>
        <span className="product-image__orbit" aria-hidden="true"><span /></span>
        {!compact && <span className="product-image__caption">{status === 'loading' ? 'Revealing your style' : 'Photo unavailable'}</span>}
        <span className="sr-only">{status === 'loading' ? 'Loading product image' : 'Product image unavailable'}</span>
        {status === 'error' && src && allowRetry && !compact && <button type="button"
          className="product-image__retry" aria-label={`Retry image${alt ? `: ${alt}` : ''}`}
          onClick={event => { event.stopPropagation(); event.preventDefault(); setStatus('loading'); setAttempt(value => value + 1); }}>
          Retry photo
        </button>}
      </span>}
    </span>
  );
}
