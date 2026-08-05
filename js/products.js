/* ============================================
   VOKO ACCESORIOS — Products
   Dynamic product loading from Supabase
   with filters, search, and sorting
   ============================================ */

import { getProducts, getCategories } from './supabase.js';
import { formatPrice } from './config.js';
import { addToCart } from './cart.js';

// ──────────────────────────────────────────
// DEMO DATA (used when Supabase isn't configured)
// ──────────────────────────────────────────
const DEMO_CATEGORIES = [
  { id: 'cat-1', nombre: 'Bolsos', orden: 1 },
  { id: 'cat-2', nombre: 'Bandoleras', orden: 2 },
  { id: 'cat-3', nombre: 'Riñoneras', orden: 3 },
  { id: 'cat-4', nombre: 'Carteras', orden: 4 },
  { id: 'cat-5', nombre: 'Morrales', orden: 5 },
  { id: 'cat-6', nombre: 'Materos', orden: 6 },
  { id: 'cat-7', nombre: 'Sobres', orden: 7 },
  { id: 'cat-8', nombre: 'Cinturones', orden: 8 },
  { id: 'cat-9', nombre: 'Billeteras', orden: 9 },
];

const DEMO_PRODUCTS = [
  {
    id: 'prod-1', nombre: 'Bolso Weekend', precio: 85000, stock: 5,
    badge: 'nuevo', destacado: true, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
    categorias: { nombre: 'Bolsos' }, categoria_id: 'cat-1',
  },
  {
    id: 'prod-2', nombre: 'Bandolera Suede', precio: 45000, stock: 8,
    badge: 'limitado', destacado: true, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
    categorias: { nombre: 'Bandoleras' }, categoria_id: 'cat-2',
  },
  {
    id: 'prod-3', nombre: 'Riñonera Urban Brown', precio: 32000, stock: 12,
    badge: null, destacado: false, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop',
    categorias: { nombre: 'Riñoneras' }, categoria_id: 'cat-3',
  },
  {
    id: 'prod-4', nombre: 'Bolso XL Canvas', precio: 75000, stock: 3,
    badge: 'nuevo', destacado: true, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
    categorias: { nombre: 'Bolsos' }, categoria_id: 'cat-1',
  },
  {
    id: 'prod-5', nombre: 'Morral Nomad', precio: 62000, stock: 6,
    badge: null, destacado: false, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop',
    categorias: { nombre: 'Morrales' }, categoria_id: 'cat-5',
  },
  {
    id: 'prod-6', nombre: 'Matero Premium Cuero', precio: 58000, stock: 10,
    badge: 'best-seller', destacado: true, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=400&fit=crop',
    categorias: { nombre: 'Materos' }, categoria_id: 'cat-6',
  },
  {
    id: 'prod-7', nombre: 'Cartera Minimal', precio: 92000, stock: 2,
    badge: null, destacado: false, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
    categorias: { nombre: 'Carteras' }, categoria_id: 'cat-4',
  },
  {
    id: 'prod-8', nombre: 'Sobre de Gala', precio: 28000, stock: 15,
    badge: 'elegante', destacado: false, activo: true,
    imagen_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop',
    categorias: { nombre: 'Sobres' }, categoria_id: 'cat-7',
  },
];

// ──────────────────────────────────────────
// STATE
// ──────────────────────────────────────────
let allProducts = [];
let allCategories = [];
let currentFilters = {
  categoryId: null,
  search: '',
  minPrice: null,
  maxPrice: null,
  sortBy: 'created_at',
  sortAsc: false,
};

// ──────────────────────────────────────────
// CHECK IF SUPABASE IS CONFIGURED
// ──────────────────────────────────────────
function isSupabaseReady() {
  const url = import.meta.env?.VITE_SUPABASE_URL || '';
  return url && !url.includes('TU-PROYECTO') && url.startsWith('http');
}

// ──────────────────────────────────────────
// LOAD DATA (Instant local check + Supabase fallback)
// ──────────────────────────────────────────

export async function loadProducts(filters = {}) {
  // Check localStorage first (reflects Admin Panel creations instantly)
  const stored = localStorage.getItem('voko_products');
  if (stored) {
    try {
      allProducts = JSON.parse(stored);
      return filterProducts(allProducts);
    } catch {
      // Fallback if parsing fails
    }
  }

  // If Supabase is real & configured, fetch from cloud
  if (isSupabaseReady()) {
    try {
      allProducts = await getProducts(filters);
      localStorage.setItem('voko_products', JSON.stringify(allProducts));
      return allProducts;
    } catch (e) {
      console.warn('Could not connect to Supabase, using local data.', e);
    }
  }

  // Instant fallback to demo products
  allProducts = [...DEMO_PRODUCTS];
  localStorage.setItem('voko_products', JSON.stringify(allProducts));
  return allProducts;
}

export async function loadCategories() {
  const stored = localStorage.getItem('voko_categories');
  if (stored) {
    try {
      allCategories = JSON.parse(stored);
      return allCategories;
    } catch {}
  }

  if (isSupabaseReady()) {
    try {
      allCategories = await getCategories();
      localStorage.setItem('voko_categories', JSON.stringify(allCategories));
      return allCategories;
    } catch {}
  }

  allCategories = [...DEMO_CATEGORIES];
  localStorage.setItem('voko_categories', JSON.stringify(allCategories));
  return allCategories;
}

export async function loadFeaturedProducts(limit = 4) {
  const prods = await loadProducts();
  return prods.filter((p) => p.destacado).slice(0, limit);
}

