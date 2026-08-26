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

export const fetchPublicHeroImages = async () => {
  const response = await axios.get(`${API_URL}/hero-images`);
  return response.data;
};

export const fetchAdminHeroImages = async () => {
  const response = await axios.get(`${API_URL}/admin/hero-images`, { headers: getAuthHeader() });
  return response.data;
};

export const saveHeroImage = async heroImage => {
  const response = await axios.post(`${API_URL}/admin/hero-images`, heroImage, { headers: getAuthHeader() });
  return response.data;
};

export const deleteHeroImage = async heroImageId => {
  const response = await axios.delete(`${API_URL}/admin/hero-images/${encodeURIComponent(heroImageId)}`, { headers: getAuthHeader() });
  return response.data;
};
