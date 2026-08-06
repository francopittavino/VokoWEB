import { formatPrice, SUPABASE_URL } from '/js/config.js';

function isSupabaseReady() {
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

function calculate() {
  const materials = parseFloat(document.getElementById('calc-materials')?.value) || 0;
  const hours = parseFloat(document.getElementById('calc-hours')?.value) || 0;
  const rate = parseFloat(document.getElementById('calc-hourly-rate')?.value) || 0;
  const extras = parseFloat(document.getElementById('calc-extras')?.value) || 0;
  const marginPercent = parseFloat(document.getElementById('calc-margin')?.value) || 50;

  const laborCost = hours * rate;
  const baseCost = materials + laborCost + extras;
  const profit = baseCost * (marginPercent / 100);
  const finalPrice = Math.round(baseCost + profit);

  if (document.getElementById('res-mat')) document.getElementById('res-mat').textContent = formatPrice(materials);
  if (document.getElementById('res-labor')) document.getElementById('res-labor').textContent = formatPrice(laborCost);
  if (document.getElementById('res-base')) document.getElementById('res-base').textContent = formatPrice(baseCost);
  if (document.getElementById('res-profit')) document.getElementById('res-profit').textContent = formatPrice(profit);
  if (document.getElementById('res-price')) document.getElementById('res-price').textContent = formatPrice(finalPrice);

  return { finalPrice, baseCost, profit };
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#calc-form input, #calc-form select').forEach(el => {
    el.addEventListener('input', calculate);
  });

  document.getElementById('btn-save-to-inventory')?.addEventListener('click', async () => {
    const name = document.getElementById('calc-name')?.value;
    if (!name) {
      alert('Por favor, ingresá un nombre para el accesorio.');
      return;
    }

    const { finalPrice } = calculate();

    // Try Supabase first
    if (isSupabaseReady()) {
      try {
        const { createProduct } = await import('/js/supabase.js');
        await createProduct({
          nombre: name,
          precio: finalPrice,
          stock: 1,
          badge: 'nuevo',
          destacado: false,
          activo: true,
          imagen_url: ''
        });
        alert(`¡Producto "${name}" guardado con éxito en el inventario a ${formatPrice(finalPrice)}!`);
        location.href = '/admin/inventario.html';
        return;
      } catch (err) {
        console.warn('Calculator: Supabase save failed, saving locally:', err);
      }
    }

    // Local fallback
    let products = JSON.parse(localStorage.getItem('voko_products') || '[]');
    products.push({
      id: 'prod-' + Date.now(),
      nombre: name,
      precio: finalPrice,
      stock: 1,
      badge: 'nuevo',
      destacado: false,
      activo: true,
      categoria_id: 'cat-1',
      imagen_url: ''
    });
    localStorage.setItem('voko_products', JSON.stringify(products));
    alert(`¡Producto "${name}" guardado con éxito en el inventario a ${formatPrice(finalPrice)}!`);
    location.href = '/admin/inventario.html';
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

  calculate();
});
