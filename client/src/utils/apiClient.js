import axios from "axios";
import { auth } from "../firebase/config";

const API_URL = import.meta.env.VITE_BACKEND_URL !== undefined
  ? import.meta.env.VITE_BACKEND_URL
  : (import.meta.env.PROD ? "" : "http://localhost:5000");

const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
