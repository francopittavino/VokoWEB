/* ============================================
   VOKO ACCESORIOS — Gestor de Costos de Fabricación
   Private per-product material & margin sheets
   ============================================ */

import { formatPrice } from '/js/config.js';

const DEFAULT_COST_SHEETS = [
  {
    id: 'cost-1',
    nombre: 'Bolso Weekend',
    margen: 60,
    insumos: [
      { nombre: 'Cuerina Premium', cantidad: 1.5, costoUnitario: 12000, costo: 18000 },
      { nombre: 'Forro interno impermeable', cantidad: 1.5, costoUnitario: 3000, costo: 4500 },
      { nombre: 'Cierre YKK reforzado (40cm)', cantidad: 2, costoUnitario: 1600, costo: 3200 },
      { nombre: 'Hebillas y herrajes de bronce', cantidad: 4, costoUnitario: 1625, costo: 6500 },
      { nombre: 'Mano de Obra Artesanal', cantidad: 1, costoUnitario: 12000, costo: 12000 },
    ]
  },
  {
    id: 'cost-2',
    nombre: 'Bandolera Suede',
    margen: 55,
    insumos: [
      { nombre: 'Cuerina Gamuzada Suede', cantidad: 1, costoUnitario: 9500, costo: 9500 },
      { nombre: 'Correa regulable', cantidad: 1, costoUnitario: 3800, costo: 3800 },
      { nombre: 'Mosquetones de metal', cantidad: 2, costoUnitario: 1350, costo: 2700 },
      { nombre: 'Mano de Obra Artesanal', cantidad: 1, costoUnitario: 7000, costo: 7000 },
    ]
  },
  {
    id: 'cost-3',
    nombre: 'Riñonera Urban Brown',
    margen: 50,
    insumos: [
      { nombre: 'Cuerina Marrón Oscuro', cantidad: 0.8, costoUnitario: 8125, costo: 6500 },
      { nombre: 'Cierre diente de perro', cantidad: 1, costoUnitario: 2100, costo: 2100 },
      { nombre: 'Cinta mochilera y broche plástico', cantidad: 1, costoUnitario: 2400, costo: 2400 },
      { nombre: 'Mano de Obra', cantidad: 1, costoUnitario: 5000, costo: 5000 },
    ]
  }
];

function getCostSheets() {
  const stored = localStorage.getItem('voko_product_costs');
  if (stored !== null) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  localStorage.setItem('voko_product_costs', JSON.stringify(DEFAULT_COST_SHEETS));
  return [...DEFAULT_COST_SHEETS];
}

function saveCostSheets(sheets) {
  localStorage.setItem('voko_product_costs', JSON.stringify(sheets));
  window.dispatchEvent(new CustomEvent('voko_costs_updated', { detail: sheets }));
}

let costSheets = getCostSheets();
let activeEditingId = null;

// Helpers to compute totals for a sheet
function computeSheetTotals(sheet) {
  const baseCost = (sheet.insumos || []).reduce((acc, item) => {
    const qty = parseFloat(item.cantidad) || 1;
    const unitCost = parseFloat(item.costoUnitario) || parseFloat(item.costo) || 0;
    return acc + (qty * unitCost);
  }, 0);

  const margin = parseFloat(sheet.margen) || 0;
  const profit = Math.round(baseCost * (margin / 100));
  const suggestedPrice = Math.round(baseCost + profit);
  return { baseCost, margin, profit, suggestedPrice };
}

// Render Stats Cards
function renderStats() {
  const totalSheetsEl = document.getElementById('stat-total-sheets');
  const avgCostEl = document.getElementById('stat-avg-cost');
  const avgMarginEl = document.getElementById('stat-avg-margin');

  if (!totalSheetsEl || !avgCostEl || !avgMarginEl) return;

  totalSheetsEl.textContent = costSheets.length;

  if (costSheets.length === 0) {
    avgCostEl.textContent = '$0';
    avgMarginEl.textContent = '0%';
    return;
  }

  let totalCostSum = 0;
  let totalMarginSum = 0;

  costSheets.forEach(s => {
    const totals = computeSheetTotals(s);
    totalCostSum += totals.baseCost;
    totalMarginSum += totals.margin;
  });

  const avgCost = Math.round(totalCostSum / costSheets.length);
  const avgMargin = Math.round(totalMarginSum / costSheets.length);

  avgCostEl.textContent = formatPrice(avgCost);
  avgMarginEl.textContent = `${avgMargin}%`;
}

