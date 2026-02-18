import axios from "axios";

export const SPORTS_API_URL = import.meta.env.VITE_SPORTS_API_URL || "http://localhost:5001";
export const SPORTS_TOKEN_KEY = "sports_token";
export const SPORTS_USER_KEY = "sports_user";

const api = axios.create({
  baseURL: SPORTS_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(SPORTS_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
