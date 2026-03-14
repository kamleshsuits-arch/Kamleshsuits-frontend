
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchProducts, addProduct, updateProduct, deleteProduct, uploadProductImage } from '../api/products';
import { 
    HiPlus, HiPencil, HiTrash, HiPhotograph, HiCurrencyRupee, 
    HiTag, HiCube, HiX, HiCollection, HiCheck,
    HiSearch, HiTrendingUp, HiUsers, HiCubeTransparent, HiChevronDown, HiChevronUp,
    HiCloudUpload, HiScissors, HiPresentationChartLine, HiDatabase, HiRefresh,
    HiCamera, HiIdentification, HiColorSwatch, HiCursorClick, HiStar, HiTruck
} from 'react-icons/hi';
import { BiLoaderAlt } from 'react-icons/bi';
import AnalyticsTerminal from '../components/admin/AnalyticsTerminal';
import CouponManager from '../components/admin/CouponManager';
import DeliveryDemandInsights from '../components/admin/DeliveryDemandInsights';
import Loader from '../components/common/Loader';
import { useCart } from '../hooks/useCart';
import { getColorName, getColorDisplay } from '../utils/colors';

const FABRIC_STRUCTURE = {
    "Cotton Family (Most Selling – Daily Wear)": [
        "Pure Cotton Suit", "Cambric Cotton", "Mulmul Cotton", "Khadi Cotton", 
        "Slub Cotton", "Linen Cotton", "Cotton Satin", "Cotton Silk", 
        "Chanderi Cotton", "Handloom Cotton", "Organic Cotton"
    ],
    "Silk Family (Festive & Wedding)": [
        "Pure Silk Suit", "Banarasi Silk Suit", "Tussar Silk (Kosa)", "Raw Silk Suit", 
        "Chanderi Silk", "Maheshwari Silk", "Mysore Silk", "Art Silk", 
        "Silk Cotton", "Dupion Silk"
    ],
    "Rayon & Semi-Synthetic (Very High Demand)": [
        "Rayon Suit", "Rayon Slub", "Rayon Flex", "Rayon Slub Cotton", 
        "Modal Rayon", "Viscose Rayon", "Bamboo Rayon"
    ],
    "Synthetic Fabrics (Low Cost, Mass Market)": [
        "Georgette Suit", "Chiffon Suit", "Crepe Suit", "Poly Cotton Suit", 
        "Poly Silk Suit", "American Crepe", "Soft Net Suit"
    ],
    "Wool & Winter Suits": [
        "Woolen Suit", "Pashmina Suit", "Velvet Suit", "Tweed Suit", "Acrylic Wool Blend"
    ],
    "Linen Family (Premium Summer Wear)": [
        "Pure Linen Suit", "Linen Cotton Suit", "Printed Linen Suit", "Handloom Linen"
    ],
    "Net & Embroidered Fabrics (Heavy Wear)": [
        "Net Suit", "Embroidered Net Suit", "Sequin Net Suit", "Thread Work Net Suit"
    ]
};