// Render Cost Sheets Table
function renderTable(filterText = '') {
  const tbody = document.getElementById('cost-sheets-tbody');
  if (!tbody) return;

  const filtered = costSheets.filter(s => {
    const q = filterText.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = s.nombre.toLowerCase().includes(q);
    const itemMatch = (s.insumos || []).some(i => i.nombre.toLowerCase().includes(q));
    return nameMatch || itemMatch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--color-on-surface-variant); padding: var(--space-8);">
      No se encontraron fichas de costos ${filterText ? 'para "' + filterText + '"' : ''}. Presioná <strong>"+ Nueva Ficha de Costos"</strong> para crear una.
    </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(s => {
    const totals = computeSheetTotals(s);
    const insumosSummary = (s.insumos || []).map(i => {
      const q = i.cantidad || 1;
      const sub = q * (i.costoUnitario || i.costo || 0);
      return `${q}x ${i.nombre} (${formatPrice(sub)})`;
    }).join(', ');

    return `
      <tr>
        <td><strong>${s.nombre}</strong></td>
        <td>
          <div style="max-width: 240px; font-size: 12px; color: var(--color-on-surface-variant); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${insumosSummary}">
            ${insumosSummary || 'Sin insumos'}
          </div>
        </td>
        <td><strong>${formatPrice(totals.baseCost)}</strong></td>
        <td><span class="status-pill status-pill--active">${totals.margin}%</span></td>
        <td style="color: var(--color-success); font-weight: bold;">+${formatPrice(totals.profit)}</td>
        <td><strong style="color: var(--color-tertiary); font-size: 15px;">${formatPrice(totals.suggestedPrice)}</strong></td>
        <td class="admin-table__actions">
          <button class="admin-table__action-btn" onclick="editCostSheet('${s.id}')" title="Editar Ficha"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
          <button class="admin-table__action-btn admin-table__action-btn--delete" onclick="deleteCostSheet('${s.id}')" title="Eliminar Ficha"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </td>
      </tr>
    `;
  }).join('');
}

// Dynamic Row Rendering inside Modal Form
function addItemRow(nombre = '', cantidad = 1, costoUnitario = '') {
  const tbody = document.getElementById('items-rows-tbody');
  if (!tbody) return;

  const tr = document.createElement('tr');
  tr.className = 'cost-item-row';
  tr.innerHTML = `
    <td style="padding: 4px;">
      <input type="text" class="input-field item-name-input" placeholder="Ej: Cuerina / Cierre / Herrajes" value="${nombre}" style="width: 100%;" required>
    </td>
    <td style="padding: 4px;">
      <input type="number" class="input-field item-qty-input" placeholder="1" min="0.01" step="0.1" value="${cantidad}" style="width: 100%; text-align: center;" required>
    </td>
    <td style="padding: 4px;">
      <input type="number" class="input-field item-unitcost-input" placeholder="0" min="0" value="${costoUnitario}" style="width: 100%; font-weight: bold;" required>
    </td>
    <td style="padding: 4px; font-weight: bold; color: var(--color-primary); font-size: 13px;">
      <span class="item-subtotal-span">$0</span>
    </td>
    <td style="padding: 4px; text-align: center;">
      <button type="button" class="btn-remove-row" style="background: none; border: none; color: var(--color-error); font-size: 16px; cursor: pointer; padding: 4px;">✕</button>
    </td>
  `;

  tr.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', updateModalCalculations);
  });

  tr.querySelector('.btn-remove-row')?.addEventListener('click', () => {
    tr.remove();
    updateModalCalculations();
  });

  tbody.appendChild(tr);
  updateModalCalculations();
}

function updateModalCalculations() {
  const rows = document.querySelectorAll('.cost-item-row');
  let baseCost = 0;

  rows.forEach(r => {
    const qtyInp = r.querySelector('.item-qty-input');
    const unitInp = r.querySelector('.item-unitcost-input');
    const subSpan = r.querySelector('.item-subtotal-span');

    const qty = parseFloat(qtyInp?.value) || 0;
    const unit = parseFloat(unitInp?.value) || 0;
    const subtotal = qty * unit;

    if (subSpan) subSpan.textContent = formatPrice(subtotal);
    baseCost += subtotal;
  });

  const marginInp = document.getElementById('sheet-margin');
  const margin = parseFloat(marginInp?.value) || 0;

  const profit = Math.round(baseCost * (margin / 100));
  const suggestedPrice = Math.round(baseCost + profit);

  document.getElementById('calc-total-cost').textContent = formatPrice(baseCost);
  document.getElementById('calc-total-profit').textContent = formatPrice(profit);
  document.getElementById('calc-suggested-price').textContent = formatPrice(suggestedPrice);
}

