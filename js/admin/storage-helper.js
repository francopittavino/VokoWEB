/* ============================================
   VOKO ACCESORIOS — Storage Helper
   Single source of truth for products & sales
   ============================================ */

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

export function saveLocalProducts(products) {
  try {
    localStorage.setItem('voko_products', JSON.stringify(products));
  } catch (e) {
    console.error('Error al guardar productos en localStorage (exceso de cuota):', e);
  }
  // Dispatch custom event so current window reacts instantly as well
  window.dispatchEvent(new CustomEvent('voko_products_updated', { detail: products }));
}

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
