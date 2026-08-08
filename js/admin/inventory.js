import { formatPrice, SUPABASE_URL, APP_CONFIG } from '/js/config.js';
import {
  getLocalProducts,
  saveLocalProducts,
  saveLocalProductsAsync,
  getLocalProductsWithImages,
  deleteImageFromIDB,
  getProductImg,
  getStock,
  INITIAL_DEMO_CATEGORIES,
} from './storage-helper.js';

let categories = INITIAL_DEMO_CATEGORIES.map((cat) => ({ ...cat }));

let products = getLocalProducts();

function loadData() {
  const storedCats = localStorage.getItem('voko_categories');
  if (storedCats) {
    try { categories = JSON.parse(storedCats); } catch {}
  }
  products = getLocalProducts();
}

function saveData() {
  localStorage.setItem('voko_categories', JSON.stringify(categories));
  saveLocalProducts(products);
}

async function saveDataAsync() {
  localStorage.setItem('voko_categories', JSON.stringify(categories));
  await saveLocalProductsAsync(products);
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
  const massSelect = document.getElementById('mass-category');
  const catOptions = '<option value="">Elegir categoría...</option>' +
    categories.filter(c => c.activa).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

  if (select) select.innerHTML = catOptions;
  if (massSelect) massSelect.innerHTML = catOptions;
}

window.toggleProductActive = async (id, isActive) => {
  const p = products.find(pr => String(pr.id) === String(id));
  if (!p) return;

  p.activo = isActive;

  if (isSupabaseReady()) {
    try {
      const { updateProduct } = await import('/js/supabase.js');
      if (!id.startsWith('prod-')) {
        await updateProduct(id, { activo: isActive });
      }
    } catch (e) {
      console.warn('Could not update active status in Supabase:', e);
    }
  }

  saveData();
  renderProducts(document.getElementById('inventory-search')?.value || '');
};

