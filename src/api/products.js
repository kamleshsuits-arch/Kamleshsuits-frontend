import axios from 'axios';
import { AWS_CONFIG } from '../lib/aws-config';

const API_URL = AWS_CONFIG.apiBaseUrl;

// Helper to get auth header
const getAuthHeader = () => {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const user = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  if (!user) return {};
  
  const tokenKey = `CognitoIdentityServiceProvider.${clientId}.${user}.idToken`;
  const token = localStorage.getItem(tokenKey);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// --- PUBLIC API ---

export const fetchProducts = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/products`, { params: filters });
    return response.data;
  } catch (err) {
    console.error("Fetch products error:", err);
    throw err;
  }
};

export const fetchProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/products/${id}`);
    return response.data;
  } catch (err) {
    console.error("Fetch product error:", err);
    throw err;
  }
};

// --- ADMIN API ---

export const addProduct = async (product) => {
  try {
    const response = await axios.post(`${API_URL}/admin/products`, product, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Add product error:", err);
    throw err;
  }
};

export const updateProduct = async (id, updates) => {
  try {
    const response = await axios.put(`${API_URL}/admin/products/${id}`, updates, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Update product error:", err);
    throw err;
  }
};

export const deleteProduct = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/admin/products/${id}`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Delete product error:", err);
    throw err;
  }
};

// --- USER PROFILE API ---

export const fetchUserProfile = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/profile`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Fetch profile error:", err);
    return { cartItems: [], wishlistItems: [] };
  }
};

export const saveUserProfile = async (profile) => {
  try {
    const response = await axios.post(`${API_URL}/user/profile`, profile, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Save profile error:", err);
    throw err;
  }
};

// --- ORDERS API ---

export const placeOrder = async (orderData) => {
  try {
    const response = await axios.post(`${API_URL}/user/orders`, orderData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Place order error:", err);
    throw err;
  }
};

export const fetchUserOrders = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/orders`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (err) {
    console.error("Fetch orders error:", err);
    throw err;
  }
};

// Image Upload
export const uploadProductImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await axios.post(`${API_URL}/admin/upload`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.url;
  } catch (err) {
    console.error("Image upload error:", err);
    throw err;
  }
};