const AdminDashboard = () => {
    const { isAdmin, loading: authLoading } = useAuth();
    const { showToast } = useCart();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    
    // UI Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
    const coverInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Enhanced Form Data
    const [formData, setFormData] = useState({
        title: '',
        categories: [],
        fabric_family: '',
        fabric_category: '',
        price: '',
        discount: 0,
        description: '',
        image: '', 
        images: [], 
        colors: [], 
        stock: 4,
        rating: 4.1,
        reviews: 26
    });

    const [newColor, setNewColor] = useState('#000000');



    const pickColorFromImage = async () => {
        if (!window.EyeDropper) {
            showToast('API Not Supported: Please use a modern browser (Chrome/Edge) for EyeDropper functionality.', null, 'error');
            return;
        }
        const eyeDropper = new window.EyeDropper();
        try {
            const result = await eyeDropper.open();
            const colorName = getColorName(result.sRGBHex);
            setNewColor(result.sRGBHex);
            if (!formData.colors.includes(colorName)) {
                setFormData(prev => ({...prev, colors: [...prev.colors, colorName]}));
                showToast(`Color Captured: Shade ${colorName} registered in asset DNA.`, null, 'success');
            }
        } catch (e) {
            console.log('Color picker cancelled');
        }
    };

    useEffect(() => { 
        loadProducts(); 
        const handleFocus = () => loadProducts(false);
        window.addEventListener('focus', handleFocus);
        
        // Background polling for real-time visibility
        const pollInterval = setInterval(() => loadProducts(false), 30000);

        return () => {
            window.removeEventListener('focus', handleFocus);
            clearInterval(pollInterval);
        };
    }, []);

    const loadProducts = async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const data = await fetchProducts();
            setProducts(data || []);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            if (showLoader) setLoading(false);
        }
    };

    if (authLoading) return (
        <Loader message="Authenticating Secure Session..." />
    );
    
    if (!isAdmin) return <Navigate to="/" />;

    if (loading && products.length === 0) return (
        <Loader message="Establishing Asset Relay..." />
    );

    const uploadImage = async (file) => {
        setUploading(true);
        try {
            const fileUrl = await uploadProductImage(file);
            console.log("Successfully uploaded image to S3:", fileUrl);
            return fileUrl;
        } catch (err) {
            console.error("Upload exception details:", err.response?.data || err.message);
            const backendMsg = err.response?.data?.message || err.response?.data?.error || 'An unexpected error occurred during asset relay.';
            showToast('System Error: ' + backendMsg, null, 'error');
            return null;
        } finally {
            setUploading(false);
        }
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const filteredProducts = products
        .filter(p => {
            const search = searchTerm.toLowerCase();
            const categoriesStr = Array.isArray(p.categories) ? p.categories.join(" ") : (p.categories || "");
            return (
                p.title?.toLowerCase().includes(search) || 
                (p.session || "").toLowerCase().includes(search) ||
                categoriesStr.toLowerCase().includes(search) ||
                p.type?.toLowerCase().includes(search) ||
                p.fabric_family?.toLowerCase().includes(search) ||
                p.fabric_category?.toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            const aVal = a[sortConfig.key] || '';
            const bVal = b[sortConfig.key] || '';
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const handleOpenModal = (product = null) => {
        if (product) {
            setEditingProduct(product);
            const cats = Array.isArray(product.categories) 
                ? product.categories 
                : (product.session || product.categories || "").split(",").map(c => c.trim()).filter(Boolean);
            
            setFormData({ 
                ...product, 
                categories: cats,
                images: product.images || [], 
                colors: product.colors || [],
                fabric_family: product.fabric_family || '',
                fabric_category: product.fabric_category || '',
                rating: product.rating || 4.1,
                reviews: product.reviews || 26
            });
        } else {
            setEditingProduct(null);
            setFormData({ 
                title: '', categories: [], price: '', discount: 0, description: '', 
                image: '', images: [], colors: [], stock: 4,
                fabric_family: '', fabric_category: '',
                rating: 4.1, reviews: 26
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to decommission this asset?')) {
            try {
                await deleteProduct(id);
                showToast('Asset removed', null, 'success');
                loadProducts();
            } catch (error) {
                showToast('Deletion failed', null, 'error');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Client-side validation
        if (!formData.title?.trim()) {
            showToast('Input Required: Please enter an asset title.', null, 'error');
            return;
        }
        if (!formData.price || formData.price <= 0) {
            showToast('Invalid Price: Asset must have a positive value.', null, 'error');
            return;
        }
        if (!formData.fabric_family || !formData.fabric_category) {
            showToast('Fabric Details Missing: Please select both family and category.', null, 'error');
            return;
        }

        let dataToSave = {};
        try {
            setIsSaving(true);
            const price = parseFloat(formData.price) || 0;
            const discount = parseInt(formData.discount) || 0;
            const stock = parseInt(formData.stock) || 0;
            
            // Ensure all numbers are valid
            const safePrice = isNaN(price) ? 0 : price;
            const safeDiscount = isNaN(discount) ? 0 : discount;
            const safeStock = isNaN(stock) ? 0 : stock;
            
            const mrp = (safeDiscount >= 100) ? safePrice : Math.round(safePrice / (1 - (safeDiscount / 100)));
            const safeMrp = (isNaN(mrp) || !isFinite(mrp)) ? safePrice : mrp;

            dataToSave = { 
                title: formData.title.trim(),
                description: (formData.description || '').trim(),
                price: safePrice, 
                discount: safeDiscount,
                mrp: safeMrp,
                type: 'suit',
                image: formData.images[0] || '',
                images: formData.images || [],
                colors: formData.colors || [],
                categories: formData.categories || [],
                fabric_family: formData.fabric_family, 
                fabric_category: formData.fabric_category,
                stock: safeStock,
                rating: parseFloat(formData.rating) || 4.1,
                reviews: parseInt(formData.reviews) || 26,
                session: `${formData.fabric_category}${formData.fabric_family ? ` (${formData.fabric_family})` : ''} - [${(formData.categories || []).join(", ")}]`
            };
            
            if (editingProduct) {
                const updated = await updateProduct(editingProduct.suitId, dataToSave);
                setProducts(prev => prev.map(p => p.suitId === editingProduct.suitId ? ({...p, ...updated}) : p));
                showToast(`Asset Updated: ${formData.title} - Successfully synchronized with global catalog.`, null, 'success');
            } else {
                const created = await addProduct(dataToSave);
                setProducts(prev => [created, ...prev]);
                showToast(`Asset Published: ${formData.title} - New suit is now live on the storefront.`, null, 'success');
            }
            setIsModalOpen(false);
            // Re-fetch to ensure all fields are perfectly in sync with DB
            setTimeout(() => loadProducts(false), 500);
        } catch (error) {
            console.error("Submission Error:", error);
            const errorMsg = error.response?.data?.message || error.message || 'The server rejected the asset broadcast.';
            showToast('Sync Failure: ' + errorMsg, null, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCoverUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = await uploadImage(file);
            if (url) {
                setFormData({ ...formData, image: url });
                showToast('Primary Visual Updated: New cover asset synchronized.', null, 'success');
            }
        }
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files);
        const newUrls = [];
        for (const file of files) {
            const url = await uploadImage(file);
            if (url) newUrls.push(url);
        }
        if (newUrls.length > 0) {
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
            showToast(`Gallery Updated: ${newUrls.length} new assets registered.`, null, 'success');
        }
    };

    const ColorPill = ({ color, onRemove }) => (
        <div className="group/color relative flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-stone-100 shadow-sm">
            <div className="w-3 h-3 rounded-full border border-stone-100" style={{ backgroundColor: getColorDisplay(color) }} />
            <span className="text-[9px] font-bold text-stone-500 uppercase">{color}</span>
            <button type="button" onClick={() => onRemove(color)} className="ml-1 opacity-100 text-red-500"><HiX size={10} /></button>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Global Admin Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight uppercase tracking-[0.05em]">Admin OS</h1>
                        <p className="text-stone-400 font-bold text-[10px] uppercase tracking-widest mt-1">Strategic Operations & Global Control</p>
                    </div>

                    <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-stone-200 backdrop-blur-sm">
                        <button 
                            onClick={() => setActiveTab('inventory')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiDatabase size={16} /> Inventory Terminal
                        </button>
                        <button 
                            onClick={() => setActiveTab('coupons')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiTag size={16} /> Coupon Control
                        </button>
                        <button 
                            onClick={() => setActiveTab('analytics')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiPresentationChartLine size={16} /> Growth Studio
                        </button>
                        <button 
                            onClick={() => setActiveTab('delivery')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'delivery' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiTruck size={16} /> Delivery Expansion
                        </button>
                    </div>
                </div>

                {activeTab === 'inventory' ? (
                    <>
                        {/* Tab Content Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 animate-in fade-in duration-700">
                            <div className="flex items-center gap-4">
                                 <div className="w-2 h-10 bg-accent rounded-full" />
                                 <div>
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-xl font-black text-primary uppercase tracking-tight">Active Collection</h2>
                                        <span className="px-3 py-1 bg-stone-100 rounded-full text-[9px] font-black text-stone-500 uppercase tracking-widest border border-stone-200">
                                            {filteredProducts.length} Total Suits
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Manage Global Assets</p>
                                 </div>
                            </div>
                            
                            <div className="flex gap-4 w-full md:w-auto">
                                <div className="relative flex-1 md:w-72">
                                    <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                                    <input 
                                        type="text"
                                        placeholder="Filter by title, type, fabric..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none text-xs font-bold transition-all shadow-sm"
                                    />
                                </div>
                                <button 
                                    onClick={() => handleOpenModal()}
                                    className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-accent transition-all shadow-2xl shadow-primary/20 shrink-0"
                                >
                                    <HiPlus /> New Asset
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <div className="bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-stone-50/80 backdrop-blur-md">
                                            <tr className="border-b border-stone-100">
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Asset Info</th>
                                                <TableHead label="Category" sortKey="session" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Fabric" sortKey="fabric_family" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Price" sortKey="price" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Disp %" sortKey="discount" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Stock" sortKey="stock" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Added" sortKey="created_at" currentSort={sortConfig} onSort={handleSort} />
                                                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-right">Ops</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-stone-50">
                                            {filteredProducts.map((product) => (
                                                <tr key={product.suitId} className="hover:bg-stone-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                 <img 
                                                                    src={
                                                                        Array.isArray(product.images) && product.images[0]
                                                                        ? product.images[0]
                                                                        : String(product.images || product.image || '').replace(/[\[\]"]/g, '').split(',')[0] || 'https://via.placeholder.com/100x130'
                                                                    } 
                                                                    alt="" 
                                                                    className="w-20 h-28 object-cover rounded-xl bg-stone-100 shadow-sm border border-stone-200" 
                                                                 />
                                                                 {product.discount > 20 && <div className="absolute -top-1 -left-1 bg-highlight text-[7px] font-black text-white px-2 py-0.5 rounded-full">HOT</div>}
                                                            </div>
                                                            <div className="flex flex-col justify-center min-w-0">
                                                                <p className="text-sm font-black text-primary leading-tight mb-1">{product.title}</p>
                                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none">Suit</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest block w-fit leading-relaxed">{product.session || product.categories || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 font-bold text-xs text-stone-600">
                                                         <div className="flex flex-col">
                                                              <span className="text-[10px] font-black text-primary uppercase">{product.fabric_family || 'Standard'}</span>
                                                              <span className="text-[9px] text-stone-400 uppercase font-bold">{product.fabric_category || 'General'}</span>
                                                         </div>
                                                    </td>
                                                    <td className="px-8 py-5 font-black text-sm text-primary">₹{(product.price || 0).toString()}</td>
                                                    <td className="px-8 py-5">
                                                         <span className="text-xs font-black text-highlight">{(product.discount || 0).toString()}%</span>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-2 font-black text-xs text-stone-600">
                                                             <HiCubeTransparent className={(product.stock || 0) < 15 ? 'text-red-500' : 'text-emerald-500'} />
                                                             <span>{(product.stock || 0).toString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="flex flex-col text-[10px] text-stone-400 font-bold uppercase">
                                                             <span>{new Date(product.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => handleOpenModal(product)} className="p-3 text-stone-400 hover:text-primary hover:bg-white rounded-xl shadow-sm border border-stone-100 hover:border-stone-200 transition-all"><HiPencil size={18} /></button>
                                                            <button onClick={() => handleDelete(product.suitId)} className="p-3 text-stone-400 hover:text-red-500 hover:bg-white rounded-xl shadow-sm border border-stone-100 hover:border-red-100 transition-all"><HiTrash size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : activeTab === 'coupons' ? (
                    <CouponManager showToast={showToast} />
                ) : activeTab === 'delivery' ? (
                    <DeliveryDemandInsights />
                ) : (
                    <AnalyticsTerminal products={products} />
                )}
            </div>

            {/* Global Modal System */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col scale-in-center">
                        <div className="px-10 py-8 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
                            <div>
                                <h2 className="text-2xl font-black text-primary uppercase tracking-widest flex items-center gap-3">
                                    <HiCubeTransparent className="text-accent" />
                                    {editingProduct ? 'Update Asset' : 'New Listing'}
                                </h2>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] mt-1">Fabric Intelligence & Inventory System</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all shadow-sm">
                                <HiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-10 py-10 overflow-y-auto custom-scrollbar bg-white">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                {/* Left Form Section */}
                                <div className="space-y-8">
                                    <FormSectionTitle label="Fabric Architecture" />
                                    <div className="bg-stone-50 p-8 rounded-[2rem] border border-stone-100 space-y-6">
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Fabric Family</label>
                                            <input 
                                                type="text"
                                                list="fabric-families"
                                                value={formData.fabric_family} 
                                                onChange={(e) => setFormData({...formData, fabric_family: e.target.value})} 
                                                placeholder="Select or type Fabric Family..."
                                                className="w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary focus:ring-2 focus:ring-accent shadow-sm"
                                            />
                                            <datalist id="fabric-families">
                                                {Object.keys(FABRIC_STRUCTURE).map(family => (
                                                    <option key={family} value={family} />
                                                ))}
                                            </datalist>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Specialized Category</label>
                                            <input 
                                                type="text"
                                                list="fabric-categories"
                                                value={formData.fabric_category} 
                                                onChange={(e) => setFormData({...formData, fabric_category: e.target.value})} 
                                                disabled={!formData.fabric_family}
                                                placeholder={formData.fabric_family ? "Select or type Category..." : "Choose Family First"}
                                                className={`w-full px-6 py-4 bg-white border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary focus:ring-2 focus:ring-accent shadow-sm ${!formData.fabric_family && 'opacity-50 cursor-not-allowed'}`}
                                            />
                                            <datalist id="fabric-categories">
                                                {FABRIC_STRUCTURE[formData.fabric_family] && FABRIC_STRUCTURE[formData.fabric_family].map(cat => (
                                                    <option key={cat} value={cat} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>

                                    <FormSectionTitle label="Core Attributes" />
                                    <InputBox label="Asset Title" value={formData.title} onChange={(v) => setFormData({...formData, title: v})} />
                                    
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest pl-2">Segment Classification</label>
                                        <div className="grid grid-cols-2 gap-3 p-6 bg-stone-50 rounded-[2rem] border border-stone-100">
                                            {["Wedding", "Daily Wear", "Party Wear", "Festive", "Karvachauth Spec.", "Outdoor", "Office", "Casual"].map(cat => (
                                                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.categories.includes(cat)}
                                                        onChange={(e) => {
                                                            const newCats = e.target.checked 
                                                                ? [...formData.categories, cat]
                                                                : formData.categories.filter(c => c !== cat);
                                                            setFormData({...formData, categories: newCats});
                                                        }}
                                                        className="w-4 h-4 border-stone-300 rounded text-primary focus:ring-accent"
                                                    />
                                                    <span className="text-[10px] font-black text-stone-500 uppercase group-hover:text-primary">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <InputBox label="Price (₹)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} icon={<HiCurrencyRupee />} />
                                        <InputBox label="Disc (%)" type="number" color="text-highlight" value={formData.discount} onChange={(v) => setFormData({...formData, discount: v})} icon={<HiTag />} />
                                    </div>
                                </div>

                                {/* Right Form Section */}
                                <div className="space-y-8">
                                    <FormSectionTitle label="Visual Identity" />
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-2">Product Assets Gallery</label>
                                            <span className="text-[8px] font-black text-accent uppercase tracking-widest">First image is Primary</span>
                                        </div>
                                        
                                        <div className="grid grid-cols-4 gap-4 p-6 bg-stone-50 rounded-[2rem] min-h-[160px] border border-stone-100">
                                            {formData.images.map((img, idx) => (
                                                <div key={idx} className={`relative aspect-[3/4] rounded-2xl overflow-hidden border-2 group/img transition-all ${idx === 0 ? 'border-accent shadow-lg scale-105 z-10' : 'border-stone-200'}`}>
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} 
                                                            className="bg-white/90 text-red-500 p-2 rounded-xl backdrop-blur-sm hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                                            title="Purge Image"
                                                        >
                                                            <HiTrash size={14} />
                                                        </button>
                                                        {idx !== 0 && (
                                                            <button 
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = [...formData.images];
                                                                    const [target] = newImages.splice(idx, 1);
                                                                    newImages.unshift(target);
                                                                    setFormData({...formData, images: newImages});
                                                                }}
                                                                className="bg-white/90 text-primary p-2 rounded-xl backdrop-blur-sm hover:bg-primary hover:text-white transition-all shadow-lg"
                                                                title="Set as Primary"
                                                            >
                                                                <HiCheck size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {idx === 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-accent text-white text-[7px] font-black text-center py-1 uppercase tracking-widest backdrop-blur-sm">Primary Visual</div>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {/* Action Slots */}
                                            <div className="flex flex-col gap-2 aspect-[3/4]">
                                                <button 
                                                    type="button" 
                                                    onClick={() => galleryInputRef.current.click()} 
                                                    className="flex-1 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 hover:text-primary hover:border-primary hover:bg-white transition-all group/up"
                                                >
                                                    <HiCloudUpload size={24} className="group-hover/up:scale-110 transition-transform" />
                                                    <span className="text-[7px] font-black uppercase tracking-widest mt-2">Upload</span>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => cameraInputRef.current.click()} 
                                                    className="flex-1 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-300 hover:text-accent hover:border-accent hover:bg-white transition-all group/cam"
                                                >
                                                    <HiCamera size={24} className="group-hover/cam:scale-110 transition-transform" />
                                                    <span className="text-[7px] font-black uppercase tracking-widest mt-2">Click</span>
                                                </button>
                                            </div>
                                            
                                            <input type="file" multiple hidden ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" />
                                            <input type="file" hidden ref={cameraInputRef} onChange={handleGalleryUpload} accept="image/*" capture="environment" />
                                        </div>
                                    </div>

                                    <FormSectionTitle label="Thread & Dye" />
                                    <div className="bg-stone-50 p-8 rounded-[2rem] space-y-6 border border-stone-100">
                                        <div className="flex gap-4">
                                            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-14 h-14 rounded-2xl cursor-pointer border-4 border-white shadow-sm transition-transform hover:scale-105" title="Choose Shade" />
                                            <button 
                                                type="button" 
                                                onClick={pickColorFromImage}
                                                className="flex-1 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                <HiCursorClick size={16} /> Sample From Image
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-3">
                                            {formData.colors.map(c => <ColorPill key={c} color={c} onRemove={(color) => setFormData({...formData, colors: formData.colors.filter(x => x !== color)})} />)}
                                            {formData.colors.length === 0 && <span className="text-[10px] text-stone-400 font-bold uppercase py-2 tracking-wider">No variants registered.</span>}
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const name = getColorName(newColor);
                                                if (!formData.colors.includes(name)) {
                                                    setFormData({...formData, colors: [...formData.colors, name]});
                                                }
                                            }} 
                                            className="w-full py-3 bg-primary text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-stone-800 transition-all"
                                        >
                                            Register Manual Shade Name
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <InputBox label="Stock Level" type="number" value={formData.stock} onChange={(v) => setFormData({...formData, stock: v})} icon={<HiCube />} />
                                        <div className="grid grid-cols-2 gap-3">
                                            <InputBox label="Rating" type="number" value={formData.rating} onChange={(v) => setFormData({...formData, rating: v})} icon={<HiStar className="text-yellow-400" />} />
                                            <InputBox label="Reviews" type="number" value={formData.reviews} onChange={(v) => setFormData({...formData, reviews: v})} icon={<HiUsers />} />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Asset Narrative (Description)</label>
                                        <textarea 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Describe the weave, the fall, and the occasion..."
                                            className="w-full h-38 px-6 py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none font-bold text-xs text-primary shadow-sm focus:ring-2 focus:ring-accent transition-all resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={isSaving}
                                className="w-full mt-12 py-6 bg-primary text-white rounded-[3rem] font-black uppercase tracking-[0.4em] text-sm shadow-2xl shadow-primary/30 hover:bg-accent transition-all transform hover:-translate-y-1 flex items-center justify-center gap-4 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <BiLoaderAlt className="animate-spin text-xl" />
                                        <span>Adding Suit...</span>
                                    </>
                                ) : (
                                    editingProduct ? 'Finalize Asset Update' : 'Add Suit'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};



const TableHead = ({ label, sortKey, currentSort, onSort }) => (
    <th className="px-8 py-6">
        <button onClick={() => onSort(sortKey)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-primary transition-colors">
            {label}
            <div className="flex flex-col text-[8px] opacity-40">
                <HiChevronUp className={currentSort.key === sortKey && currentSort.direction === 'asc' ? 'opacity-100 text-accent' : ''} />
                <HiChevronDown className={currentSort.key === sortKey && currentSort.direction === 'desc' ? 'opacity-100 text-accent' : ''} />
            </div>
        </button>
    </th>
);

const FormSectionTitle = ({ label }) => (
    <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em] flex items-center gap-3">
        <span className="w-6 h-px bg-stone-200" /> {label}
    </h3>
);

const InputBox = ({ label, type = 'text', value, onChange, icon, color }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">{label}</label>
        <div className="relative">
            {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-400">{icon}</div>}
            <input 
                type={type} required 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className={`w-full ${icon ? 'pl-14' : 'px-6'} py-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none font-bold text-xs shadow-sm focus:ring-2 focus:ring-accent transition-all ${color || 'text-primary'}`} 
            />
        </div>
    </div>
);

export default AdminDashboard;