// Modal Actions
function openModal(sheet = null) {
  const modal = document.getElementById('cost-sheet-modal');
  const title = document.getElementById('modal-cost-title');
  const tbody = document.getElementById('items-rows-tbody');
  if (!modal || !tbody) return;

  tbody.innerHTML = '';

  if (sheet) {
    activeEditingId = sheet.id;
    if (title) title.textContent = `Editar Ficha: ${sheet.nombre}`;
    document.getElementById('sheet-id').value = sheet.id;
    document.getElementById('sheet-product-name').value = sheet.nombre;
    document.getElementById('sheet-margin').value = sheet.margen || 60;

    if (sheet.insumos && sheet.insumos.length > 0) {
      sheet.insumos.forEach(i => addItemRow(i.nombre, i.cantidad || 1, i.costoUnitario || i.costo || ''));
    } else {
      addItemRow();
    }
  } else {
    activeEditingId = null;
    if (title) title.textContent = 'Nueva Ficha de Costos';
    document.getElementById('sheet-id').value = '';
    document.getElementById('sheet-product-name').value = '';
    document.getElementById('sheet-margin').value = 60;
    addItemRow('Cuerina / Material Principal', 1.5, 12000);
    addItemRow('Hebillas / Herrajes de metal', 4, 1500);
    addItemRow('Mano de Obra Artesanal', 1, 10000);
  }

  updateModalCalculations();
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('cost-sheet-modal');
  modal?.classList.remove('open');
  activeEditingId = null;
}

// Global actions attached to window
window.editCostSheet = (id) => {
  const s = costSheets.find(item => item.id === id);
  if (s) openModal(s);
};

window.deleteCostSheet = (id) => {
  if (!confirm('¿Eliminar esta ficha de costos?')) return;
  costSheets = costSheets.filter(s => s.id !== id);
  saveCostSheets(costSheets);
  renderStats();
  renderTable(document.getElementById('cost-search')?.value || '');
};

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar Toggle
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

  // Search filter
  const searchInp = document.getElementById('cost-search');
  searchInp?.addEventListener('input', (e) => {
    renderTable(e.target.value);
  });

  // Modal open/close listeners
  document.getElementById('btn-new-cost-sheet')?.addEventListener('click', () => openModal());
  document.getElementById('btn-close-cost-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-cancel-cost-modal')?.addEventListener('click', closeModal);
  document.getElementById('btn-add-item-row')?.addEventListener('click', () => addItemRow());

  document.getElementById('sheet-margin')?.addEventListener('input', updateModalCalculations);

  // Form Submit
  document.getElementById('cost-sheet-form')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('sheet-product-name')?.value.trim();
    const margin = parseFloat(document.getElementById('sheet-margin')?.value) || 0;

    const rows = document.querySelectorAll('.cost-item-row');
    const insumos = [];

    rows.forEach(r => {
      const nameVal = r.querySelector('.item-name-input')?.value.trim();
      const qtyVal = parseFloat(r.querySelector('.item-qty-input')?.value) || 1;
      const unitVal = parseFloat(r.querySelector('.item-unitcost-input')?.value) || 0;
      if (nameVal) {
        insumos.push({
          nombre: nameVal,
          cantidad: qtyVal,
          costoUnitario: unitVal,
          costo: qtyVal * unitVal
        });
      }
    });

    if (!name) {
      alert('Por favor, ingresá un nombre para el producto.');
      return;
    }

    if (activeEditingId) {
      const index = costSheets.findIndex(s => s.id === activeEditingId);
      if (index !== -1) {
        costSheets[index] = {
          ...costSheets[index],
          nombre: name,
          margen: margin,
          insumos: insumos
        };
      }
    } else {
      costSheets.push({
        id: 'cost-' + Date.now(),
        nombre: name,
        margen: margin,
        insumos: insumos
      });
    }

    saveCostSheets(costSheets);
    closeModal();
    renderStats();
    renderTable(searchInp?.value || '');
  });

  // Multi-tab storage sync
  window.addEventListener('storage', (e) => {
    if (e.key === 'voko_product_costs') {
      costSheets = getCostSheets();
      renderStats();
      renderTable(searchInp?.value || '');
    }
  });

  window.addEventListener('voko_costs_updated', () => {
    costSheets = getCostSheets();
    renderStats();
    renderTable(searchInp?.value || '');
  });

  renderStats();
  renderTable();
});