// ──────────────────────────────────────────
// FILTER & SORT
// ──────────────────────────────────────────

function filterProducts(products) {
  let filtered = [...products];

  // Category filter
  if (currentFilters.categoryId) {
    filtered = filtered.filter(
      (p) => p.categoria_id === currentFilters.categoryId
    );
  }

  // Search filter
  if (currentFilters.search) {
    const query = currentFilters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.nombre.toLowerCase().includes(query) ||
        p.categorias?.nombre?.toLowerCase().includes(query)
    );
  }

  // Price filter
  if (currentFilters.minPrice) {
    filtered = filtered.filter((p) => p.precio >= currentFilters.minPrice);
  }
  if (currentFilters.maxPrice) {
    filtered = filtered.filter((p) => p.precio <= currentFilters.maxPrice);
  }

  // Sort
  filtered.sort((a, b) => {
    let valA, valB;
    switch (currentFilters.sortBy) {
      case 'precio':
        valA = a.precio;
        valB = b.precio;
        break;
      case 'nombre':
        valA = a.nombre.toLowerCase();
        valB = b.nombre.toLowerCase();
        break;
      default:
        valA = a.created_at || a.id;
        valB = b.created_at || b.id;
    }

    if (valA < valB) return currentFilters.sortAsc ? -1 : 1;
    if (valA > valB) return currentFilters.sortAsc ? 1 : -1;
    return 0;
  });

  return filtered;
}

// ──────────────────────────────────────────
// RENDER
// ──────────────────────────────────────────

function createProductCard(product) {
  const badgeHTML = product.badge
    ? `<span class="product-card__badge product-card__badge--${product.badge}">${
        product.badge.charAt(0).toUpperCase() + product.badge.slice(1).replace('-', ' ')
      }</span>`
    : '';

  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-card__image-container">
      <img class="product-card__image" 
           src="${product.imagen_url || '/images/placeholder.jpg'}" 
           alt="${product.nombre}"
           loading="lazy">
      ${badgeHTML}
    </div>
    <div class="product-card__body">
      <div class="product-card__category">${product.categorias?.nombre || ''}</div>
      <h3 class="product-card__name">${product.nombre}</h3>
      <div class="product-card__price">${formatPrice(product.precio)}</div>
      <button class="product-card__add-btn" data-product-id="${product.id}" aria-label="Agregar ${product.nombre} al carrito">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Agregar
      </button>
    </div>
  `;

  // Add to cart click handler
  const addBtn = card.querySelector('.product-card__add-btn');
  addBtn.addEventListener('click', () => {
    addToCart(product);
    // Button feedback animation
    addBtn.textContent = '✓ Agregado';
    addBtn.style.backgroundColor = 'var(--color-success)';
    setTimeout(() => {
      addBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Agregar
      `;
      addBtn.style.backgroundColor = '';
    }, 1200);
  });

  return card;
}

export function renderProducts(containerSelector, products) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  const filtered = filterProducts(products || allProducts);

  // Update count
  const countEl = document.querySelector('.products-page__count');
  if (countEl) {
    countEl.textContent = `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} disponible${filtered.length !== 1 ? 's' : ''}`;
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="products-grid__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>No se encontraron productos</h3>
        <p>Probá con otros filtros o buscá algo diferente.</p>
      </div>
    `;
    return;
  }

  filtered.forEach((product) => {
    container.appendChild(createProductCard(product));
  });
}

export function renderCategoryChips(containerSelector, onCategoryChange) {
  const container = document.querySelector(containerSelector);
  if (!container) return;

  container.innerHTML = '';

  // "All" chip
  const allChip = document.createElement('button');
  allChip.className = 'chip active';
  allChip.textContent = 'Todas';
  allChip.addEventListener('click', () => {
    currentFilters.categoryId = null;
    container.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
    allChip.classList.add('active');
    onCategoryChange?.();
  });
  container.appendChild(allChip);

  allCategories.forEach((cat) => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = cat.nombre;
    chip.addEventListener('click', () => {
      currentFilters.categoryId = cat.id;
      container.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      onCategoryChange?.();
    });
    container.appendChild(chip);
  });
}

// ──────────────────────────────────────────
// FILTERS INIT
// ──────────────────────────────────────────

export function initProductFilters(renderCallback) {
  // Search
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentFilters.search = e.target.value;
        renderCallback();
      }, 300);
    });
  }

  // Price filters
  const minPriceInput = document.getElementById('price-min');
  const maxPriceInput = document.getElementById('price-max');

  if (minPriceInput) {
    minPriceInput.addEventListener('change', (e) => {
      currentFilters.minPrice = e.target.value ? Number(e.target.value) : null;
      renderCallback();
    });
  }

  if (maxPriceInput) {
    maxPriceInput.addEventListener('change', (e) => {
      currentFilters.maxPrice = e.target.value ? Number(e.target.value) : null;
      renderCallback();
    });
  }

  // Sort
  const sortSelect = document.getElementById('product-sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      switch (val) {
        case 'newest':
          currentFilters.sortBy = 'created_at';
          currentFilters.sortAsc = false;
          break;
        case 'price-asc':
          currentFilters.sortBy = 'precio';
          currentFilters.sortAsc = true;
          break;
        case 'price-desc':
          currentFilters.sortBy = 'precio';
          currentFilters.sortAsc = false;
          break;
        case 'name':
          currentFilters.sortBy = 'nombre';
          currentFilters.sortAsc = true;
          break;
      }
      renderCallback();
    });
  }
}
