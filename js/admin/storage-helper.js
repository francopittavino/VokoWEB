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

// ── Products (localStorage metadata + IndexedDB images) ──

export const INITIAL_DEMO_PRODUCTS = [
  { id: 'prod-1', nombre: 'Bolso Weekend', precio: 85000, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-2', nombre: 'Bandolera Suede', precio: 45000, badge: 'limitado', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop', categoria_id: 'cat-2', descripcion: '' },
  { id: 'prod-3', nombre: 'Riñonera Urban Brown', precio: 32000, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop', categoria_id: 'cat-3', descripcion: '' },
  { id: 'prod-4', nombre: 'Bolso XL Canvas', precio: 75000, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-5', nombre: 'Morral Nomad', precio: 62000, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop', categoria_id: 'cat-5', descripcion: '' },
  { id: 'prod-6', nombre: 'Matero Premium Cuero', precio: 58000, badge: 'best-seller', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=400&fit=crop', categoria_id: 'cat-6', descripcion: '' },
  { id: 'prod-7', nombre: 'Cartera Minimal', precio: 92000, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', categoria_id: 'cat-4', descripcion: '' },
  { id: 'prod-8', nombre: 'Sobre de Gala', precio: 28000, badge: 'elegante', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop', categoria_id: 'cat-7', descripcion: '' },
];

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
