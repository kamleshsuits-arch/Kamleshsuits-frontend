import axios from 'axios';
import { AWS_CONFIG } from '../lib/aws-config';

const API_URL = AWS_CONFIG.apiBaseUrl;

const getAuthHeader = () => {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const user = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  if (!user) return {};
  const token = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${user}.idToken`);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPublicBanners = async () => {
  const response = await axios.get(`${API_URL}/banners`);
  return response.data;
};

export const fetchAdminBanners = async () => {
  const response = await axios.get(`${API_URL}/admin/banners`, { headers: getAuthHeader() });
  return response.data;
};

export const saveBanner = async banner => {
  const response = await axios.post(`${API_URL}/admin/banners`, banner, { headers: getAuthHeader() });
  return response.data;
};

export const deleteBanner = async bannerId => {
  const response = await axios.delete(`${API_URL}/admin/banners/${encodeURIComponent(bannerId)}`, { headers: getAuthHeader() });
  return response.data;
};
