/* ============================================
   VOKO ACCESORIOS — Storage Helper
   Single source of truth for products & sales.
   Images stored in IndexedDB (50MB+).
   Metadata stored in localStorage.
   ============================================ */

// ── IndexedDB for images ──
const IDB_NAME = 'voko_images_db';
const IDB_VERSION = 1;
const IDB_STORE = 'images';

function openImagesDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Save an image data URL into IndexedDB, keyed by product ID */
export async function saveImageToIDB(productId, dataUrl) {
  try {
    const db = await openImagesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(dataUrl, productId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB saveImage failed:', e);
  }
}

/** Load an image data URL from IndexedDB by product ID */
export async function getImageFromIDB(productId) {
  try {
    const db = await openImagesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(productId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB getImage failed:', e);
    return null;
  }
}

/** Delete an image from IndexedDB */
export async function deleteImageFromIDB(productId) {
  try {
    const db = await openImagesDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(productId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (e) {
    console.warn('IndexedDB deleteImage failed:', e);
  }
}

// ── Helpers to externalize heavy base64 images ──
const IDB_REF_PREFIX = 'idb://';

/**
 * Before saving to localStorage, move any heavy base64 image to IndexedDB
 * and replace it with a lightweight reference: "idb://<productId>"
 */
export async function externalizeImages(products) {
  for (const p of products) {
    if (p.imagen_url && p.imagen_url.startsWith('data:image') && p.imagen_url.length > 500) {
      await saveImageToIDB(p.id, p.imagen_url);
      p.imagen_url = IDB_REF_PREFIX + p.id;
    }
  }
  return products;
}

/**
 * After reading from localStorage, resolve IndexedDB references back to data URLs
 */
export async function resolveImages(products) {
  for (const p of products) {
    if (p.imagen_url && p.imagen_url.startsWith(IDB_REF_PREFIX)) {
      const key = p.imagen_url.slice(IDB_REF_PREFIX.length);
      const dataUrl = await getImageFromIDB(key);
      if (dataUrl) {
        p.imagen_url = dataUrl;
      } else {
        // Image was lost from IDB, set a placeholder
        p.imagen_url = '';
      }
    }
  }
  return products;
}

// ── Datos semilla (única fuente de verdad para el modo demo) ──

/** Imagen de reserva cuando un producto no tiene foto cargada */
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop';

export const INITIAL_DEMO_CATEGORIES = [
  { id: 'cat-1', nombre: 'Bolsos', orden: 1, activa: true },
  { id: 'cat-2', nombre: 'Bandoleras', orden: 2, activa: true },
  { id: 'cat-3', nombre: 'Riñoneras', orden: 3, activa: true },
  { id: 'cat-4', nombre: 'Carteras', orden: 4, activa: true },
  { id: 'cat-5', nombre: 'Morrales', orden: 5, activa: true },
  { id: 'cat-6', nombre: 'Materos', orden: 6, activa: true },
  { id: 'cat-7', nombre: 'Sobres', orden: 7, activa: true },
  { id: 'cat-8', nombre: 'Cinturones', orden: 8, activa: true },
  { id: 'cat-9', nombre: 'Billeteras', orden: 9, activa: true },
];

export const INITIAL_DEMO_PRODUCTS = [
  { id: 'prod-1', nombre: 'Bolso Weekend', precio: 85000, stock: 5, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-2', nombre: 'Bandolera Suede', precio: 45000, stock: 8, badge: 'limitado', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop', categoria_id: 'cat-2', descripcion: '' },
  { id: 'prod-3', nombre: 'Riñonera Urban Brown', precio: 32000, stock: 12, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop', categoria_id: 'cat-3', descripcion: '' },
  { id: 'prod-4', nombre: 'Bolso XL Canvas', precio: 75000, stock: 3, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-5', nombre: 'Morral Nomad', precio: 62000, stock: 6, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop', categoria_id: 'cat-5', descripcion: '' },
  { id: 'prod-6', nombre: 'Matero Premium Cuero', precio: 58000, stock: 10, badge: 'best-seller', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=400&fit=crop', categoria_id: 'cat-6', descripcion: '' },
  { id: 'prod-7', nombre: 'Cartera Minimal', precio: 92000, stock: 2, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', categoria_id: 'cat-4', descripcion: '' },
  { id: 'prod-8', nombre: 'Sobre de Gala', precio: 28000, stock: 15, badge: 'elegante', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop', categoria_id: 'cat-7', descripcion: '' },
];

/**
 * Resuelve la imagen a mostrar de un producto o de un item de venta.
 * Acepta URLs http(s), data URLs (fotos subidas desde el panel) y cae
 * en la imagen de reserva si no hay nada usable.
 */
export function getProductImg(p) {
  if (!p) return PLACEHOLDER_IMAGE;
  const candidates = [p.imagen_url, p.imagen, p.image];
  for (const url of candidates) {
    if (typeof url === 'string' && (url.startsWith('http') || url.startsWith('data:image'))) {
      return url;
    }
  }
  return PLACEHOLDER_IMAGE;
}

/** Normaliza el stock de un producto a un entero >= 0 */
export function getStock(product) {
  const stock = Number(product?.stock);
  return Number.isFinite(stock) && stock > 0 ? Math.floor(stock) : 0;
}

/** Read products from localStorage (sync, metadata only) */
export function getLocalProducts() {
  const stored = localStorage.getItem('voko_products');
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('voko_products', JSON.stringify(INITIAL_DEMO_PRODUCTS));
  return JSON.parse(JSON.stringify(INITIAL_DEMO_PRODUCTS));
}

/** Read products and resolve their IndexedDB image references (async) */
export async function getLocalProductsWithImages() {
  const products = getLocalProducts();
  return resolveImages(products);
}

/** Save products: externalize heavy images to IndexedDB, save metadata to localStorage */
export async function saveLocalProductsAsync(products) {
  // Clone so we don't mutate the caller's array
  const toSave = JSON.parse(JSON.stringify(products));
  await externalizeImages(toSave);
  try {
    localStorage.setItem('voko_products', JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

/** Sync save (legacy, for non-image changes like toggling active) */
export function saveLocalProducts(products) {
  // Strip any data:image to avoid quota — only save references
  const toSave = products.map(p => {
    if (p.imagen_url && p.imagen_url.startsWith('data:image') && p.imagen_url.length > 500) {
      // This is an in-memory image that hasn't been externalized yet.
      // Save it to IDB asynchronously and store a ref.
      saveImageToIDB(p.id, p.imagen_url);
      return { ...p, imagen_url: IDB_REF_PREFIX + p.id };
    }
    return p;
  });
  try {
    localStorage.setItem('voko_products', JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving products to localStorage:', e);
  }
}

// ── Fechas ──

/**
 * ¿El registro (venta o pedido) es de hoy?
 * Usa `timestamp` si existe; si no, parsea el `fecha` en formato es-AR
 * ("8/8/2026 14:30") que guardaban las versiones anteriores.
 */
export function isFromToday(record) {
  if (!record) return false;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (Number.isFinite(record.timestamp)) {
    return record.timestamp >= startOfToday.getTime();
  }

  const match = String(record.fecha || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!match) return false;

  const [, day, month, year] = match;
  return (
    Number(day) === startOfToday.getDate() &&
    Number(month) === startOfToday.getMonth() + 1 &&
    Number(year) === startOfToday.getFullYear()
  );
}

// ── Sales ──

export function getLocalSales() {
  const stored = localStorage.getItem('voko_sales_history');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
}

export function saveLocalSales(sales) {
  localStorage.setItem('voko_sales_history', JSON.stringify(sales));
  window.dispatchEvent(new CustomEvent('voko_sales_updated', { detail: sales }));
}
