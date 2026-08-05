/* ============================================
   VOKO ACCESORIOS — Cart
   Shopping cart with localStorage persistence
   and WhatsApp checkout
   ============================================ */

import { formatPrice, getWhatsAppLink, APP_CONFIG } from './config.js';

// ──────────────────────────────────────────
// CART STATE
// ──────────────────────────────────────────
const CART_STORAGE_KEY = 'voko_cart';

let cart = [];
let isCartOpen = false;

function loadCart() {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    cart = stored ? JSON.parse(stored) : [];
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

// ──────────────────────────────────────────
// CART OPERATIONS
// ──────────────────────────────────────────

export function addToCart(product) {
  const existingIndex = cart.findIndex((item) => item.id === product.id);

  if (existingIndex >= 0) {
    cart[existingIndex].quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.nombre || product.name,
      price: product.precio || product.price,
      image: product.imagen_url || product.image || '',
      quantity: 1,
    });
  }

  saveCart();
  updateCartUI();
  showToast(`${product.nombre || product.name} agregado al carrito`);
}

export function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart();
  updateCartUI();
}

export function updateQuantity(productId, newQuantity) {
  if (newQuantity <= 0) {
    removeFromCart(productId);
    return;
  }

  const item = cart.find((item) => item.id === productId);
  if (item) {
    item.quantity = newQuantity;
    saveCart();
    updateCartUI();
  }
}

export function clearCart() {
  cart = [];
  saveCart();
  updateCartUI();
}

export function getCart() {
  return [...cart];
}

export function getCartTotal() {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

export function getCartCount() {
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// ──────────────────────────────────────────
// UI UPDATES
// ──────────────────────────────────────────

function updateCartUI() {
  updateBadge();
  renderCartItems();
  updateCartTotal();
}

function updateBadge() {
  const badges = document.querySelectorAll('.navbar__cart-badge');
  const count = getCartCount();

  badges.forEach((badge) => {
    badge.textContent = count;
    if (count > 0) {
      badge.classList.add('show');
    } else {
      badge.classList.remove('show');
    }
  });
}

function renderCartItems() {
  const cartBody = document.querySelector('.cart-sidebar__body');
  if (!cartBody) return;

  if (cart.length === 0) {
    cartBody.innerHTML = `
      <div class="cart-sidebar__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p>Tu carrito está esperando ser llenado.</p>
      </div>
    `;
    return;
  }

  cartBody.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item" data-id="${item.id}">
      <img class="cart-item__image" src="${item.image || '/images/placeholder.jpg'}" alt="${item.name}" loading="lazy">
      <div class="cart-item__info">
        <div class="cart-item__name">${item.name}</div>
        <div class="cart-item__price">${formatPrice(item.price)}</div>
        <div class="cart-item__controls">
          <button class="cart-item__qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Reducir cantidad">−</button>
          <span class="cart-item__qty">${item.quantity}</span>
          <button class="cart-item__qty-btn" data-action="increase" data-id="${item.id}" aria-label="Aumentar cantidad">+</button>
        </div>
      </div>
      <button class="cart-item__remove" data-action="remove" data-id="${item.id}" aria-label="Eliminar del carrito">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `
    )
    .join('');

  // Attach event listeners
  cartBody.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const item = cart.find((i) => i.id === id);

      if (action === 'increase' && item) {
        updateQuantity(id, item.quantity + 1);
      } else if (action === 'decrease' && item) {
        updateQuantity(id, item.quantity - 1);
      } else if (action === 'remove') {
        removeFromCart(id);
      }
    });
  });
}

function updateCartTotal() {
  const totalEl = document.querySelector('.cart-sidebar__total-value');
  if (totalEl) {
    totalEl.textContent = formatPrice(getCartTotal());
  }

  // Enable/disable checkout button
  const checkoutBtn = document.querySelector('.cart-sidebar__checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.disabled = cart.length === 0;
  }
}

// ──────────────────────────────────────────
// CART SIDEBAR TOGGLE
// ──────────────────────────────────────────

export function openCart() {
  const sidebar = document.querySelector('.cart-sidebar');
  const overlay = document.querySelector('.cart-overlay');
  if (!sidebar) return;

  isCartOpen = true;
  sidebar.classList.add('open');
  overlay?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeCart() {
  const sidebar = document.querySelector('.cart-sidebar');
  const overlay = document.querySelector('.cart-overlay');
  if (!sidebar) return;

  isCartOpen = false;
  sidebar.classList.remove('open');
  overlay?.classList.remove('open');
  document.body.style.overflow = '';
}

export function toggleCart() {
  if (isCartOpen) {
    closeCart();
  } else {
    openCart();
  }
}

// ──────────────────────────────────────────
// WHATSAPP CHECKOUT
// ──────────────────────────────────────────

export function checkoutWhatsApp() {
  if (cart.length === 0) return;

  let message = `🛒 *Nuevo Pedido — Voko Accesorios*\n\n`;
  message += `Hola! Quiero hacer el siguiente pedido:\n\n`;

  cart.forEach((item, index) => {
    message += `${index + 1}. *${item.name}* x${item.quantity} — ${formatPrice(item.price * item.quantity)}\n`;
  });

  message += `\n──────────────\n`;
  message += `*Total estimado: ${formatPrice(getCartTotal())}*\n\n`;
  message += `¡Gracias! 😊`;

  const url = getWhatsAppLink(message);
  window.open(url, '_blank');
}

// ──────────────────────────────────────────
// TOAST NOTIFICATION
// ──────────────────────────────────────────

function showToast(message, type = 'default') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type !== 'default' ? `toast--${type}` : ''}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
    ${message}
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

// ──────────────────────────────────────────
// INITIALIZE CART
// ──────────────────────────────────────────

export function initCart() {
  loadCart();

  // Cart toggle button
  document.querySelectorAll('[data-cart-toggle]').forEach((btn) => {
    btn.addEventListener('click', toggleCart);
  });

  // Close button
  document.querySelectorAll('.cart-sidebar__close').forEach((btn) => {
    btn.addEventListener('click', closeCart);
  });

  // Overlay click to close
  document.querySelectorAll('.cart-overlay').forEach((overlay) => {
    overlay.addEventListener('click', closeCart);
  });

  // Checkout button
  document.querySelectorAll('.cart-sidebar__checkout-btn').forEach((btn) => {
    btn.addEventListener('click', checkoutWhatsApp);
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isCartOpen) {
      closeCart();
    }
  });

  updateCartUI();
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCart);
} else {
  initCart();
}
