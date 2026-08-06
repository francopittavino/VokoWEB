import { formatPrice, SUPABASE_URL } from '/js/config.js';

function isSupabaseReady() {
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

let products = JSON.parse(localStorage.getItem('voko_products') || '[]');
let currentSale = [];
let salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');

function populateProducts() {
  const select = document.getElementById('pos-product-select');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccionar producto...</option>' +
    products.filter(p => p.activo && p.stock > 0).map(p => `<option value="${p.id}">${p.nombre} (${formatPrice(p.precio)}) — Stock: ${p.stock}</option>`).join('');
}

function renderSaleItems() {
  const tbody = document.getElementById('pos-items-tbody');
  if (!tbody) return;

  if (currentSale.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--color-on-surface-variant);">No hay productos en la venta actual</td></tr>`;
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
    return `
      <tr>
        <td><strong>${item.nombre}</strong></td>
        <td>${item.cantidad}</td>
        <td>${formatPrice(item.precio)}</td>
        <td><strong>${formatPrice(sub)}</strong></td>
        <td><button class="admin-table__action-btn admin-table__action-btn--delete" onclick="removeItem(${idx})">✕</button></td>
      </tr>
    `;
  }).join('');

  document.getElementById('pos-subtotal').textContent = formatPrice(total);
  document.getElementById('pos-total').textContent = formatPrice(total);
  const confirmBtn = document.getElementById('pos-confirm-btn');
  if (confirmBtn) confirmBtn.disabled = false;
}

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

  document.getElementById('pos-add-btn')?.addEventListener('click', () => {
    const prodId = document.getElementById('pos-product-select').value;
    const qty = parseInt(document.getElementById('pos-qty').value) || 1;
    if (!prodId) return;

    const product = products.find(p => p.id === prodId);
    if (!product) return;

    if (qty > product.stock) {
      alert(`Stock insuficiente. Solo quedan ${product.stock} unidades de ${product.nombre}`);
      return;
    }

    const existing = currentSale.find(i => i.id === prodId);
    if (existing) {
      existing.cantidad += qty;
    } else {
      currentSale.push({ id: product.id, nombre: product.nombre, precio: product.precio, cantidad: qty });
    }

    renderSaleItems();
  });

  document.getElementById('pos-confirm-btn')?.addEventListener('click', async () => {
    if (currentSale.length === 0) return;

    let total = 0;
    currentSale.forEach(item => {
      total += item.precio * item.cantidad;
    });

    // Try to save to Supabase first
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
        // Reload products from Supabase (stock was updated server-side)
        const { getAllProducts } = await import('/js/supabase.js');
        products = await getAllProducts();
        localStorage.setItem('voko_products', JSON.stringify(products));
      } catch (e) {
        console.warn('POS: Supabase sale save failed, saving locally:', e);
        // Fallback: update stock locally
        currentSale.forEach(item => {
          const p = products.find(pr => pr.id === item.id);
          if (p) p.stock = Math.max(0, p.stock - item.cantidad);
        });
        localStorage.setItem('voko_products', JSON.stringify(products));
      }
    } else {
      // Local-only: update stock locally
      currentSale.forEach(item => {
        const p = products.find(pr => pr.id === item.id);
        if (p) p.stock = Math.max(0, p.stock - item.cantidad);
      });
      localStorage.setItem('voko_products', JSON.stringify(products));
    }

    salesHistory.unshift({
      id: 'sale-' + Date.now(),
      fecha: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
      total,
      itemsCount: currentSale.reduce((acc, i) => acc + i.cantidad, 0)
    });
    localStorage.setItem('voko_sales_history', JSON.stringify(salesHistory));

    alert('¡Venta registrada con éxito! El stock ha sido actualizado.');
    currentSale = [];
    populateProducts();
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