function renderProducts(filter = '') {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const filtered = filter
    ? products.filter(p => p.nombre.toLowerCase().includes(filter.toLowerCase()))
    : products;

  tbody.innerHTML = filtered.map(p => {
    const cat = categories.find(c => c.id === p.categoria_id);
    const isActive = p.activo !== false;
    const stock = getStock(p);
    const stockColor = stock === 0
      ? 'var(--color-error)'
      : stock <= APP_CONFIG.lowStockThreshold
        ? 'var(--color-warning)'
        : 'var(--color-success)';

    return `
    <tr>
      <td>
        <div class="admin-table__product-cell">
          <img class="admin-table__product-img" src="${getProductImg(p)}" alt="${p.nombre}" loading="lazy">
          <div>
            <strong>${p.nombre}</strong>
            ${p.destacado ? '<br><span style="font-size:11px;color:var(--color-tertiary);">⭐ Destacado</span>' : ''}
          </div>
        </div>
      </td>
      <td>${cat?.nombre || '—'}</td>
      <td>${formatPrice(p.precio)}</td>
      <td>
        <strong style="color: ${stockColor};">${stock}</strong>
        ${stock === 0 ? '<br><span style="font-size:11px;color:var(--color-error);">Sin stock</span>' : ''}
      </td>
      <td>${p.badge ? `<span class="product-card__badge product-card__badge--${p.badge}" style="position:static;">${p.badge}</span>` : '—'}</td>
      <td>
        <div style="display: inline-flex; align-items: center; gap: 8px;">
          <label class="toggle" style="margin: 0; cursor: pointer;">
            <input type="checkbox" ${isActive ? 'checked' : ''} onchange="toggleProductActive('${p.id}', this.checked)">
            <span class="toggle__track"></span>
          </label>
          <span class="status-pill ${isActive && stock > 0 ? 'status-pill--active' : 'status-pill--inactive'}">
            ${!isActive ? '⚪ Oculto' : stock > 0 ? '🟢 Visible' : '🔴 Oculto: sin stock'}
          </span>
        </div>
      </td>
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
  document.getElementById('prod-stock').value = getStock(p);
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

  // Always delete from in-memory array first
  products = products.filter(p => String(p.id) !== String(id));

  // Remove image from IndexedDB
  deleteImageFromIDB(id);

  // Try Supabase if configured
  if (isSupabaseReady() && !String(id).startsWith('prod-')) {
    try {
      const { deleteProduct: delProd } = await import('/js/supabase.js');
      await delProd(id);
    } catch (e) {
      console.warn('Could not delete product in Supabase:', e);
    }
  }

  // Save updated list
  await saveDataAsync();
  renderProducts(document.getElementById('inventory-search')?.value || '');
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

function compressImage(dataUrl, maxDimension = 450, quality = 0.7) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
        reader.onload = async (ev) => {
          const compressed = await compressImage(ev.target.result, 450, 0.7);
          document.getElementById('prod-image').value = compressed;
          document.getElementById('prod-image-preview').src = compressed;
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
    document.getElementById('prod-stock').value = 1;
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
      stock: Math.max(0, parseInt(document.getElementById('prod-stock').value, 10) || 0),
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

    await saveDataAsync();
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

  // ── Init: Load data with resolved images ──
  loadData();
  // Resolve IndexedDB image references
  const resolvedProducts = await getLocalProductsWithImages();
  if (resolvedProducts.length > 0 || getLocalProducts().length === 0) {
    products = resolvedProducts;
  }

  if (isSupabaseReady()) {
    try {
      const { getAllCategories } = await import('/js/supabase.js');
      const cloudCats = await getAllCategories();
      if (cloudCats?.length) {
        categories = cloudCats;
        localStorage.setItem('voko_categories', JSON.stringify(categories));
      }
    } catch (e) {
      console.info('Supabase init fallback to local data:', e);
    }
  }
  window.addEventListener('storage', (e) => {
    if (e.key === 'voko_categories') {
      loadData();
      renderCategories();
      renderProducts(document.getElementById('inventory-search')?.value || '');
    }
  });

  // Note: voko_products_updated event removed to prevent circular overwrites.
  // Inventory.js manages its own products array directly.

  // ── Mass Upload Modal Logic ──
  const massModal = document.getElementById('mass-upload-modal');
  const btnMassUpload = document.getElementById('btn-mass-upload');
  const btnCloseMass = document.getElementById('btn-close-mass-modal');
  const btnCancelMass = document.getElementById('btn-cancel-mass-modal');
  const massFileInput = document.getElementById('mass-images-file');
  const massConfirmBtn = document.getElementById('btn-confirm-mass-upload');
  const massPreviewContainer = document.getElementById('mass-preview-container');
  const massPreviewGrid = document.getElementById('mass-preview-grid');
  const massPreviewCount = document.getElementById('mass-preview-count');

  let selectedMassFiles = [];

  function openMassModal() {
    selectedMassFiles = [];
    if (massFileInput) massFileInput.value = '';
    if (massPreviewContainer) massPreviewContainer.style.display = 'none';
    if (massPreviewGrid) massPreviewGrid.innerHTML = '';
    if (massConfirmBtn) {
      massConfirmBtn.disabled = true;
      massConfirmBtn.textContent = 'Crear Productos Borradores';
    }
    massModal?.classList.add('open');
  }

  function closeMassModal() {
    massModal?.classList.remove('open');
    selectedMassFiles = [];
  }

  btnMassUpload?.addEventListener('click', openMassModal);
  btnCloseMass?.addEventListener('click', closeMassModal);
  btnCancelMass?.addEventListener('click', closeMassModal);
  massModal?.addEventListener('click', (e) => {
    if (e.target === massModal) closeMassModal();
  });

  massFileInput?.addEventListener('change', (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    selectedMassFiles = files;

    if (massPreviewGrid && massPreviewCount && massPreviewContainer) {
      massPreviewGrid.innerHTML = '';
      massPreviewCount.textContent = `Vista previa de fotos seleccionadas (${files.length}):`;

      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.style.width = '100%';
          img.style.height = '70px';
          img.style.objectFit = 'cover';
          img.style.borderRadius = 'var(--radius-xs)';
          massPreviewGrid.appendChild(img);
        };
        reader.readAsDataURL(file);
      });

      massPreviewContainer.style.display = 'block';
    }

    if (massConfirmBtn) {
      massConfirmBtn.disabled = false;
      massConfirmBtn.textContent = `Crear ${files.length} Productos Borradores`;
    }
  });

  massConfirmBtn?.addEventListener('click', async () => {
    if (selectedMassFiles.length === 0) return;

    massConfirmBtn.disabled = true;
    massConfirmBtn.textContent = 'Procesando fotos...';

    const defaultCat = document.getElementById('mass-category')?.value || (categories[0]?.id || 'cat-1');
    const defaultPrice = parseFloat(document.getElementById('mass-price')?.value) || 50000;
    const defaultStock = Math.max(0, parseInt(document.getElementById('mass-stock')?.value, 10) || 1);

    let createdCount = 0;

    for (let i = 0; i < selectedMassFiles.length; i++) {
      const file = selectedMassFiles[i];
      const rawDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target.result);
        reader.readAsDataURL(file);
      });

      // Compress image to ~25KB JPEG so it never hits localStorage limits
      const compressedDataUrl = await compressImage(rawDataUrl, 450, 0.7);

      let rawName = file.name ? file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') : '';
      if (!rawName || rawName.length > 30) {
        rawName = `Bolso Borrador #${products.length + 1}`;
      } else {
        rawName = rawName.replace(/\b\w/g, c => c.toUpperCase());
      }

      const newProduct = {
        id: 'prod-' + Date.now() + '-' + i,
        nombre: rawName,
        precio: defaultPrice,
        stock: defaultStock,
        badge: 'nuevo',
        destacado: false,
        activo: true,
        categoria_id: defaultCat,
        imagen_url: compressedDataUrl,
        descripcion: 'Producto borrador importado desde fotos.'
      };

      products.unshift(newProduct);
      createdCount++;
    }

    await saveDataAsync();
    renderProducts();
    closeMassModal();

    alert(`¡Éxito! Se crearon ${createdCount} productos borradores con las fotos seleccionadas. Podés hacer clic en ✏️ Editar en cualquier fila para ajustar el título y precio.`);
  });

  renderCategories();
  renderProducts();
});
