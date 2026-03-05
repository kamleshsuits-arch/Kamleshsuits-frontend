import React, { useState } from "react";

const ProductFilter = ({ filters, setFilters, products }) => {
  // Extract unique options dynamically
  const CATEGORIES = [
    "Wedding",
    "Party Wear",
    "Festive",
    "Outdoor",
    "Karvachauth Spec.",
    "Office",
    "Casual",
    "Daily Wear"
  ];

  const availableTags = new Set([
    ...products.map((p) => p.type),
    ...products.flatMap((p) => p.categories || []),
    ...products.map((p) => p.session)
  ].filter(Boolean));

  const uniqueTypes = CATEGORIES.filter(cat => availableTags.has(cat));
  
  const uniqueColors = [
    ...new Set(
      products
        .flatMap((p) =>
          Array.isArray(p.colors)
            ? p.colors
            : (p.colors || "").split(",").map((c) => c.trim())
        )
        .filter(Boolean)
    ),
  ];

  const handleCheckboxChange = (category, value) => {
    setFilters((prev) => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        return { ...prev, [category]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [category]: [...current, value] };
      }
    });
  };

  const handleSortChange = (e) => {
    setFilters((prev) => ({ ...prev, sort: e.target.value }));
  };

  return (
    <div className="space-y-8 p-6 bg-white border border-stone-100 shadow-sm rounded-sm">
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <h3 className="font-serif text-xl text-primary">Filters</h3>
        <button 
          onClick={() => setFilters({})} 
          className="text-xs text-accent uppercase tracking-widest hover:text-primary transition"
        >
          Clear All
        </button>
      </div>

      {/* Sort By */}
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Sort By</h4>
        <select
          value={filters.sort || ""}
          onChange={handleSortChange}
          className="w-full p-3 bg-muted border-none text-secondary text-sm focus:ring-1 focus:ring-primary cursor-pointer"
        >
          <option value="">Featured</option>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="discount">Better Discount</option>
          <option value="rating">Customer Rating</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Price Range</h4>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Min"
            value={filters.minPrice || ""}
            onChange={(e) =>
              setFilters({ ...filters, minPrice: Number(e.target.value) })
            }
            className="w-full p-2 bg-muted border-none text-sm text-secondary focus:ring-1 focus:ring-primary placeholder-stone-400"
          />
          <span className="text-stone-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.maxPrice || ""}
            onChange={(e) =>
              setFilters({ ...filters, maxPrice: Number(e.target.value) })
            }
            className="w-full p-2 bg-muted border-none text-sm text-secondary focus:ring-1 focus:ring-primary placeholder-stone-400"
          />
        </div>
      </div>

      {/* Category / Type */}
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Category</h4>
        <div className="space-y-2">
          {uniqueTypes.slice(0, filters.showAllTypes ? undefined : 8).map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={(filters.type || []).includes(type)}
                  onChange={() => handleCheckboxChange("type", type)}
                  className="peer appearance-none w-4 h-4 border border-stone-300 rounded-sm checked:bg-primary checked:border-primary transition-colors"
                />
                <svg className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none left-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-sm text-secondary group-hover:text-primary transition">{type}</span>
            </label>
          ))}
          {uniqueTypes.length > 8 && (
            <button 
              onClick={() => setFilters(prev => ({ ...prev, showAllTypes: !prev.showAllTypes }))}
              className="text-xs text-accent font-bold uppercase tracking-wider hover:text-primary transition mt-2"
            >
              {filters.showAllTypes ? "- Show Less" : "+ Show More"}
            </button>
          )}
        </div>
      </div>

      {/* Colors */}
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Color</h4>
        <div className="flex flex-wrap gap-2">
          {uniqueColors.slice(0, filters.showAllColors ? undefined : 10).map((color) => (
            <button
              key={color}
              onClick={() => handleCheckboxChange("color", color)}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                (filters.color || []).includes(color)
                  ? "border-primary ring-1 ring-primary ring-offset-1"
                  : "border-stone-200 hover:border-stone-400"
              }`}
              title={color}
            >
              <div 
                className="w-6 h-6 rounded-full" 
                style={{ backgroundColor: (
                  {
                    "Black": "#000000", "White": "#FFFFFF", "Grey": "#808080", "Charcoal": "#36454f",
                    "Navy Blue": "#000080", "Royal Blue": "#4169E1", "Maroon": "#800000", "Emerald Green": "#50c878",
                    "Olive": "#808000", "Beige": "#F5F5DC", "Tan": "#D2B48C", "Dark Brown": "#654321",
                    "Red": "#FF0000", "Green": "#008000", "Blue": "#0000FF", "Yellow": "#FFFF00",
                    "Orange": "#FFA500", "Pink": "#FFC0CB", "Purple": "#800080", "Silver": "#C0C0C0",
                    "Gold": "#FFD700", "Copper": "#B87333", "Mustard": "#FFDB58", "Rust": "#B7410E",
                    "Ivory": "#FFFFF0", "Cream": "#FFFDD0", "Khaki": "#F0E68C", "Sky Blue": "#87CEEB",
                    "Teal": "#008080", "Wine": "#722F37"
                  }[color] || color.toLowerCase()
                ) }}
              ></div>
            </button>
          ))}
        </div>
        {uniqueColors.length > 10 && (
            <button 
              onClick={() => setFilters(prev => ({ ...prev, showAllColors: !prev.showAllColors }))}
              className="text-xs text-accent font-bold uppercase tracking-wider hover:text-primary transition mt-2 block"
            >
              {filters.showAllColors ? "- Show Less" : "+ Show More"}
            </button>
          )}
      </div>

      {/* Discount */}
      <div>
        <h4 className="text-sm font-bold text-primary uppercase tracking-widest mb-3">Discount</h4>
        <div className="space-y-2">
          {[10, 20, 30, 40, 50].map((disc) => (
            <label key={disc} className="flex items-center gap-3 cursor-pointer group">
               <div className="relative flex items-center">
                <input
                  type="radio"
                  name="minDiscount"
                  checked={filters.minDiscount === disc}
                  onChange={() => setFilters({ ...filters, minDiscount: disc })}
                  className="peer appearance-none w-4 h-4 border border-stone-300 rounded-full checked:border-primary checked:border-4 transition-all"
                />
              </div>
              <span className="text-sm text-secondary group-hover:text-primary transition">{disc}% or more</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;