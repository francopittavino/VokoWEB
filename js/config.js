/* ============================================
   VOKO ACCESORIOS — Configuration
   Supabase credentials & app constants
   ============================================ */

// ──────────────────────────────────────────
// SUPABASE CONFIG
// Reemplazar con tus credenciales reales de supabase.com
// ──────────────────────────────────────────
export const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
export const SUPABASE_ANON_KEY = 'TU-ANON-KEY-AQUI';

// ──────────────────────────────────────────
// APP CONFIG
// ──────────────────────────────────────────
export const APP_CONFIG = {
  name: 'Voko Accesorios',
  tagline: 'Creando accesorios con alma para personas con estilo.',
  currency: 'ARS',
  currencySymbol: '$',
  locale: 'es-AR',

  // WhatsApp
  whatsappNumber: '5493434289398',
  whatsappMessage: '¡Hola! Me interesa hacer un pedido desde la web 🛒',

  // Redes Sociales
  socialLinks: {
    instagram: 'https://www.instagram.com/voko.accesorios',
    facebook: 'https://www.facebook.com/profile.php?id=61589357885130',
    whatsapp: 'https://wa.me/5493434289398',
  },

  // Contacto
  contact: {
    email: 'hola@vokoaccesorios.com',
    phone: '+54 9 343 428-9398',
    address: 'Calle Artesanos 123, Ciudad Creativa',
  },

  // Admin
  admin: {
    defaultUser: 'admin',
    // En producción, esto debería estar en Supabase Auth
    // Por ahora usamos un hash simple para el MVP
  },

  // Productos
  lowStockThreshold: 3,
  defaultMargin: 40,

  // Badges disponibles
  badges: [
    { id: 'nuevo', label: 'Nuevo', class: 'product-card__badge--nuevo' },
    { id: 'best-seller', label: 'Best Seller', class: 'product-card__badge--best-seller' },
    { id: 'limitado', label: 'Limitado', class: 'product-card__badge--limitado' },
    { id: 'elegante', label: 'Elegante', class: 'product-card__badge--elegante' },
  ],
};

// ──────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────

/**
 * Formatea un precio en pesos argentinos
 * @param {number} price
 * @returns {string} e.g. "$85.000"
 */
export function formatPrice(price) {
  return new Intl.NumberFormat(APP_CONFIG.locale, {
    style: 'currency',
    currency: APP_CONFIG.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Genera un link de WhatsApp con mensaje pre-armado
 * @param {string} message
 * @returns {string} URL de WhatsApp
 */
export function getWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${APP_CONFIG.whatsappNumber}?text=${encoded}`;
}
