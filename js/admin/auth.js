/* ============================================
   VOKO ACCESORIOS — Autenticación del Panel
   Login por contraseña (hash SHA-256) + sesión
   con vencimiento en sessionStorage.
   ============================================ */

import { ADMIN_PASSWORD_HASH, ADMIN_SESSION_KEY, ADMIN_SESSION_TTL_MS } from '/js/config.js';

const LOGIN_URL = '/admin/';

/** Devuelve el SHA-256 de un texto en hexadecimal */
export async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * ¿Está configurado el hash de la contraseña en este entorno?
 * Si es false, no hay forma de entrar al panel y hay que cargar
 * `VITE_ADMIN_PASSWORD_HASH` (ver `.env.example`).
 */
export function isAdminPasswordConfigured() {
  return typeof ADMIN_PASSWORD_HASH === 'string' && ADMIN_PASSWORD_HASH.length === 64;
}

/**
 * Valida la contraseña y abre la sesión si es correcta.
 * @returns {Promise<boolean>} true si el ingreso fue exitoso
 */
export async function login(password) {
  // Sin hash configurado no se entra: mejor fallar cerrado que abrir el panel.
  if (!isAdminPasswordConfigured()) return false;

  const hash = await sha256Hex(password);
  if (hash !== ADMIN_PASSWORD_HASH) return false;

  sessionStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({ ok: true, expiresAt: Date.now() + ADMIN_SESSION_TTL_MS })
  );
  return true;
}

/** Cierra la sesión y vuelve al login */
export function logout(redirect = true) {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  if (redirect) window.location.replace(LOGIN_URL);
}

/** true si hay una sesión válida y no vencida */
export function isAuthenticated() {
  const raw = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!raw) return false;

  try {
    const session = JSON.parse(raw);
    if (session?.ok && session.expiresAt > Date.now()) return true;
  } catch {
    // Sesión de una versión anterior (guardaba el string 'true'): no es válida.
  }

  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  return false;
}

/**
 * Protege una página del panel: si no hay sesión, redirige al login.
 * @returns {boolean} true si la sesión es válida
 */
export function requireAuth() {
  if (isAuthenticated()) return true;
  window.location.replace(LOGIN_URL);
  return false;
}
