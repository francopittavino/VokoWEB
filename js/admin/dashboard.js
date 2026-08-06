import { formatPrice, SUPABASE_URL } from '/js/config.js';

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

  // Show email
  const email = sessionStorage.getItem('voko_admin_email');
  if (email && document.getElementById('admin-email')) {
    document.getElementById('admin-email').textContent = email;
  }

  // Calculate & render stats
  async function initStats() {
    let totalProducts = 0;
    let salesToday = 0;
    let ordersCount = 0;
    let lowStockCount = 0;

    // Check local storage items first
    const products = JSON.parse(localStorage.getItem('voko_products') || '[]');
    const salesHistory = JSON.parse(localStorage.getItem('voko_sales_history') || '[]');
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
      console.info('📊 Dashboard en modo local/demo');
    }

    // Render Stats
    if (document.getElementById('stat-products')) document.getElementById('stat-products').textContent = totalProducts;
    if (document.getElementById('stat-sales-today')) document.getElementById('stat-sales-today').textContent = formatPrice(salesToday);
    if (document.getElementById('stat-orders')) document.getElementById('stat-orders').textContent = ordersCount;
    if (document.getElementById('stat-low-stock')) document.getElementById('stat-low-stock').textContent = lowStockCount;

    // Render Recent Sales Table
    const recentSalesContainer = document.getElementById('recent-sales');
    if (recentSalesContainer && salesHistory.length > 0) {
      recentSalesContainer.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID Venta</th>
              <th>Hora</th>
              <th>Items</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesHistory.slice(0, 5).map(s => `
              <tr>
                <td><strong>${s.id}</strong></td>
                <td>${s.fecha}</td>
                <td>${s.itemsCount} unidades</td>
                <td><strong>${formatPrice(s.total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  initStats();
});
