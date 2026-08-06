let demoOrders = [
  {
    id: 'order-demo-1',
    cliente: 'María González',
    tipo: 'Encargo a Medida',
    detalle: 'Bolso de cuero color suela con grabado de iniciales M.G. y herrajes bronce.',
    hasImage: true,
    estado: 'En Proceso',
    fecha: 'Hoy 10:30 hs'
  },
  {
    id: 'order-demo-2',
    cliente: 'Lucas PERALTA (lucas@example.com)',
    tipo: 'Consulta Web',
    detalle: 'Consulta por disponibilidad de Matero Premium Cuero en tono marrón oscuro.',
    hasImage: false,
    estado: 'Completado',
    fecha: 'Ayer 16:45 hs'
  }
];

let orders = [];

function loadOrders() {
  const stored = localStorage.getItem('voko_orders');
  if (stored) {
    orders = JSON.parse(stored);
  } else {
    orders = [...demoOrders];
    localStorage.setItem('voko_orders', JSON.stringify(orders));
  }
}

function saveOrders() {
  localStorage.setItem('voko_orders', JSON.stringify(orders));
}

function getStatusBadge(estado) {
  switch (estado) {
    case 'Pendiente':
      return `<span class="status-pill status-pill--low-stock">⏳ Pendiente</span>`;
    case 'En Proceso':
      return `<span class="status-pill status-pill--active">⚙️ En Proceso</span>`;
    case 'Completado':
      return `<span class="status-pill status-pill--active" style="background-color: var(--color-success); color: white;">✓ Completado</span>`;
    case 'Cancelado':
      return `<span class="status-pill status-pill--inactive">✕ Cancelado</span>`;
    default:
      return `<span class="status-pill">${estado}</span>`;
  }
}

function renderOrders(filterText = '') {
  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;

  let filtered = orders;
  if (filterText) {
    const term = filterText.toLowerCase();
    filtered = orders.filter(o =>
      o.cliente.toLowerCase().includes(term) ||
      o.tipo.toLowerCase().includes(term) ||
      o.detalle.toLowerCase().includes(term) ||
      o.estado.toLowerCase().includes(term)
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--color-on-surface-variant); padding: var(--space-8) 0;">
          No se encontraron pedidos.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map((o) => {
    const cleanPhone = o.telefono ? o.telefono.replace(/[^0-9]/g, '') : '';
    const waPhone = cleanPhone.length >= 8 ? (cleanPhone.startsWith('54') ? cleanPhone : '549' + cleanPhone) : '';

    return `
    <tr>
      <td>
        <strong>${o.cliente}</strong>
        ${o.telefono ? `<br><a href="${waPhone ? 'https://wa.me/' + waPhone : '#'}" target="_blank" style="font-size:12px; color:var(--color-success); font-weight:600; text-decoration:none;">📞 ${o.telefono}</a>` : ''}
        ${o.fechaLimite ? `<br><span style="font-size:11px; background:var(--color-surface-container-high); color:var(--color-tertiary); padding:2px 6px; border-radius:4px; font-weight:bold; display:inline-block; margin-top:3px;">📅 Límite: ${o.fechaLimite}</span>` : ''}
      </td>
      <td>
        <span style="font-size:12px; font-weight:600; padding:2px 8px; border-radius:12px; background:var(--color-surface-container-high); color:var(--color-primary);">
          ${o.tipo}
        </span>
      </td>
      <td style="max-width: 320px; white-space: normal; line-height: 1.4;">
        ${o.detalle}
        ${o.hasImage ? '<br><span style="font-size:11px; color:var(--color-tertiary);">📸 Incluye imagen de referencia</span>' : ''}
      </td>
      <td>${getStatusBadge(o.estado)}</td>
      <td style="font-size: 13px; color: var(--color-on-surface-variant);">${o.fecha}</td>
      <td class="admin-table__actions">
        <select class="input-field" style="padding: 4px 8px; font-size: 12px; width: auto;" onchange="updateOrderStatus('${o.id}', this.value)">
          <option value="Pendiente" ${o.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
          <option value="En Proceso" ${o.estado === 'En Proceso' ? 'selected' : ''}>En Proceso</option>
          <option value="Completado" ${o.estado === 'Completado' ? 'selected' : ''}>Completado</option>
          <option value="Cancelado" ${o.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
        <button class="admin-table__action-btn admin-table__action-btn--delete" onclick="deleteOrder('${o.id}')" title="Eliminar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>
  `;
  }).join('');
}

window.updateOrderStatus = (id, newStatus) => {
  const order = orders.find(o => o.id === id);
  if (order) {
    order.estado = newStatus;
    saveOrders();
    renderOrders(document.getElementById('orders-search')?.value || '');
  }
};

window.deleteOrder = (id) => {
  if (!confirm('¿Seguro que deseás borrar este registro de pedido?')) return;
  orders = orders.filter(o => o.id !== id);
  saveOrders();
  renderOrders(document.getElementById('orders-search')?.value || '');
};

document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  renderOrders();

  document.getElementById('orders-search')?.addEventListener('input', (e) => {
    renderOrders(e.target.value);
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
});
