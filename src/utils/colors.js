
export const COLOR_MAP = {
    "#000000": "Black", "#FFFFFF": "White", "#808080": "Grey", "#36454f": "Charcoal",
    "#000080": "Navy Blue", "#4169E1": "Royal Blue", "#800000": "Maroon", "#50c878": "Emerald Green",
    "#808000": "Olive", "#F5F5DC": "Beige", "#D2B48C": "Tan", "#654321": "Dark Brown",
    "#FF0000": "Red", "#008000": "Green", "#0000FF": "Blue", "#FFFF00": "Yellow",
    "#FFA500": "Orange", "#FFC0CB": "Pink", "#800080": "Purple", "#C0C0C0": "Silver",
    "#FFD700": "Gold", "#B87333": "Copper", "#FFDB58": "Mustard", "#B7410E": "Rust",
    "#FFFFF0": "Ivory", "#FFFDD0": "Cream", "#F0E68C": "Khaki", "#87CEEB": "Sky Blue",
    "#008080": "Teal", "#722F37": "Wine", "#7b3f00": "Chocolate", "#e6e6fa": "Lavender",
    "#00ffff": "Cyan", "#ff00ff": "Magenta", "#40e0d0": "Turquoise", "#faf0e6": "Linen",
    "#ffdab9": "Peach", "#a52a2a": "Brown", "#000000": "Black", "#ffffff": "White"
};

export const getColorName = (hex) => {
    hex = hex.toLowerCase();
    if (COLOR_MAP[hex]) return COLOR_MAP[hex];
    
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    let minDist = Infinity;
    let closestName = "Custom Color";
    
    for (const [h, name] of Object.entries(COLOR_MAP)) {
        const hr = parseInt(h.slice(1, 3), 16);
        const hg = parseInt(h.slice(3, 5), 16);
        const hb = parseInt(h.slice(5, 7), 16);
        const dist = Math.sqrt((r - hr)**2 + (g - hg)**2 + (b - hb)**2);
        if (dist < minDist) {
            minDist = dist;
            closestName = name;
        }
    }
    return closestName;
};

export const getColorDisplay = (name) => {
    if (!name) return "#E5E7EB"; // Stone-200 / Greyish fallback
    if (name.startsWith("#")) return name;
    
    const lowerName = name.toLowerCase();
    const entry = Object.entries(COLOR_MAP).find(([h, n]) => n.toLowerCase() === lowerName);
    if (entry) return entry[0];
    
    // Fallback if not found in map
    try {
        return name.toLowerCase().replace(/\s+/g, '');
    } catch(e) {
        return "#E5E7EB";
    }
};
