import { formatPrice, SUPABASE_URL } from '/js/config.js';

let categories = [
  { id: 'cat-1', nombre: 'Bolsos', orden: 1, activa: true },
  { id: 'cat-2', nombre: 'Bandoleras', orden: 2, activa: true },
  { id: 'cat-3', nombre: 'Riñoneras', orden: 3, activa: true },
  { id: 'cat-4', nombre: 'Carteras', orden: 4, activa: true },
  { id: 'cat-5', nombre: 'Morrales', orden: 5, activa: true },
  { id: 'cat-6', nombre: 'Materos', orden: 6, activa: true },
  { id: 'cat-7', nombre: 'Sobres', orden: 7, activa: true },
  { id: 'cat-8', nombre: 'Cinturones', orden: 8, activa: true },
  { id: 'cat-9', nombre: 'Billeteras', orden: 9, activa: true },
];

let products = [
  { id: 'prod-1', nombre: 'Bolso Weekend', precio: 85000, stock: 5, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-2', nombre: 'Bandolera Suede', precio: 45000, stock: 8, badge: 'limitado', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop', categoria_id: 'cat-2', descripcion: '' },
  { id: 'prod-3', nombre: 'Riñonera Urban Brown', precio: 32000, stock: 12, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=400&h=400&fit=crop', categoria_id: 'cat-3', descripcion: '' },
  { id: 'prod-4', nombre: 'Bolso XL Canvas', precio: 75000, stock: 3, badge: 'nuevo', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop', categoria_id: 'cat-1', descripcion: '' },
  { id: 'prod-5', nombre: 'Morral Nomad', precio: 62000, stock: 6, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=400&h=400&fit=crop', categoria_id: 'cat-5', descripcion: '' },
  { id: 'prod-6', nombre: 'Matero Premium Cuero', precio: 58000, stock: 10, badge: 'best-seller', destacado: true, activo: true, imagen_url: 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=400&fit=crop', categoria_id: 'cat-6', descripcion: '' },
  { id: 'prod-7', nombre: 'Cartera Minimal', precio: 92000, stock: 2, badge: '', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', categoria_id: 'cat-4', descripcion: '' },
  { id: 'prod-8', nombre: 'Sobre de Gala', precio: 28000, stock: 15, badge: 'elegante', destacado: false, activo: true, imagen_url: 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=400&h=400&fit=crop', categoria_id: 'cat-7', descripcion: '' },
];

function saveData() {
  localStorage.setItem('voko_categories', JSON.stringify(categories));
  localStorage.setItem('voko_products', JSON.stringify(products));
}

function loadData() {
  const storedCats = localStorage.getItem('voko_categories');
  const storedProds = localStorage.getItem('voko_products');
  if (storedCats) categories = JSON.parse(storedCats);
  if (storedProds) products = JSON.parse(storedProds);
}

// Uses the imported SUPABASE_URL from config.js (which reads env vars correctly)
function isSupabaseReady() {
  return SUPABASE_URL && !SUPABASE_URL.includes('TU-PROYECTO') && SUPABASE_URL.startsWith('http');
}

function renderCategories() {
  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return;
  tbody.innerHTML = categories.map(cat => `
    <tr>
      <td><strong>${cat.nombre}</strong></td>
      <td>${cat.orden}</td>
      <td><span class="status-pill ${cat.activa ? 'status-pill--active' : 'status-pill--inactive'}">${cat.activa ? 'Activa' : 'Inactiva'}</span></td>
      <td class="admin-table__actions">
        <button class="admin-table__action-btn" onclick="editCategory('${cat.id}')" title="Editar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="admin-table__action-btn admin-table__action-btn--delete" onclick="deleteCategory('${cat.id}')" title="Eliminar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>
  `).join('');

  const select = document.getElementById('prod-category');
  if (select) {
    select.innerHTML = '<option value="">Elegir categoría...</option>' +
      categories.filter(c => c.activa).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
  }
}

function renderProducts(filter = '') {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const filtered = filter
    ? products.filter(p => p.nombre.toLowerCase().includes(filter.toLowerCase()))
    : products;

  tbody.innerHTML = filtered.map(p => {
    const cat = categories.find(c => c.id === p.categoria_id);
    const stockClass = p.stock <= 3 ? 'admin-table__stock-low' : '';
    const stockPill = p.stock <= 3 ? `<span class="status-pill status-pill--low-stock">Bajo</span>` : '';
    return `
    <tr>
      <td>
        <div class="admin-table__product-cell">
          <img class="admin-table__product-img" src="${p.imagen_url || ''}" alt="${p.nombre}" loading="lazy">
          <div>
            <strong>${p.nombre}</strong>
            ${p.destacado ? '<br><span style="font-size:11px;color:var(--color-tertiary);">⭐ Destacado</span>' : ''}
          </div>
        </div>
      </td>
      <td>${cat?.nombre || '—'}</td>
      <td>${formatPrice(p.precio)}</td>
      <td><span class="${stockClass}">${p.stock}</span> ${stockPill}</td>
      <td>${p.badge ? `<span class="product-card__badge product-card__badge--${p.badge}" style="position:static;">${p.badge}</span>` : '—'}</td>
      <td><span class="status-pill ${p.activo ? 'status-pill--active' : 'status-pill--inactive'}">${p.activo ? 'Activo' : 'Inactivo'}</span></td>
      <td class="admin-table__actions">
        <button class="admin-table__action-btn" onclick="editProduct('${p.id}')" title="Editar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="admin-table__action-btn admin-table__action-btn--delete" onclick="deleteProduct('${p.id}')" title="Eliminar"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </td>
    </tr>`;
  }).join('');
}

// Category Actions
window.editCategory = (id) => {
  const cat = categories.find(c => c.id === id);
  if (!cat) return;
  document.getElementById('cat-id').value = cat.id;
  document.getElementById('cat-name').value = cat.nombre;
  document.getElementById('cat-order').value = cat.orden;
  document.getElementById('category-modal-title').textContent = 'Editar Categoría';
  document.getElementById('category-modal')?.classList.add('open');
};

window.deleteCategory = async (id) => {
  if (!confirm('¿Eliminar esta categoría?')) return;

  if (isSupabaseReady()) {
    try {
      const { deleteCategory: delCat } = await import('/js/supabase.js');
      await delCat(id);
      // Reload from cloud after delete
      const { getAllCategories } = await import('/js/supabase.js');
      categories = await getAllCategories();
      saveData();
      renderCategories();
      renderProducts();
      return;
    } catch (e) {
      console.warn('Could not delete category in Supabase, falling back to local:', e);
    }
  }
  // Local-only fallback
  categories = categories.filter(c => c.id !== id);
  saveData();
  renderCategories();
  renderProducts();
};

window.editProduct = (id) => {
  const p = products.find(pr => pr.id === id);
  if (!p) return;
  document.getElementById('product-id').value = p.id;
  document.getElementById('prod-name').value = p.nombre;
  document.getElementById('prod-category').value = p.categoria_id;
  document.getElementById('prod-price').value = p.precio;
  document.getElementById('prod-stock').value = p.stock;
  document.getElementById('prod-badge').value = p.badge || '';
  resetImagePreview(p.imagen_url || '');
  document.getElementById('prod-description').value = p.descripcion || '';
  document.getElementById('prod-featured').checked = p.destacado;
  document.getElementById('prod-active').checked = p.activo;
  document.getElementById('form-title').textContent = 'Editar Producto';
  const formCard = document.getElementById('product-form-card');
  if (formCard) {
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth' });
  }
};

window.deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;

  if (isSupabaseReady()) {
    try {
      const { deleteProduct: delProd } = await import('/js/supabase.js');
      await delProd(id);
      // Reload from cloud after delete
      const { getAllProducts } = await import('/js/supabase.js');
      products = await getAllProducts();
      saveData();
      renderProducts();
      return;
    } catch (e) {
      console.warn('Could not delete product in Supabase, falling back to local:', e);
    }
  }
  // Local-only fallback
  products = products.filter(p => p.id !== id);
  saveData();
  renderProducts();
};

function resetImagePreview(url = '') {
  const imageHidden = document.getElementById('prod-image');
  const previewImg = document.getElementById('prod-image-preview');
  const previewContainer = document.getElementById('prod-image-preview-container');
  const imageText = document.getElementById('prod-image-text');
  const fileInput = document.getElementById('prod-image-file');

  if (!imageHidden || !previewImg || !previewContainer || !imageText) return;
  imageHidden.value = url;
  if (fileInput) fileInput.value = '';
  if (url) {
    previewImg.src = url;
    previewContainer.style.display = 'block';
    imageText.textContent = '📷 Cambiar foto';
  } else {
    previewImg.src = '';
    previewContainer.style.display = 'none';
    imageText.textContent = '📷 Toca aquí para elegir foto';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const categoryModal = document.getElementById('category-modal');
  const formCard = document.getElementById('product-form-card');
  const fileInput = document.getElementById('prod-image-file');

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        document.getElementById('prod-image-text').textContent = `📷 ${file.name}`;
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('prod-image').value = ev.target.result;
          document.getElementById('prod-image-preview').src = ev.target.result;
          document.getElementById('prod-image-preview-container').style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  document.getElementById('btn-new-category')?.addEventListener('click', () => {
    document.getElementById('category-form')?.reset();
    document.getElementById('cat-id').value = '';
    document.getElementById('category-modal-title').textContent = 'Nueva Categoría';
    categoryModal?.classList.add('open');
  });

  document.getElementById('btn-cancel-category')?.addEventListener('click', () => {
    categoryModal?.classList.remove('open');
  });

  // ── Category Form Submit ──
  document.getElementById('category-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('cat-id').value;
    const nombre = document.getElementById('cat-name').value;
    const orden = parseInt(document.getElementById('cat-order').value) || 0;

    let savedToCloud = false;

    if (isSupabaseReady()) {
      try {
        const { createCategory, updateCategory, getAllCategories } = await import('/js/supabase.js');
        if (id && !id.startsWith('cat-')) {
          // Existing Supabase UUID → update
          await updateCategory(id, { nombre, orden });
        } else {
          // New category → insert
          await createCategory({ nombre, orden, activa: true });
        }
        // Reload full list from Supabase so we have real UUIDs
        categories = await getAllCategories();
        savedToCloud = true;
      } catch (err) {
        console.warn('Fallback to local category save:', err);
      }
    }

    if (!savedToCloud) {
      // Local-only fallback
      if (id) {
        const cat = categories.find(c => c.id === id);
        if (cat) { cat.nombre = nombre; cat.orden = orden; }
      } else {
        categories.push({ id: 'cat-' + Date.now(), nombre, orden, activa: true });
      }
    }

    saveData();
    renderCategories();
    categoryModal?.classList.remove('open');
  });

  document.getElementById('btn-new-product')?.addEventListener('click', () => {
    document.getElementById('product-form')?.reset();
    document.getElementById('product-id').value = '';
    document.getElementById('prod-active').checked = true;
    resetImagePreview('');
    document.getElementById('form-title').textContent = 'Nuevo Producto';
    if (formCard) {
      formCard.style.display = 'block';
      formCard.scrollIntoView({ behavior: 'smooth' });
    }
  });

  document.getElementById('btn-cancel-form')?.addEventListener('click', () => {
    if (formCard) formCard.style.display = 'none';
  });

  // ── Product Form Submit ──
  document.getElementById('product-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-product');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Guardando...';
    }

    const id = document.getElementById('product-id').value;
    let imageUrl = document.getElementById('prod-image').value || '';
    const selectedFile = fileInput?.files[0];

    if (selectedFile && isSupabaseReady()) {
      try {
        const { uploadProductImage } = await import('/js/supabase.js');
        imageUrl = await uploadProductImage(selectedFile);
      } catch (err) {
        console.warn('Supabase storage upload fallback to Data URL:', err);
      }
    }

    const productData = {
      nombre: document.getElementById('prod-name').value,
      categoria_id: document.getElementById('prod-category').value,
      precio: parseFloat(document.getElementById('prod-price').value),
      stock: parseInt(document.getElementById('prod-stock').value),
      badge: document.getElementById('prod-badge').value || null,
      imagen_url: imageUrl,
      descripcion: document.getElementById('prod-description').value || '',
      destacado: document.getElementById('prod-featured').checked,
      activo: document.getElementById('prod-active').checked,
    };

    let savedToCloud = false;

    if (isSupabaseReady()) {
      try {
        const { createProduct, updateProduct, getAllProducts } = await import('/js/supabase.js');
        if (id && !id.startsWith('prod-')) {
          // Existing Supabase UUID → update
          await updateProduct(id, productData);
        } else {
          // New product → insert
          await createProduct(productData);
        }
        // Reload full list from Supabase so we have real UUIDs
        products = await getAllProducts();
        savedToCloud = true;
      } catch (err) {
        console.warn('Fallback to local product save:', err);
      }
    }

    if (!savedToCloud) {
      // Local-only fallback
      if (id) {
        const idx = products.findIndex(p => p.id === id);
        if (idx >= 0) products[idx] = { ...products[idx], ...productData };
      } else {
        products.push({ id: 'prod-' + Date.now(), ...productData });
      }
    }

    saveData();
    renderProducts();
    if (formCard) formCard.style.display = 'none';
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Producto';
    }
  });

  document.getElementById('inventory-search')?.addEventListener('input', (e) => {
    renderProducts(e.target.value);
  });

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

  // ── Init: Load data ──
  loadData();
  if (isSupabaseReady()) {
    try {
      const { getAllCategories, getAllProducts } = await import('/js/supabase.js');
      const cloudCats = await getAllCategories();
      const cloudProds = await getAllProducts();
      if (cloudCats?.length) categories = cloudCats;
      if (cloudProds?.length) products = cloudProds;
      saveData();
    } catch (e) {
      console.info('Supabase init fallback to local data:', e);
    }
  }
  renderCategories();
  renderProducts();
});
