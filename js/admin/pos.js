import { formatPrice, SUPABASE_URL, APP_CONFIG } from '/js/config.js';
import {
  getLocalProducts,
  saveLocalProducts,
  getLocalSales,
  saveLocalSales,
  getProductImg,
  getStock,
  isFromToday,
  decreaseLocalStock,
  PLACEHOLDER_IMAGE,
} from './storage-helper.js';

function isSupabaseReady() {
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

let products = getLocalProducts();
let currentSale = [];
let salesHistory = getLocalSales();

/**
 * Render visual grid of product cards with photos
 */
function populateProducts(filterText = '') {
  const grid = document.getElementById('pos-products-grid');
  if (!grid) return;

  // Always re-read fresh products from storage
  products = getLocalProducts();

  // En el POS se listan todos: los agotados aparecen deshabilitados, para que
  // se vea que existen pero no se puedan vender.
  const filtered = products.filter(p =>
    p.nombre.toLowerCase().includes(filterText.toLowerCase().trim())
  );

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: var(--space-6); text-align: center; color: var(--color-on-surface-variant);">
      No se encontraron productos disponibles ${filterText ? 'para "' + filterText + '"' : ''}.
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgUrl = getProductImg(p);
    const stock = getStock(p);
    const soldOut = stock === 0;
    const low = !soldOut && stock <= APP_CONFIG.lowStockThreshold;
    const stockColor = soldOut
      ? 'var(--color-error)'
      : low
        ? 'var(--color-warning)'
        : 'var(--color-on-surface-variant)';

    return `
      <div class="pos-product-card${soldOut ? ' pos-product-card--disabled' : ''}" data-product-id="${p.id}" ${soldOut ? 'title="Sin stock disponible"' : ''} style="${soldOut ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
        <img src="${imgUrl}" alt="${p.nombre}" class="pos-product-card__img" onerror="this.src='${PLACEHOLDER_IMAGE}'">
        <div class="pos-product-card__name">${p.nombre}</div>
        <div class="pos-product-card__price">${formatPrice(p.precio)}</div>
        <div style="font-size: 11px; font-weight: 600; color: ${stockColor};">
          ${soldOut ? 'Sin stock' : `Stock: ${stock}`}
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

  const stock = getStock(product);
  if (stock === 0) {
    alert(`"${product.nombre}" no tiene stock disponible. Cargá unidades desde Inventario.`);
    return;
  }

  const existing = currentSale.find(i => i.id === prodId);
  const imgUrl = getProductImg(product);

  if (existing) {
    // No permitimos vender más unidades de las que hay cargadas.
    if (existing.cantidad >= stock) {
      alert(`Sólo quedan ${stock} unidad${stock > 1 ? 'es' : ''} de "${product.nombre}".`);
      return;
    }
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
            <img src="${imgUrl}" alt="${item.nombre}" style="width:40px; height:40px; border-radius:var(--radius-sm); object-fit:cover; background:var(--color-surface-container);" onerror="this.src='${PLACEHOLDER_IMAGE}'">
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

  if (delta > 0) {
    const stock = getStock(products.find(p => p.id === item.id));
    if (item.cantidad + delta > stock) {
      alert(`Sólo quedan ${stock} unidad${stock === 1 ? '' : 'es'} de "${item.nombre}".`);
      return;
    }
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

  // La tarjeta se titula "Ventas del Día": mostramos sólo las de hoy.
  const todaySales = salesHistory.filter(isFromToday);

  if (todaySales.length === 0) {
    container.innerHTML = `<p style="color:var(--color-on-surface-variant);font-size:var(--fs-body-sm);">Sin ventas registradas hoy.</p>`;
    return;
  }

  container.innerHTML = todaySales.slice(0, 5).map(s => `
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

    const confirmBtn = document.getElementById('pos-confirm-btn');
    confirmBtn.disabled = true;
    const textoOriginal = confirmBtn.innerHTML;
    confirmBtn.textContent = 'Registrando...';

    const itemsVenta = currentSale.map(item => ({
      producto_id: item.id,
      cantidad: item.cantidad,
      precio_unitario: item.precio,
    }));

    // Problemas al sincronizar con la nube. Se avisan al final: si el stock no
    // bajó en Supabase, al recargar volvería al valor viejo y se podría vender
    // algo que ya no hay. Antes esto moría en un console.warn invisible.
    const problemas = [];
    // Id de la venta en Supabase, para poder anularla después desde el dashboard
    let ventaRemotaId = null;

    if (isSupabaseReady()) {
      const { decreaseRemoteStock, createSale } = await import('/js/supabase.js');

      // 1) El stock primero: es lo crítico. Va aparte del registro de la venta
      //    para que un fallo al guardar la venta no deje el inventario mal.
      try {
        const fallidos = await decreaseRemoteStock(itemsVenta);
        fallidos.forEach(f => {
          const nombre = currentSale.find(i => String(i.id) === String(f.id))?.nombre || f.id;
          problemas.push(`No se pudo descontar el stock de "${nombre}" (${f.motivo}).`);
        });
      } catch (e) {
        problemas.push(`No se pudo actualizar el stock en la nube: ${e?.message || e}`);
      }

      // 2) El registro de la venta, para las métricas del dashboard.
      try {
        const venta = await createSale({ total, items: itemsVenta });
        ventaRemotaId = venta?.id || null;
      } catch (e) {
        problemas.push(`La venta no quedó registrada en la nube: ${e?.message || e}`);
      }
    }

    // Descontar el stock local de cada producto vendido.
    // decreaseLocalStock relee el estado actual y toca sólo estos productos,
    // así no pisa cambios hechos desde Inventario en otra pestaña.
    products = decreaseLocalStock(currentSale);

    const now = new Date();
    salesHistory.unshift({
      id: 'sale-' + Date.now(),
      remoteId: ventaRemotaId,
      timestamp: now.getTime(),
      fecha: now.toLocaleDateString('es-AR') + ' ' + now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
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
    saveLocalSales(salesHistory);

    confirmBtn.innerHTML = textoOriginal;
    currentSale = [];
    populateProducts(searchInput?.value || '');
    renderSaleItems();
    renderHistory();

    if (problemas.length === 0) {
      alert('¡Venta registrada con éxito! El stock ha sido actualizado.');
    } else {
      alert(
        '⚠️ La venta se guardó en este dispositivo, pero hubo problemas al sincronizar:\n\n• ' +
        problemas.join('\n• ') +
        '\n\nRevisá el stock en Inventario antes de seguir vendiendo.'
      );
    }
  });

  // Reactive Multi-tab Storage Listeners
  window.addEventListener('storage', () => {
    products = getLocalProducts();
    salesHistory = getLocalSales();
    populateProducts(searchInput?.value || '');
    renderSaleItems();
    renderHistory();
  });

  window.addEventListener('voko_products_updated', () => {
    products = getLocalProducts();
    populateProducts(searchInput?.value || '');
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
