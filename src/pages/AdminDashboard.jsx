
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchProducts, addProduct, updateProduct, deleteProduct, uploadProductImage, fetchAllOrders } from '../api/products';
import { 
    HiPlus, HiPencil, HiTrash, HiPhotograph, HiCurrencyRupee, 
    HiTag, HiCube, HiX, HiCollection, HiCheck,
    HiSearch, HiTrendingUp, HiUsers, HiCubeTransparent, HiChevronDown, HiChevronUp,
    HiCloudUpload, HiScissors, HiPresentationChartLine, HiDatabase, HiRefresh,
    HiCamera, HiIdentification, HiColorSwatch, HiCursorClick, HiStar, HiTruck, HiBell,
    HiSparkles, HiInformationCircle
} from 'react-icons/hi';
import { BiLoaderAlt } from 'react-icons/bi';
import AnalyticsTerminal from '../components/admin/AnalyticsTerminal';
import CouponManager from '../components/admin/CouponManager';
import DeliveryDemandInsights from '../components/admin/DeliveryDemandInsights';
import OrderManager from '../components/admin/OrderManager';
import Loader from '../components/common/Loader';
import { useCart } from '../hooks/useCart';
import { getColorName, getColorDisplay } from '../utils/colors';
import { formatAssetSize, isSupportedProductAsset, optimizeProductAsset } from '../utils/productAssetOptimizer';
import { useProductTaxonomy } from '../hooks/useProductTaxonomy';
import { getProductCategory } from '../utils/productTaxonomy';
import './AdminDashboard.css';

