/* ============================================
   VOKO ACCESORIOS — Products
   Dynamic product loading from Supabase
   with filters, search, and sorting
   ============================================ */

import { getProducts, getCategories } from './supabase.js';
import { formatPrice, SUPABASE_URL } from './config.js';
import { addToCart } from './cart.js';
import {
  getLocalProducts,
  saveLocalProducts,
  getProductImg,
  getStock,
  INITIAL_DEMO_CATEGORIES,
} from './admin/storage-helper.js';

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
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

// ──────────────────────────────────────────
// LOAD DATA (Instant local check + Supabase fallback)
// ──────────────────────────────────────────

export async function loadProducts(filters = {}) {
  // If Supabase is configured, always try cloud first for fresh data
  if (isSupabaseReady()) {
    try {
      allProducts = await getProducts(filters);
      saveLocalProducts(allProducts);
      return filterProducts(allProducts);
    } catch (e) {
      console.warn('Could not connect to Supabase, trying local cache.', e);
    }
  }

  // Fallback: check localStorage (reflects Admin Panel creations)
  allProducts = getLocalProducts();
  return filterProducts(allProducts);
}

export async function loadCategories() {
  // If Supabase is configured, always try cloud first for fresh data
  if (isSupabaseReady()) {
    try {
      allCategories = await getCategories();
      localStorage.setItem('voko_categories', JSON.stringify(allCategories));
      return allCategories;
    } catch (e) {
      console.warn('Could not load categories from Supabase, trying local cache.', e);
    }
  }

  // Fallback: check localStorage
  const stored = localStorage.getItem('voko_categories');
  if (stored) {
    try {
      allCategories = JSON.parse(stored);
      return allCategories;
    } catch {}
  }

  // Last resort: demo categories
  allCategories = INITIAL_DEMO_CATEGORIES.map((cat) => ({ ...cat }));
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
  // El stock es lo ÚNICO que decide si un producto se publica: en 0 desaparece
  // de la tienda. Lo descuenta el Punto de Venta al cobrar; la web nunca lo toca,
  // porque las ventas online se cierran por WhatsApp y se cargan a mano en el POS.
  let filtered = products.filter((p) => getStock(p) > 0);

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

export function createProductCard(product) {
  const badgeHTML = product.badge
    ? `<span class="product-card__badge product-card__badge--${product.badge}">${
        product.badge.charAt(0).toUpperCase() + product.badge.slice(1).replace('-', ' ')
      }</span>`
    : '';

  const stock = getStock(product);
  const soldOut = stock === 0;

  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-card__image-container" title="Hacer clic para ampliar imagen">
      <img class="product-card__image"
           src="${getProductImg(product)}"
           alt="${product.nombre}"
           loading="lazy">
      ${badgeHTML}
      <span style="position: absolute; bottom: 8px; right: 8px; background: rgba(0,0,0,0.6); color: #fff; padding: 4px 8px; border-radius: 12px; font-size: 11px; backdrop-filter: blur(4px);">🔍 Ver Foto</span>
    </div>
    <div class="product-card__body">
      <div class="product-card__category">${product.categorias?.nombre || ''}</div>
      <h3 class="product-card__name" style="cursor: pointer;" title="Ampliar imagen">${product.nombre}</h3>
      <div class="product-card__price">${formatPrice(product.precio)}</div>
      <button class="product-card__add-btn" data-product-id="${product.id}" ${soldOut ? 'disabled' : ''} aria-label="${soldOut ? `${product.nombre} sin stock` : `Agregar ${product.nombre} al carrito`}">
        ${soldOut ? 'Sin stock por ahora' : `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
        Agregar`}
      </button>
    </div>
  `;

  // Open Preview Modal on image or name click
  const imgContainer = card.querySelector('.product-card__image-container');
  const nameEl = card.querySelector('.product-card__name');
  [imgContainer, nameEl].forEach((el) => {
    el.addEventListener('click', () => openProductPreviewModal(product));
  });

  // Add to cart click handler
  const addBtn = card.querySelector('.product-card__add-btn');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    addToCart(product);
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

export function openProductPreviewModal(product) {
  let overlay = document.getElementById('preview-modal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'preview-modal-overlay';
    overlay.className = 'preview-modal-overlay';
    document.body.appendChild(overlay);
  }

  const name = product.nombre || product.name;
  const price = product.precio || product.price;
  const category = product.categorias?.nombre || 'Accesorio';
  const imgUrl = getProductImg(product);
  const stock = getStock(product);
  const soldOut = stock === 0;
  let qty = 1;

  overlay.innerHTML = `
    <div class="preview-modal">
      <button class="preview-modal__close" aria-label="Cerrar modal">✕</button>
      <div class="preview-modal__grid">
        <div class="preview-modal__img-wrapper" id="modal-img-wrapper">
          <img src="${imgUrl}" alt="${name}" class="preview-modal__img" id="modal-img">
          <span class="preview-modal__zoom-hint">🔍 Mové el cursor para Zoom</span>
        </div>
        <div class="preview-modal__body">
          <span class="preview-modal__category">${category}</span>
          <h2 class="preview-modal__title">${name}</h2>
          <div class="preview-modal__price">${formatPrice(price)}</div>

          <div class="preview-modal__qty-row">
            <span style="font-size: 14px; font-weight: 600;">Cantidad:</span>
            <div class="preview-modal__qty-picker">
              <button class="preview-modal__qty-btn" id="modal-qty-minus">−</button>
              <span class="preview-modal__qty-val" id="modal-qty-val">1</span>
              <button class="preview-modal__qty-btn" id="modal-qty-plus">+</button>
            </div>
          </div>

          <div class="preview-modal__actions">
            <button class="btn btn--primary btn--full" id="modal-add-cart" ${soldOut ? 'disabled' : ''}>
              ${soldOut ? 'Sin stock por ahora' : '🛒 Agregar al Carrito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Show modal
  setTimeout(() => overlay.classList.add('show'), 10);
  document.body.style.overflow = 'hidden';

  // Close helper
  const closeModal = () => {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  };

  overlay.querySelector('.preview-modal__close')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  // Quantity controls
  const qtyVal = overlay.querySelector('#modal-qty-val');
  overlay.querySelector('#modal-qty-minus')?.addEventListener('click', () => {
    if (qty > 1) {
      qty--;
      qtyVal.textContent = qty;
    }
  });

  overlay.querySelector('#modal-qty-plus')?.addEventListener('click', () => {
    if (stock > 0 && qty >= stock) return; // no ofrecer más unidades de las que hay
    qty++;
    qtyVal.textContent = qty;
  });

  // Add to cart
  overlay.querySelector('#modal-add-cart')?.addEventListener('click', () => {
    addToCart(product, qty);
    closeModal();
  });

  // Interactive Magnification Zoom on Image Move / Click
  const wrapper = overlay.querySelector('#modal-img-wrapper');
  const imgEl = overlay.querySelector('#modal-img');

  if (wrapper && imgEl) {
    wrapper.addEventListener('mousemove', (e) => {
      const rect = wrapper.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      imgEl.style.transformOrigin = `${x}% ${y}%`;
      wrapper.classList.add('zoomed');
    });

    wrapper.addEventListener('mouseleave', () => {
      wrapper.classList.remove('zoomed');
      imgEl.style.transformOrigin = 'center center';
    });

    wrapper.addEventListener('click', () => {
      wrapper.classList.toggle('zoomed');
    });
  }
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
