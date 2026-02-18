import axios from "axios";

export const API_BASE_URL = "https://gamerhub-ai.onrender.com/api";
export const TOKEN_STORAGE_KEY = "token";
export const USER_STORAGE_KEY = "user";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
