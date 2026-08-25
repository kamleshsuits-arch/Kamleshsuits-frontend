import { useEffect, useState } from 'react';
import { fetchProductTaxonomy } from '../api/products';
import { DEFAULT_PRODUCT_CATEGORY, FALLBACK_PRODUCT_TAXONOMY } from '../utils/productTaxonomy';

let cachedTaxonomy = null;

export const useProductTaxonomy = () => {
  const [taxonomy, setTaxonomy] = useState(cachedTaxonomy || FALLBACK_PRODUCT_TAXONOMY);
  const [defaultCategory, setDefaultCategory] = useState(DEFAULT_PRODUCT_CATEGORY);

  useEffect(() => {
    let active = true;
    fetchProductTaxonomy()
      .then(data => {
        if (!active || !Array.isArray(data?.categories) || !data.categories.length) return;
        cachedTaxonomy = data.categories;
        setTaxonomy(data.categories);
        setDefaultCategory(data.defaultCategory || DEFAULT_PRODUCT_CATEGORY);
      })
      .catch(() => {
        // Fallback keeps the catalogue usable during a cold backend start.
      });
    return () => { active = false; };
  }, []);

  return { taxonomy, defaultCategory };
};