const MAX_PRODUCT_ASSETS = 10;
const MAX_ASSET_SIZE = 20 * 1024 * 1024;

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
    const { taxonomy: productTaxonomy, defaultCategory } = useProductTaxonomy();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [activeTab, setActiveTab] = useState('inventory');
    const [pendingOrderCount, setPendingOrderCount] = useState(0);
    const knownOrderIdsRef = useRef(new Set());
    const orderCheckInitializedRef = useRef(false);
    
    // UI Local State
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'title', direction: 'asc' });
    const coverInputRef = useRef(null);
    const galleryInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    const [assetProgress, setAssetProgress] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Enhanced Form Data
    const [formData, setFormData] = useState({
        title: '',
        product_category: 'suits',
        product_subcategory: '',
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
    const [manualColorName, setManualColorName] = useState('');



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

    useEffect(() => {
        if (!isAdmin) return undefined;
        let active = true;

        const checkNewOrderRequests = async () => {
            try {
                const data = await fetchAllOrders();
                if (!active) return;
                const awaiting = (data || []).filter(order => ['Awaiting Confirmation', 'Pending'].includes(order.status));
                setPendingOrderCount(awaiting.length);

                if (orderCheckInitializedRef.current) {
                    const newOrders = awaiting.filter(order => !knownOrderIdsRef.current.has(order.orderId));
                    if (newOrders.length > 0) {
                        showToast(`${newOrders.length} new order request${newOrders.length > 1 ? 's' : ''}. Please call the customer to confirm.`, null, 'success');
                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('New Kamlesh Suits order', {
                                body: `${newOrders.length} customer${newOrders.length > 1 ? 's are' : ' is'} waiting for a confirmation call.`
                            });
                        }
                    }
                }

                knownOrderIdsRef.current = new Set((data || []).map(order => order.orderId));
                orderCheckInitializedRef.current = true;
            } catch (error) {
                console.error('Order notification check failed:', error);
            }
        };

        checkNewOrderRequests();
        const interval = setInterval(checkNewOrderRequests, 20000);
        window.addEventListener('focus', checkNewOrderRequests);
        return () => {
            active = false;
            clearInterval(interval);
            window.removeEventListener('focus', checkNewOrderRequests);
        };
    }, [isAdmin, showToast]);

    useEffect(() => {
        document.title = pendingOrderCount > 0
            ? `(${pendingOrderCount}) Orders Waiting | Kamlesh Suits`
            : 'Admin | Kamlesh Suits';
        return () => { document.title = 'Kamlesh Suits'; };
    }, [pendingOrderCount]);

    useEffect(() => {
        if (!isModalOpen) return undefined;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previousOverflow; };
    }, [isModalOpen]);

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
                p.product_category?.toLowerCase().includes(search) ||
                p.product_subcategory?.toLowerCase().includes(search) ||
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

    const selectedCategoryDefinition = getProductCategory(productTaxonomy, formData.product_category);

    const handleOpenModal = (product = null) => {
        setAssetProgress([]);
        setManualColorName('');
        if (product) {
            setEditingProduct(product);
            const cats = Array.isArray(product.categories) 
                ? product.categories 
                : (product.session || product.categories || "").split(",").map(c => c.trim()).filter(Boolean);
            
            setFormData({ 
                ...product, 
                categories: cats,
                product_category: product.product_category || defaultCategory,
                product_subcategory: product.product_subcategory || '',
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
                title: '', product_category: defaultCategory, product_subcategory: '', categories: [], price: '', discount: 0, description: '',
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
        const selectedProductCategory = getProductCategory(productTaxonomy, formData.product_category);
        if (!selectedProductCategory) {
            showToast('Category Required: Please select a product category.', null, 'error');
            return;
        }
        if (selectedProductCategory.requiresFabric && (!formData.fabric_family || !formData.fabric_category)) {
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
                type: 'product',
                product_category: formData.product_category,
                product_subcategory: formData.product_subcategory || '',
                image: formData.images[0] || '',
                images: formData.images || [],
                colors: formData.colors || [],
                categories: formData.categories || [],
                fabric_family: formData.fabric_family, 
                fabric_category: formData.fabric_category,
                stock: safeStock,
                rating: parseFloat(formData.rating) || 4.1,
                reviews: parseInt(formData.reviews) || 26,
                session: [
                    formData.product_subcategory,
                    formData.fabric_category && `${formData.fabric_category}${formData.fabric_family ? ` (${formData.fabric_family})` : ''}`,
                    (formData.categories || []).length ? `[${formData.categories.join(", ")}]` : ''
                ].filter(Boolean).join(' - ')
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
        const input = e.target;
        const selectedFiles = Array.from(input.files || []);
        input.value = '';
        if (!selectedFiles.length) return;

        const availableSlots = MAX_PRODUCT_ASSETS - formData.images.length;
        if (availableSlots <= 0) {
            showToast('Gallery Full: A product can have up to 10 images or GIFs.', null, 'error');
            return;
        }

        const accepted = [];
        const rejected = [];
        selectedFiles.slice(0, availableSlots).forEach((file, index) => {
            if (!isSupportedProductAsset(file)) {
                rejected.push(`${file.name}: unsupported format`);
            } else if (file.size > MAX_ASSET_SIZE) {
                rejected.push(`${file.name}: larger than 20 MB`);
            } else {
                accepted.push({ file, id: `${Date.now()}-${index}-${file.name}` });
            }
        });

        if (selectedFiles.length > availableSlots) {
            rejected.push(`${selectedFiles.length - availableSlots} file(s): gallery limit reached`);
        }
        if (rejected.length) {
            showToast(`Some files were skipped. ${rejected.join('; ')}`, null, 'error');
        }
        if (!accepted.length) return;

        setUploading(true);
        setAssetProgress(accepted.map(item => ({
            id: item.id,
            name: item.file.name,
            status: 'Optimizing',
            originalSize: item.file.size,
            finalSize: null,
            note: ''
        })));

        const updateProgress = (id, patch) => {
            setAssetProgress(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
        };

        const processFile = async item => {
            try {
                const result = await optimizeProductAsset(item.file);
                updateProgress(item.id, {
                    status: 'Uploading',
                    finalSize: result.finalSize,
                    note: result.note
                });
                const url = await uploadProductImage(result.file);
                updateProgress(item.id, { status: 'Ready', url });
                return url;
            } catch (error) {
                console.error('Gallery asset upload failed:', error);
                updateProgress(item.id, {
                    status: 'Failed',
                    note: error.response?.data?.message || error.message || 'Upload failed'
                });
                return null;
            }
        };

        try {
            // Three workers keep batch uploads quick without flooding slower mobile connections.
            const queue = [...accepted];
            const uploadedById = new Map();
            const worker = async () => {
                while (queue.length) {
                    const item = queue.shift();
                    const url = await processFile(item);
                    if (url) uploadedById.set(item.id, url);
                }
            };
            await Promise.all(Array.from({ length: Math.min(3, accepted.length) }, worker));
            const uploadedUrls = accepted.map(item => uploadedById.get(item.id)).filter(Boolean);

            if (uploadedUrls.length) {
                setFormData(prev => ({
                    ...prev,
                    images: [...prev.images, ...uploadedUrls].slice(0, MAX_PRODUCT_ASSETS)
                }));
                showToast(`${uploadedUrls.length} product asset${uploadedUrls.length > 1 ? 's' : ''} optimized and uploaded.`, null, 'success');
            }
            if (uploadedUrls.length !== accepted.length) {
                showToast(`${accepted.length - uploadedUrls.length} asset upload failed. You can select it again to retry.`, null, 'error');
            }
        } finally {
            setUploading(false);
        }
    };

    const addColor = (name) => {
        const cleanName = (name || '').trim().replace(/\s+/g, ' ');
        if (!cleanName) {
            showToast('Enter a colour name first.', null, 'error');
            return;
        }
        if (formData.colors.some(color => color.toLowerCase() === cleanName.toLowerCase())) {
            showToast(`${cleanName} is already added.`, null, 'error');
            return;
        }
        setFormData(prev => ({ ...prev, colors: [...prev.colors, cleanName] }));
        setManualColorName('');
    };

    const ColorPill = ({ color, onRemove }) => (
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
            <div className="h-6 w-6 shrink-0 rounded-full border-2 border-white shadow ring-1 ring-stone-200" style={{ backgroundColor: getColorDisplay(color) }} />
            <span className="min-w-0 flex-1 truncate text-xs font-bold text-stone-700">{color}</span>
            <button type="button" onClick={() => onRemove(color)} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${color}`}><HiX size={14} /></button>
        </div>
    );

    return (
        <div className="admin-dashboard min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Global Admin Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-primary tracking-tight">Admin Dashboard</h1>
                        <p className="text-stone-600 font-medium text-sm mt-1">Manage products, customer orders and delivery requests</p>
                    </div>

                    <div className="admin-tabs flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-stone-200 backdrop-blur-sm">
                        <button 
                            onClick={() => setActiveTab('inventory')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inventory' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiDatabase size={16} /> Products
                        </button>
                        <button 
                            onClick={() => setActiveTab('orders')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiCollection size={16} /> Orders
                            {pendingOrderCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] text-white shadow-lg animate-pulse">
                                    {pendingOrderCount}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('coupons')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiTag size={16} /> Coupons
                        </button>
                        <button 
                            onClick={() => setActiveTab('analytics')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiPresentationChartLine size={16} /> Reports
                        </button>
                        <button 
                            onClick={() => setActiveTab('delivery')} 
                            className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'delivery' ? 'bg-primary text-white shadow-xl' : 'text-stone-400 hover:text-stone-600'}`}
                        >
                            <HiTruck size={16} /> Delivery Requests
                        </button>
                    </div>
                </div>

                {pendingOrderCount > 0 && activeTab !== 'orders' && (
                    <button
                        onClick={() => setActiveTab('orders')}
                        className="mb-8 flex w-full items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left shadow-sm transition hover:bg-amber-100"
                    >
                        <span className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                                <HiBell size={22} />
                            </span>
                            <span>
                                <span className="block text-sm font-black text-amber-900">{pendingOrderCount} order request{pendingOrderCount > 1 ? 's' : ''} waiting</span>
                                <span className="block text-xs text-amber-700">Open orders, call the customer, then confirm the order.</span>
                            </span>
                        </span>
                        <span className="shrink-0 text-xs font-black uppercase tracking-wider text-amber-800">Open Orders</span>
                    </button>
                )}

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
                                            {filteredProducts.length} Total Products
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
                                                <TableHead label="Product Category" sortKey="product_category" currentSort={sortConfig} onSort={handleSort} />
                                                <TableHead label="Type / Fabric" sortKey="product_subcategory" currentSort={sortConfig} onSort={handleSort} />
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
                                                                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest leading-none">{getProductCategory(productTaxonomy, product.product_category || defaultCategory)?.label || 'Product'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <span className="px-3 py-1.5 bg-primary/5 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest block w-fit leading-relaxed">{getProductCategory(productTaxonomy, product.product_category || defaultCategory)?.label || 'Suits'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 font-bold text-xs text-stone-600">
                                                         <div className="flex flex-col">
                                                              <span className="text-[10px] font-black text-primary uppercase">{product.product_subcategory || product.fabric_category || 'General'}</span>
                                                              <span className="text-[9px] text-stone-400 uppercase font-bold">{product.fabric_family || (Array.isArray(product.categories) ? product.categories.slice(0, 2).join(', ') : product.categories) || 'Standard'}</span>
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
                ) : activeTab === 'orders' ? (
                    <OrderManager showToast={showToast} onPendingCountChange={setPendingOrderCount} />
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-stone-950/65 p-2 backdrop-blur-sm animate-in fade-in duration-300 sm:p-5">
                    <div className="asset-modal-shell flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl scale-in-center">
                        <div className="asset-modal-header flex items-center justify-between gap-5 border-b border-white/10 px-5 py-5 sm:px-8 sm:py-6">
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
                                    <HiSparkles size={24} />
                                </span>
                                <div className="min-w-0">
                                <p className="mb-1 text-xs font-bold uppercase tracking-wider text-white/65">Product catalogue</p>
                                <h2 className="truncate text-xl font-black text-white sm:text-2xl">
                                    {editingProduct ? 'Update Asset' : 'New Asset'}
                                </h2>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} disabled={uploading || isSaving} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-primary disabled:cursor-wait disabled:opacity-50" aria-label="Close product form">
                                <HiX size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="asset-modal-form overflow-y-auto bg-stone-50/80 px-4 py-5 custom-scrollbar sm:px-8 sm:py-8">
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-7">
                                {/* Left Form Section */}
                                <div className="space-y-6">
                                    <FormSectionTitle number="01" label="Product Classification" description="Choose where this item appears in the storefront catalogue." />
                                    <div className="asset-section-card space-y-5">
                                        <div className="grid gap-3 sm:grid-cols-[36px_1fr] sm:items-start">
                                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-xs font-black text-white">1</span>
                                            <div className="space-y-2">
                                                <label htmlFor="product-category" className="block text-sm font-black text-stone-800">Product category</label>
                                                <select
                                                    id="product-category"
                                                    value={formData.product_category}
                                                    onChange={(e) => {
                                                        const nextCategory = getProductCategory(productTaxonomy, e.target.value);
                                                        setFormData({
                                                            ...formData,
                                                            product_category: e.target.value,
                                                            product_subcategory: '',
                                                            fabric_family: nextCategory?.requiresFabric ? formData.fabric_family : '',
                                                            fabric_category: nextCategory?.requiresFabric ? formData.fabric_category : ''
                                                        });
                                                    }}
                                                    className="asset-control"
                                                    required
                                                >
                                                    <option value="">Select a product category</option>
                                                    {productTaxonomy.map(category => (
                                                        <option key={category.id} value={category.id}>{category.label}</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs font-medium text-stone-500">Customers can use this category to find the product.</p>
                                            </div>
                                        </div>

                                        <div className="h-px bg-stone-100 sm:ml-12" />

                                        <div className="grid gap-3 sm:grid-cols-[36px_1fr] sm:items-start">
                                            <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black ${formData.product_category ? 'bg-accent text-white' : 'bg-stone-100 text-stone-400'}`}>2</span>
                                            <div className="space-y-2">
                                                <label htmlFor="product-subcategory" className="block text-sm font-black text-stone-800">Product type <span className="font-medium text-stone-400">(optional)</span></label>
                                                <select
                                                    id="product-subcategory"
                                                    value={formData.product_subcategory}
                                                    onChange={(e) => setFormData({ ...formData, product_subcategory: e.target.value })}
                                                    disabled={!formData.product_category}
                                                    className="asset-control disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                                                >
                                                    <option value="">{formData.product_category ? 'Select the product type' : 'Select a category first'}</option>
                                                    {formData.product_subcategory && !(selectedCategoryDefinition?.subcategories || []).includes(formData.product_subcategory) && (
                                                        <option value={formData.product_subcategory}>{formData.product_subcategory} (existing)</option>
                                                    )}
                                                    {(selectedCategoryDefinition?.subcategories || []).map(subcategory => (
                                                        <option key={subcategory} value={subcategory}>{subcategory}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {selectedCategoryDefinition?.requiresFabric && (
                                            <div className="space-y-4 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
                                                <div>
                                                    <p className="text-sm font-black text-stone-800">Suit fabric details</p>
                                                    <p className="mt-1 text-xs font-medium text-stone-500">Required only for products in the Suits category.</p>
                                                </div>
                                                <div className="grid gap-3 sm:grid-cols-2">
                                                    <div className="space-y-2">
                                                        <label htmlFor="fabric-family" className="block text-xs font-black text-stone-700">Fabric family</label>
                                                        <select
                                                            id="fabric-family"
                                                            value={formData.fabric_family}
                                                            onChange={(e) => setFormData({ ...formData, fabric_family: e.target.value, fabric_category: '' })}
                                                            className="asset-control"
                                                            required
                                                        >
                                                            <option value="">Select family</option>
                                                            {formData.fabric_family && !Object.hasOwn(FABRIC_STRUCTURE, formData.fabric_family) && (
                                                                <option value={formData.fabric_family}>{formData.fabric_family} (existing)</option>
                                                            )}
                                                            {Object.keys(FABRIC_STRUCTURE).map(family => (
                                                                <option key={family} value={family}>{family}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label htmlFor="fabric-category" className="block text-xs font-black text-stone-700">Fabric type</label>
                                                        <select
                                                            id="fabric-category"
                                                            value={formData.fabric_category}
                                                            onChange={(e) => setFormData({ ...formData, fabric_category: e.target.value })}
                                                            disabled={!formData.fabric_family}
                                                            className="asset-control disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                                                            required
                                                        >
                                                            <option value="">{formData.fabric_family ? 'Select fabric type' : 'Select family first'}</option>
                                                            {formData.fabric_category && !(FABRIC_STRUCTURE[formData.fabric_family] || []).includes(formData.fabric_category) && (
                                                                <option value={formData.fabric_category}>{formData.fabric_category} (existing)</option>
                                                            )}
                                                            {(FABRIC_STRUCTURE[formData.fabric_family] || []).map(category => (
                                                                <option key={category} value={category}>{category}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <FormSectionTitle number="02" label="Product Details" description="Add the customer-facing name, occasion and price." />
                                    <div className="asset-section-card space-y-5">
                                    <InputBox label="Product name" value={formData.title} onChange={(v) => setFormData({...formData, title: v})} placeholder={`Example: Premium ${selectedCategoryDefinition?.label || 'Product'}`} />

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-stone-800">Suitable for</label>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                            {["Wedding", "Daily Wear", "Party Wear", "Festive", "Karvachauth Spec.", "Outdoor", "Office", "Casual"].map(cat => (
                                                <label key={cat} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition ${formData.categories.includes(cat) ? 'border-primary bg-primary/5 text-primary' : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.categories.includes(cat)}
                                                        onChange={(e) => {
                                                            const newCats = e.target.checked 
                                                                ? [...formData.categories, cat]
                                                                : formData.categories.filter(c => c !== cat);
                                                            setFormData({...formData, categories: newCats});
                                                        }}
                                                        className="h-4 w-4 shrink-0 rounded border-stone-300 text-primary focus:ring-accent"
                                                    />
                                                    <span className="text-xs font-bold leading-tight">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <InputBox label="Price (₹)" type="number" value={formData.price} onChange={(v) => setFormData({...formData, price: v})} icon={<HiCurrencyRupee />} />
                                        <InputBox label="Discount (%)" type="number" color="text-highlight" value={formData.discount} onChange={(v) => setFormData({...formData, discount: v})} icon={<HiTag />} />
                                    </div>
                                    </div>
                                </div>

                                {/* Right Form Section */}
                                <div className="space-y-6">
                                    <FormSectionTitle number="03" label="Product Gallery" description="Show the product clearly from multiple angles." />
                                    <div className="space-y-4">
                                        <div className="flex items-end justify-between gap-4 px-1">
                                            <div>
                                                <label className="block text-sm font-black text-stone-800">Product gallery</label>
                                                <p className="mt-1 text-xs font-medium text-stone-500">Add up to 10 JPG, PNG, WebP or animated GIF files.</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${formData.images.length >= MAX_PRODUCT_ASSETS ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                                                {formData.images.length} / {MAX_PRODUCT_ASSETS}
                                            </span>
                                        </div>

                                        <div className="rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:p-5">
                                            {formData.images.length > 0 && (
                                                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {formData.images.map((img, idx) => (
                                                <div key={img} className={`relative aspect-[3/4] overflow-hidden rounded-2xl border-2 bg-white ${idx === 0 ? 'border-accent shadow-md' : 'border-stone-200'}`}>
                                                    <img src={img} alt={`Product asset ${idx + 1}`} className="h-full w-full object-cover" />
                                                    <div className="absolute right-2 top-2 flex gap-2">
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({...formData, images: formData.images.filter((_, i) => i !== idx)})} 
                                                            className="rounded-full bg-white p-2 text-red-600 shadow-md transition hover:bg-red-600 hover:text-white"
                                                            title="Remove asset"
                                                            aria-label={`Remove product asset ${idx + 1}`}
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
                                                                className="rounded-full bg-white p-2 text-primary shadow-md transition hover:bg-primary hover:text-white"
                                                                title="Make primary image"
                                                                aria-label={`Make product asset ${idx + 1} primary`}
                                                            >
                                                                <HiCheck size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {idx === 0 && (
                                                        <div className="absolute bottom-0 left-0 right-0 bg-accent/95 py-1.5 text-center text-[10px] font-black uppercase tracking-wide text-white">Primary image</div>
                                                    )}
                                                </div>
                                            ))}
                                                </div>
                                            )}

                                            {formData.images.length < MAX_PRODUCT_ASSETS && (
                                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                                                <button 
                                                    type="button" 
                                                    onClick={() => galleryInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="flex min-h-24 items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-stone-300 bg-white px-4 text-left text-stone-700 transition hover:border-primary hover:text-primary disabled:cursor-wait disabled:opacity-60"
                                                >
                                                    {uploading ? <BiLoaderAlt size={25} className="animate-spin" /> : <HiCloudUpload size={26} />}
                                                    <span>
                                                        <span className="block text-sm font-black">{uploading ? 'Optimizing and uploading…' : 'Choose product files'}</span>
                                                        <span className="mt-1 block text-xs font-medium text-stone-500">Auto mode keeps the best quality and uploads 3 at a time.</span>
                                                    </span>
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => cameraInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-5 text-sm font-black text-stone-700 transition hover:border-accent hover:text-accent disabled:cursor-wait disabled:opacity-60 sm:min-h-24 sm:flex-col"
                                                >
                                                    <HiCamera size={23} />
                                                    <span>Use camera</span>
                                                </button>
                                                </div>
                                            )}

                                            <input type="file" multiple hidden ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/jpeg,image/png,image/webp,image/gif" />
                                            <input type="file" hidden ref={cameraInputRef} onChange={handleGalleryUpload} accept="image/jpeg,image/png,image/webp" capture="environment" />

                                            {assetProgress.length > 0 && (
                                                <div className="mt-4 space-y-2 border-t border-stone-200 pt-4" aria-live="polite">
                                                    {assetProgress.map(item => (
                                                        <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-xs">
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate font-bold text-stone-700">{item.name}</span>
                                                                <span className="block text-[11px] font-medium text-stone-500">
                                                                    {item.note || 'Preparing file'}
                                                                    {item.finalSize && item.finalSize !== item.originalSize
                                                                        ? ` · ${formatAssetSize(item.originalSize)} → ${formatAssetSize(item.finalSize)}`
                                                                        : ` · ${formatAssetSize(item.originalSize)}`}
                                                                </span>
                                                            </span>
                                                            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${item.status === 'Ready' ? 'bg-emerald-100 text-emerald-800' : item.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <p className="mt-3 text-[11px] font-medium leading-5 text-stone-500">
                                                Large static images are converted only when the smaller version keeps visually identical quality. Animated GIF frames and colours are preserved unchanged. Maximum 20 MB per file.
                                            </p>
                                        </div>
                                    </div>

                                    <FormSectionTitle number="04" label="Available Colours" description="Pick a shade or type the exact colour name customers should see." />
                                    <div className="asset-section-card space-y-5">
                                        <div className="grid gap-4 rounded-2xl bg-stone-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                                            <div className="flex items-center gap-4">
                                                <label className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-4 border-white shadow-md ring-1 ring-stone-200" title="Open colour picker">
                                                    <span className="absolute inset-0" style={{ backgroundColor: newColor }} />
                                                    <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Choose a colour" />
                                                    <HiColorSwatch className="relative text-white drop-shadow" size={22} />
                                                </label>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-stone-500">Selected shade</p>
                                                    <p className="truncate text-base font-black text-stone-800">{getColorName(newColor)}</p>
                                                    <p className="mt-0.5 font-mono text-xs font-bold uppercase text-stone-500">{newColor}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                                                <button type="button" onClick={() => addColor(getColorName(newColor))} className="min-h-11 rounded-xl bg-primary px-4 text-xs font-black text-white transition hover:bg-accent">
                                                    Add shade
                                                </button>
                                                <button type="button" onClick={pickColorFromImage} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-xs font-black text-stone-700 transition hover:border-accent hover:text-accent">
                                                    <HiCursorClick size={17} /> Pick from screen
                                                </button>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-stone-200 p-4">
                                            <label htmlFor="manual-colour-name" className="block text-sm font-black text-stone-800">Add colour name manually</label>
                                            <p className="mt-1 text-xs font-medium text-stone-500">Useful for names such as Rani Pink, Mehendi Green or Dual Tone.</p>
                                            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                                                <input
                                                    id="manual-colour-name"
                                                    type="text"
                                                    value={manualColorName}
                                                    onChange={(e) => setManualColorName(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addColor(manualColorName);
                                                        }
                                                    }}
                                                    maxLength={40}
                                                    placeholder="Type colour name"
                                                    className="asset-control flex-1"
                                                />
                                                <button type="button" onClick={() => addColor(manualColorName)} className="min-h-12 rounded-xl bg-accent px-6 text-sm font-black text-white transition hover:bg-primary">
                                                    Add colour
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-3 flex items-center justify-between gap-3">
                                                <p className="text-sm font-black text-stone-800">Added colours</p>
                                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-bold text-stone-600">{formData.colors.length}</span>
                                            </div>
                                            {formData.colors.length > 0 ? (
                                                <div className="grid gap-2 sm:grid-cols-2">
                                                    {formData.colors.map(c => <ColorPill key={c} color={c} onRemove={(color) => setFormData({...formData, colors: formData.colors.filter(x => x !== color)})} />)}
                                                </div>
                                            ) : (
                                                <div className="flex min-h-16 items-center gap-3 rounded-xl border border-dashed border-stone-300 px-4 text-xs font-medium text-stone-500">
                                                    <HiInformationCircle size={20} className="shrink-0 text-stone-400" /> No colours added yet. This field is optional.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <FormSectionTitle number="05" label="Inventory & Description" description="Finish with stock information and a short product summary." />
                                    <div className="asset-section-card space-y-5">
                                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                        <InputBox label="Stock Level" type="number" value={formData.stock} onChange={(v) => setFormData({...formData, stock: v})} icon={<HiCube />} />
                                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                            <InputBox label="Rating" type="number" value={formData.rating} onChange={(v) => setFormData({...formData, rating: v})} icon={<HiStar className="text-yellow-400" />} />
                                            <InputBox label="Reviews" type="number" value={formData.reviews} onChange={(v) => setFormData({...formData, reviews: v})} icon={<HiUsers />} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-black text-stone-800">Product description</label>
                                        <textarea 
                                            value={formData.description} 
                                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                                            placeholder="Describe the fabric, fit, work and suitable occasion..."
                                            className="asset-control min-h-32 resize-y"
                                        />
                                    </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
                                <p className="text-xs font-medium text-stone-500"><span className="font-black text-stone-700">Ready to publish?</span> Product name, fabric and price are required.</p>
                            <button
                                type="submit"
                                disabled={isSaving || uploading}
                                className="flex min-h-13 items-center justify-center gap-3 rounded-2xl bg-primary px-8 text-sm font-black text-white shadow-lg shadow-primary/20 transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-56"
                            >
                                {isSaving || uploading ? (
                                    <>
                                        <BiLoaderAlt className="animate-spin text-xl" />
                                        <span>{uploading ? 'Uploading Assets...' : 'Saving Product...'}</span>
                                    </>
                                ) : (
                                    editingProduct ? 'Save Changes' : 'Publish Product'
                                )}
                            </button>
                            </div>
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

const FormSectionTitle = ({ number, label, description }) => (
    <div className="flex items-start gap-3 px-1">
        {number && <span className="mt-0.5 text-xs font-black text-accent">{number}</span>}
        <div>
            <h3 className="text-base font-black text-stone-900">{label}</h3>
            {description && <p className="mt-1 text-xs font-medium leading-5 text-stone-500">{description}</p>}
        </div>
    </div>
);

const InputBox = ({ label, type = 'text', value, onChange, icon, color, placeholder = '' }) => (
    <div className="w-full space-y-2">
        <label className="block text-sm font-black text-stone-800">{label}</label>
        <div className="relative">
            {icon && <div className="pointer-events-none absolute left-4 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center text-stone-400">{icon}</div>}
            <input 
                type={type} required 
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`asset-control ${icon ? 'asset-control-with-icon' : ''} ${color || 'text-primary'}`}
            />
        </div>
    </div>
);

export default AdminDashboard;
