import axios from 'axios';
import { AWS_CONFIG } from '../lib/aws-config';

const API_URL = AWS_CONFIG.apiBaseUrl;

// Helper to get auth header consistent with products.js
const getAuthHeader = () => {
    const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
    const user = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
    if (!user) return {};
    
    const tokenKey = `CognitoIdentityServiceProvider.${clientId}.${user}.idToken`;
    const token = localStorage.getItem(tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPublicCoupons = async () => {
    try {
        const response = await axios.get(`${API_URL}/coupons`);
        return response.data;
    } catch (err) {
        console.error("Fetch public coupons error:", err);
        throw err;
    }
};

export const fetchCoupons = async () => {
    try {
        const response = await axios.get(`${API_URL}/admin/coupons`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (err) {
        console.error("Fetch coupons error:", err);
        throw err;
    }
};

export const saveCoupon = async (couponData) => {
    try {
        const response = await axios.post(`${API_URL}/admin/coupons`, couponData, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (err) {
        console.error("Save coupon error:", err);
        throw new Error(err.response?.data?.message || 'Failed to save coupon');
    }
};

export const deleteCoupon = async (code) => {
    try {
        const response = await axios.delete(`${API_URL}/admin/coupons/${code}`, {
            headers: getAuthHeader()
        });
        return response.data;
    } catch (err) {
        console.error("Delete coupon error:", err);
        throw err;
    }
};

export const validateCoupon = async (code, subtotal) => {
    try {
        const response = await axios.post(`${API_URL}/coupons/validate`, { code, subtotal });
        return response.data;
    } catch (err) {
        console.error("Validate coupon error:", err);
        throw new Error(err.response?.data?.message || 'Invalid coupon');
    }
};
