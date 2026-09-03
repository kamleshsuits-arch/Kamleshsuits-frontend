import axios from 'axios';
import { AWS_CONFIG } from '../lib/aws-config';

const API_URL = AWS_CONFIG.apiBaseUrl;

const getAuthHeader = () => {
  const clientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID;
  const user = localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.LastAuthUser`);
  const token = user && localStorage.getItem(`CognitoIdentityServiceProvider.${clientId}.${user}.idToken`);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPwaInstalls = async () => (await axios.get(`${API_URL}/admin/pwa/installs`, { headers: getAuthHeader() })).data;
export const fetchAdminNotifications = async () => (await axios.get(`${API_URL}/admin/notifications`, { headers: getAuthHeader() })).data;
export const sendAdminNotification = async notification => (await axios.post(`${API_URL}/admin/notifications`, notification, { headers: getAuthHeader() })).data;
