import { formatPrice, SUPABASE_URL } from '/js/config.js';

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

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('voko_admin');
    window.location.href = '/admin/';
  });

  // Show user status
  const email = sessionStorage.getItem('voko_admin_email');
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

    // Generate items preview list
    const products = JSON.parse(localStorage.getItem('voko_products') || '[]');
    const items = (sale.items && sale.items.length > 0) ? sale.items : (products.length > 0 ? [{
      nombre: products[0].nombre,
      cantidad: sale.itemsCount || 1,
      id: products[0].id
    }] : []);

    if (modalItemsPreview) {
      modalItemsPreview.innerHTML = items.map(item => `
        <div style="padding: 2px 0;">• <strong>${item.cantidad}x ${item.nombre}</strong></div>
      `).join('');
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

    let products = JSON.parse(localStorage.getItem('voko_products') || '[]');
    let salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');

    const itemsToRestore = (currentSaleToDelete.items && currentSaleToDelete.items.length > 0) 
      ? currentSaleToDelete.items 
      : (products.length > 0 ? [{ id: products[0].id, cantidad: currentSaleToDelete.itemsCount || 1 }] : []);

    itemsToRestore.forEach(item => {
      const itemId = item.id || item.producto_id;
      const itemName = (item.nombre || item.name || '').toLowerCase().trim();
      const p = products.find(prod => 
        (itemId && prod.id === itemId) || 
        (itemName && prod.nombre.toLowerCase().trim() === itemName)
      );
      if (p) {
        const qty = parseInt(item.cantidad) || 1;
        p.stock = (p.stock || 0) + qty;
      }
    });

    // Save updated stock
    localStorage.setItem('voko_products', JSON.stringify(products));

    // Remove sale from sales history
    salesHistory = salesHistory.filter(s => s.id !== currentSaleToDelete.id);
    localStorage.setItem('voko_sales_history', JSON.stringify(salesHistory));

    closeDeleteModal();
    initStats();
    alert('✅ Venta eliminada y stock de productos restaurado con éxito.');
  });

  // Action: Only Delete Sale (do not touch stock)
  btnOnlyDelete?.addEventListener('click', () => {
    if (!currentSaleToDelete) return;

    let salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');
    salesHistory = salesHistory.filter(s => s.id !== currentSaleToDelete.id);
    localStorage.setItem('voko_sales_history', JSON.stringify(salesHistory));

    closeDeleteModal();
    initStats();
    alert('🗑️ Venta eliminada sin modificar el stock.');
  });

  // Calculate & render stats
  async function initStats() {
    let totalProducts = 0;
    let salesToday = 0;
    let ordersCount = 0;
    let lowStockCount = 0;

    // Check local storage items first
    const products = JSON.parse(localStorage.getItem('voko_products') || '[]');
    let salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');
    const orders = JSON.parse(localStorage.getItem('voko_orders') || '[]');

    if (products.length > 0) {
      totalProducts = products.length;
      lowStockCount = products.filter(p => p.stock <= 3).length;
    }

    if (salesHistory.length > 0) {
      salesToday = salesHistory.reduce((acc, s) => acc + (s.total || 0), 0);
    }

    if (orders.length > 0) {
      ordersCount = orders.length;
    }

    // Try Supabase if configured
    try {
      if (SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http')) {
        const { getDashboardStats } = await import('/js/supabase.js');
        const stats = await getDashboardStats();
        if (stats) {
          totalProducts = stats.totalProducts || totalProducts;
          salesToday = stats.salesToday || salesToday;
          ordersCount = stats.salesCount || ordersCount;
          lowStockCount = stats.lowStockCount || lowStockCount;
        }
      }
    } catch {
      console.info('📊 Dashboard en modo local');
    }

    // Render Stats
    if (document.getElementById('stat-products')) document.getElementById('stat-products').textContent = totalProducts;
    if (document.getElementById('stat-sales-today')) document.getElementById('stat-sales-today').textContent = formatPrice(salesToday);
    if (document.getElementById('stat-orders')) document.getElementById('stat-orders').textContent = ordersCount;
    if (document.getElementById('stat-low-stock')) document.getElementById('stat-low-stock').textContent = lowStockCount;

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
            
            const itemsList = (s.items && s.items.length > 0) ? s.items : (products.length > 0 ? [
              {
                id: products[0].id,
                nombre: products[0].nombre,
                precio: s.total || products[0].precio,
                imagen: getProductImg(products[0]),
                cantidad: s.itemsCount || 1
              }
            ] : []);

            const itemsHtml = itemsList.map(item => {
              const imgUrl = getProductImg(item);
              return `
                <div class="sale-item-card">
                  <div class="sale-item-card__info">
                    <img src="${imgUrl}" alt="${item.nombre}" class="sale-item-card__img" onerror="this.src='https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop'">
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
});
