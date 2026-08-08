import { formatPrice, SUPABASE_URL, APP_CONFIG } from '/js/config.js';
import {
  getLocalProducts,
  saveLocalProducts,
  getLocalSales,
  saveLocalSales,
  getProductImg,
  getStock,
  isFromToday,
  increaseLocalStock,
  PLACEHOLDER_IMAGE,
} from './storage-helper.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Sidebar toggle
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const toggle = document.getElementById('sidebar-toggle');

  toggle?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('open');
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  // El botón de cerrar sesión lo cablea auth-guard.js para todas las páginas.

  // Show user status
  const email = localStorage.getItem('voko_admin_email');
  if (email && document.getElementById('admin-email')) {
    document.getElementById('admin-email').textContent = email;
  }

  let currentSaleToDelete = null;

  // Modal Elements
  const deleteModal = document.getElementById('delete-sale-modal');
  const modalSaleIdLabel = document.getElementById('modal-sale-id-label');
  const modalItemsPreview = document.getElementById('modal-sale-items-preview');
  const btnRestoreAndDelete = document.getElementById('btn-restore-and-delete');
  const btnOnlyDelete = document.getElementById('btn-only-delete');
  const btnCancelDelete = document.getElementById('btn-cancel-delete');

  function openDeleteModal(sale) {
    currentSaleToDelete = sale;
    if (modalSaleIdLabel) modalSaleIdLabel.textContent = `ID: ${sale.id} • ${sale.fecha}`;

    // Sólo se puede devolver al stock lo que la venta haya registrado item por item.
    // Las ventas viejas (anteriores al detalle por item) no se pueden reponer:
    // adivinar qué producto era llevaría a sumarle stock al equivocado.
    const items = Array.isArray(sale.items) ? sale.items : [];

    if (modalItemsPreview) {
      modalItemsPreview.innerHTML = items.length
        ? items.map(item => `
            <div style="padding: 2px 0;">• <strong>${item.cantidad}x ${item.nombre}</strong></div>
          `).join('')
        : `<em style="color: var(--color-on-surface-variant);">Esta venta no guardó el detalle de productos, así que no se puede devolver al stock automáticamente.</em>`;
    }

    if (btnRestoreAndDelete) {
      btnRestoreAndDelete.disabled = items.length === 0;
      btnRestoreAndDelete.textContent = items.length
        ? '↩️ Devolver al stock y eliminar'
        : '↩️ Sin detalle para devolver';
    }

    deleteModal?.classList.add('open');
  }

  function closeDeleteModal() {
    deleteModal?.classList.remove('open');
    currentSaleToDelete = null;
  }

  btnCancelDelete?.addEventListener('click', closeDeleteModal);
  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });

  // Action: Restore Stock + Delete Sale
  btnRestoreAndDelete?.addEventListener('click', () => {
    if (!currentSaleToDelete) return;

    const itemsToRestore = Array.isArray(currentSaleToDelete.items) ? currentSaleToDelete.items : [];
    if (itemsToRestore.length === 0) return;

    // Escritura quirúrgica: relee el estado actual y suma sólo estas unidades.
    const { restored, notFound } = increaseLocalStock(itemsToRestore);

    const salesHistory = getLocalSales().filter(s => s.id !== currentSaleToDelete.id);
    saveLocalSales(salesHistory);

    closeDeleteModal();
    initStats();

    let mensaje = `✅ Venta eliminada. Se devolvieron ${restored} unidad${restored === 1 ? '' : 'es'} al stock.`;
    if (notFound.length) {
      mensaje += `\n\n⚠️ No se pudo devolver (ya no están en el inventario):\n• ${notFound.join('\n• ')}`;
    }
    alert(mensaje);
  });

  // Action: Only Delete Sale (do not touch stock)
  btnOnlyDelete?.addEventListener('click', () => {
    if (!currentSaleToDelete) return;

    let salesHistory = getLocalSales();
    salesHistory = salesHistory.filter(s => s.id !== currentSaleToDelete.id);
    saveLocalSales(salesHistory);

    closeDeleteModal();
    initStats();
    alert('🗑️ Venta eliminada sin modificar el stock.');
  });

  // Calculate & render stats
  async function initStats() {
    // Check local storage items first
    const products = getLocalProducts();
    let salesHistory = getLocalSales();
    const orders = JSON.parse(localStorage.getItem('voko_orders') || '[]');

    let totalProducts = products.length;
    // "Visibles" = lo que realmente se ve en la tienda: todo lo que tiene stock.
    let visibleCount = products.filter((p) => getStock(p) > 0).length;
    let lowStockCount = products.filter(
      (p) => getStock(p) <= APP_CONFIG.lowStockThreshold
    ).length;

    // "Hoy" es hoy: filtramos por fecha en lugar de sumar todo el historial.
    let salesToday = salesHistory
      .filter(isFromToday)
      .reduce((acc, s) => acc + (Number(s.total) || 0), 0);
    let ordersToday = orders.filter(isFromToday).length;

    // Try Supabase if configured
    try {
      if (SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http')) {
        const { getDashboardStats } = await import('/js/supabase.js');
        const stats = await getDashboardStats();
        if (stats) {
          totalProducts = stats.totalProducts || totalProducts;
          salesToday = stats.salesToday || salesToday;
          lowStockCount = stats.lowStockCount ?? lowStockCount;
        }
      }
    } catch {
      console.info('📊 Dashboard en modo local');
    }

    // Render Stats
    const elProducts = document.getElementById('stat-products');
    const elSales = document.getElementById('stat-sales-today');
    const elOrders = document.getElementById('stat-orders');
    const elVisible = document.getElementById('stat-visible');
    const elLowStock = document.getElementById('stat-low-stock');

    if (elProducts) elProducts.textContent = totalProducts;
    if (elSales) elSales.textContent = formatPrice(salesToday);
    if (elOrders) elOrders.textContent = ordersToday;
    if (elVisible) elVisible.textContent = visibleCount;
    if (elLowStock) elLowStock.textContent = lowStockCount;

    // Render Recent Sales Table with Accordion Dropdowns & Delete Action
    const recentSalesContainer = document.getElementById('recent-sales');
    if (!recentSalesContainer) return;

    if (salesHistory.length === 0) {
      recentSalesContainer.innerHTML = `
        <div class="admin-empty-state" style="padding: var(--space-10);">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <h3 class="admin-empty-state__title">Sin ventas registradas</h3>
          <p class="admin-empty-state__text">Las ventas que registres en el Punto de Venta aparecerán acá.</p>
        </div>
      `;
      return;
    }

    recentSalesContainer.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th>ID Venta</th>
            <th>Fecha y Hora</th>
            <th>Items</th>
            <th>Total</th>
            <th style="text-align: right;">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${salesHistory.slice(0, 10).map((s, index) => {
            const safeId = (s.id || 'sale-' + index).replace(/[^a-zA-Z0-9_-]/g, '_');
            
            // Igual que en el modal: no inventamos un producto cuando la venta
            // no guardó su detalle, porque mostraría datos falsos.
            const itemsList = Array.isArray(s.items) ? s.items : [];

            const itemsHtml = itemsList.map(item => {
              const imgUrl = getProductImg(item);
              return `
                <div class="sale-item-card">
                  <div class="sale-item-card__info">
                    <img src="${imgUrl}" alt="${item.nombre}" class="sale-item-card__img" onerror="this.src='${PLACEHOLDER_IMAGE}'">
                    <div>
                      <div class="sale-item-card__name">${item.nombre}</div>
                      <div class="sale-item-card__qty">Cantidad: ${item.cantidad} un. × ${formatPrice(item.precio)}</div>
                    </div>
                  </div>
                  <div class="sale-item-card__price">${formatPrice(item.precio * item.cantidad)}</div>
                </div>
              `;
            }).join('');

            return `
              <tr class="sale-row" data-target="details-${safeId}">
                <td><strong>${s.id}</strong></td>
                <td>${s.fecha}</td>
                <td><span class="status-pill status-pill--active">${s.itemsCount || 1} un.</span></td>
                <td><strong>${formatPrice(s.total)}</strong></td>
                <td style="text-align: right;" onclick="event.stopPropagation()">
                  <div style="display: inline-flex; align-items: center; gap: var(--space-2);">
                    <button class="sale-toggle-btn" data-target="details-${safeId}">
                      <span>Ver Productos</span>
                      <span class="sale-toggle-icon">▼</span>
                    </button>
                    <button class="admin-table__action-btn admin-table__action-btn--delete delete-sale-btn" data-sale-index="${index}" title="Eliminar Venta">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr class="sale-details-row" id="details-${safeId}">
                <td colspan="5" style="padding: 0;">
                  <div class="sale-details-container">
                    <div class="sale-details-title">📦 Desglose de Productos Vendidos</div>
                    ${itemsHtml || '<p style="font-size:13px; color:var(--color-on-surface-variant);">Detalle no disponible</p>'}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    // Attach accordion toggle listeners
    recentSalesContainer.querySelectorAll('.sale-toggle-btn, td:not(:last-child)').forEach(el => {
      el.addEventListener('click', (e) => {
        const row = el.closest('.sale-row');
        if (!row) return;
        const targetId = row.getAttribute('data-target');
        const detailsRow = document.getElementById(targetId);
        if (detailsRow) {
          row.classList.toggle('open');
          detailsRow.classList.toggle('open');
        }
      });
    });

    // Attach delete sale button listeners
    recentSalesContainer.querySelectorAll('.delete-sale-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.getAttribute('data-sale-index'));
        const sale = salesHistory[index];
        if (sale) {
          openDeleteModal(sale);
        }
      });
    });
  }

  initStats();

  // Multi-tab Reactive Sync
  window.addEventListener('storage', () => {
    initStats();
  });

  window.addEventListener('voko_products_updated', () => {
    initStats();
  });

  window.addEventListener('voko_sales_updated', () => {
    initStats();
  });
});
