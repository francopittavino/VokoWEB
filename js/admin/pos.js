import { formatPrice, SUPABASE_URL } from '/js/config.js';

function isSupabaseReady() {
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

const DEMO_IMAGES = {
  'prod-1': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop',
  'prod-2': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop',
  'prod-3': 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop',
  'prod-4': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop',
  'prod-5': 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop',
  'prod-6': 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=400&fit=crop',
  'prod-7': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop',
  'prod-8': 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop',
};

function getProductImg(p) {
  if (p.imagen_url && p.imagen_url.startsWith('http')) return p.imagen_url;
  if (p.imagen && p.imagen.startsWith('http')) return p.imagen;
  if (p.id && DEMO_IMAGES[p.id]) return DEMO_IMAGES[p.id];
  return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop';
}

const DEMO_PRODUCTS = [
  { id: 'prod-1', nombre: 'Bolso Weekend', precio: 85000, stock: 5, badge: 'nuevo', destacado: true, activo: true, categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-2', nombre: 'Bandolera Suede', precio: 45000, stock: 8, badge: 'limitado', destacado: true, activo: true, categoria_id: 'cat-2', descripcion: '' },
  { id: 'prod-3', nombre: 'Riñonera Urban Brown', precio: 32000, stock: 12, badge: '', destacado: false, activo: true, categoria_id: 'cat-3', descripcion: '' },
  { id: 'prod-4', nombre: 'Bolso XL Canvas', precio: 75000, stock: 3, badge: 'nuevo', destacado: true, activo: true, categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-5', nombre: 'Morral Nomad', precio: 62000, stock: 6, badge: '', destacado: false, activo: true, categoria_id: 'cat-5', descripcion: '' },
  { id: 'prod-6', nombre: 'Matero Premium Cuero', precio: 58000, stock: 10, badge: 'best-seller', destacado: true, activo: true, categoria_id: 'cat-6', descripcion: '' },
  { id: 'prod-7', nombre: 'Cartera Minimal', precio: 92000, stock: 2, badge: '', destacado: false, activo: true, categoria_id: 'cat-4', descripcion: '' },
  { id: 'prod-8', nombre: 'Sobre de Gala', precio: 28000, stock: 15, badge: 'elegante', destacado: false, activo: true, categoria_id: 'cat-7', descripcion: '' },
];

function getStoredProducts() {
  const stored = localStorage.getItem('voko_products');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return [...DEMO_PRODUCTS];
}

let products = getStoredProducts();
let currentSale = [];
let salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');

// Heal any product image fields in localStorage
products = products.map(p => {
  const validImg = getProductImg(p);
  return { ...p, imagen_url: validImg, imagen: validImg };
});
localStorage.setItem('voko_products', JSON.stringify(products));

/**
 * Render visual grid of product cards with photos
 */
function populateProducts(filterText = '') {
  const grid = document.getElementById('pos-products-grid');
  if (!grid) return;

  const activeProducts = products.filter(p => p.activo !== false && p.stock > 0);
  const filtered = activeProducts.filter(p => 
    p.nombre.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: var(--space-6); text-align: center; color: var(--color-on-surface-variant);">
      No se encontraron productos disponibles ${filterText ? 'para "' + filterText + '"' : ''}.
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const isLowStock = p.stock <= 3;
    const imgUrl = getProductImg(p);
    return `
      <div class="pos-product-card" data-product-id="${p.id}">
        <img src="${imgUrl}" alt="${p.nombre}" class="pos-product-card__img" onerror="this.src='https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'">
        <div class="pos-product-card__name">${p.nombre}</div>
        <div class="pos-product-card__price">${formatPrice(p.precio)}</div>
        <div class="pos-product-card__stock ${isLowStock ? 'pos-product-card__stock--low' : ''}">
          ${isLowStock ? '⚠ ' : ''}Stock: ${p.stock} un.
        </div>
      </div>
    `;
  }).join('');

  // Attach click listener to each product card
  grid.querySelectorAll('.pos-product-card').forEach(card => {
    card.addEventListener('click', () => {
      const prodId = card.getAttribute('data-product-id');
      addToSale(prodId);
    });
  });
}

function addToSale(prodId) {
  const product = products.find(p => p.id === prodId);
  if (!product) return;

  const existing = currentSale.find(i => i.id === prodId);
  const currentQty = existing ? existing.cantidad : 0;

  if (currentQty + 1 > product.stock) {
    alert(`Stock insuficiente. Solo quedan ${product.stock} unidades de "${product.nombre}".`);
    return;
  }

  const imgUrl = getProductImg(product);

  if (existing) {
    existing.cantidad += 1;
  } else {
    currentSale.push({
      id: product.id,
      nombre: product.nombre,
      precio: product.precio,
      imagen: imgUrl,
      imagen_url: imgUrl,
      cantidad: 1
    });
  }

  renderSaleItems();
}

function renderSaleItems() {
  const tbody = document.getElementById('pos-items-tbody');
  if (!tbody) return;

  if (currentSale.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-on-surface-variant); padding: var(--space-6);">No hay productos agregados a la venta</td></tr>`;
    document.getElementById('pos-subtotal').textContent = '$0';
    document.getElementById('pos-total').textContent = '$0';
    const confirmBtn = document.getElementById('pos-confirm-btn');
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }

  let total = 0;
  tbody.innerHTML = currentSale.map((item, idx) => {
    const sub = item.precio * item.cantidad;
    total += sub;
    const imgUrl = getProductImg(item);
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:var(--space-3);">
            <img src="${imgUrl}" alt="${item.nombre}" style="width:40px; height:40px; border-radius:var(--radius-sm); object-fit:cover; background:var(--color-surface-container);" onerror="this.src='https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'">
            <strong>${item.nombre}</strong>
          </div>
        </td>
        <td>
          <div style="display:flex; align-items:center; gap:4px;">
            <button class="btn btn--sm btn--tertiary" style="padding: 2px 8px;" onclick="updateItemQty(${idx}, -1)">-</button>
            <span style="font-weight: bold; min-width: 20px; text-align: center;">${item.cantidad}</span>
            <button class="btn btn--sm btn--tertiary" style="padding: 2px 8px;" onclick="updateItemQty(${idx}, 1)">+</button>
          </div>
        </td>
        <td>${formatPrice(item.precio)}</td>
        <td><strong>${formatPrice(sub)}</strong></td>
        <td><button class="admin-table__action-btn admin-table__action-btn--delete" onclick="removeItem(${idx})" title="Eliminar item">✕</button></td>
      </tr>
    `;
  }).join('');

  document.getElementById('pos-subtotal').textContent = formatPrice(total);
  document.getElementById('pos-total').textContent = formatPrice(total);
  const confirmBtn = document.getElementById('pos-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

window.updateItemQty = (idx, delta) => {
  const item = currentSale[idx];
  if (!item) return;
  const product = products.find(p => p.id === item.id);

  if (delta > 0 && product && item.cantidad + 1 > product.stock) {
    alert(`Solo quedan ${product.stock} unidades de ${product.nombre}`);
    return;
  }

  item.cantidad += delta;
  if (item.cantidad <= 0) {
    currentSale.splice(idx, 1);
  }
  renderSaleItems();
};

window.removeItem = (idx) => {
  currentSale.splice(idx, 1);
  renderSaleItems();
};

function renderHistory() {
  const container = document.getElementById('pos-history-list');
  if (!container) return;
  if (salesHistory.length === 0) {
    container.innerHTML = `<p style="color:var(--color-on-surface-variant);font-size:var(--fs-body-sm);">Sin ventas registradas hoy.</p>`;
    return;
  }

  container.innerHTML = salesHistory.slice(0, 5).map(s => `
    <div style="display:flex;justify-content:space-between;padding:var(--space-2) 0;border-bottom:1px solid var(--color-surface-container-high);font-size:var(--fs-body-sm);">
      <span>${s.fecha} (${s.itemsCount} items)</span>
      <strong>${formatPrice(s.total)}</strong>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  // Load products from Supabase if ready, otherwise use localStorage
  if (isSupabaseReady()) {
    try {
      const { getAllProducts } = await import('/js/supabase.js');
      const cloudProds = await getAllProducts();
      if (cloudProds?.length) {
        products = cloudProds;
        localStorage.setItem('voko_products', JSON.stringify(products));
      }
    } catch (e) {
      console.info('POS: Supabase fallback to local products:', e);
    }
  }

  // Live search listener
  const searchInput = document.getElementById('pos-search-input');
  searchInput?.addEventListener('input', (e) => {
    populateProducts(e.target.value);
  });

  // Confirm sale button
  document.getElementById('pos-confirm-btn')?.addEventListener('click', async () => {
    if (currentSale.length === 0) return;

    let total = 0;
    currentSale.forEach(item => {
      total += item.precio * item.cantidad;
    });

    if (isSupabaseReady()) {
      try {
        const { createSale } = await import('/js/supabase.js');
        await createSale({
          total,
          metodo_pago: 'Efectivo',
          items: currentSale.map(item => ({
            producto_id: item.id,
            cantidad: item.cantidad,
            precio_unitario: item.precio,
          })),
        });
        const { getAllProducts } = await import('/js/supabase.js');
        products = await getAllProducts();
        localStorage.setItem('voko_products', JSON.stringify(products));
      } catch (e) {
        console.warn('POS: Supabase sale save failed, saving locally:', e);
        currentSale.forEach(item => {
          const p = products.find(pr => pr.id === item.id);
          if (p) p.stock = Math.max(0, p.stock - item.cantidad);
        });
        localStorage.setItem('voko_products', JSON.stringify(products));
      }
    } else {
      currentSale.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.cantidad);
      });
      localStorage.setItem('voko_products', JSON.stringify(products));
    }

    salesHistory.unshift({
      id: 'sale-' + Date.now(),
      fecha: new Date().toLocaleDateString('es-AR') + ' ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      total,
      itemsCount: currentSale.reduce((acc, i) => acc + i.cantidad, 0),
      items: currentSale.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        imagen: getProductImg(item),
        imagen_url: getProductImg(item),
        cantidad: item.cantidad
      }))
    });
    localStorage.setItem('voko_sales_history', JSON.stringify(salesHistory));

    alert('¡Venta registrada con éxito! El stock ha sido actualizado.');
    currentSale = [];
    populateProducts(searchInput?.value || '');
    renderSaleItems();
    renderHistory();
  });

  // Sidebar toggle
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });
  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  populateProducts();
  renderSaleItems();
  renderHistory();
});
