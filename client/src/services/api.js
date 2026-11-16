// =============================================================================
// services/api.js — Axios client dengan cookie-based auth
//
// KEAMANAN:
//   • withCredentials: true  → kirim HttpOnly Cookie ke server
//   • Tidak ada token di localStorage (anti-XSS)
//   • Redirect ke /login saat 401
// =============================================================================

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,     // Wajib untuk cookie-based auth
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// Response interceptor — handle 401 global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hindari redirect loop jika sudah di halaman login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

