import { formatPrice, SUPABASE_URL, APP_CONFIG } from '/js/config.js';
import {
  getLocalProducts,
  saveLocalProducts,
  saveLocalProductsAsync,
  getLocalProductsWithImages,
  deleteImageFromIDB,
  getProductImg,
  getStock,
  updateLocalProduct,
  removeLocalProduct,
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

// Sólo categorías: guardar además el array de productos desde una copia en
// memoria pisaría el stock descontado por el Punto de Venta.
function saveData() {
  localStorage.setItem('voko_categories', JSON.stringify(categories));
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

/**
 * Fija el stock de un producto desde la tabla de inventario.
 * Escribe de forma quirúrgica: relee el estado actual y toca sólo este
 * producto, para no pisar el stock que el POS pudo haber descontado.
 */
async function setProductStock(id, newStock) {
  const stock = Math.max(0, parseInt(newStock, 10) || 0);

  const updated = updateLocalProduct(id, { stock });
  if (!updated) return null;

  // Mantenemos sincronizada la copia en memoria de esta pantalla
  products = getLocalProducts();

  if (isSupabaseReady() && !String(id).startsWith('prod-')) {
    try {
      const { updateProduct } = await import('/js/supabase.js');
      await updateProduct(id, { stock });
    } catch (e) {
      // Avisamos en vez de tragarnos el error: si no llegó a la nube, el valor
      // vuelve atrás en cuanto se recargue la página o se abra en otro equipo.
      console.error('No se pudo actualizar el stock en Supabase:', e);
      alert(
        `⚠️ El stock de "${updated.nombre}" se guardó en este dispositivo, pero no se pudo sincronizar con la nube.\n\n` +
        `Motivo: ${e?.message || e}\n\n` +
        `Al recargar, el valor va a volver al anterior. Revisá la conexión y probá de nuevo.`
      );
    }
  }

  return updated;
}

function renderProducts(filter = '') {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const filtered = filter
    ? products.filter(p => p.nombre.toLowerCase().includes(filter.toLowerCase()))
    : products;

  tbody.innerHTML = filtered.map(p => {
    const cat = categories.find(c => c.id === p.categoria_id);
    const stock = getStock(p);
    const stockLevel = stock === 0 ? 'agotado' : stock <= APP_CONFIG.lowStockThreshold ? 'bajo' : 'ok';

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
        <div class="stock-editor stock-editor--${stockLevel}">
          <button type="button" class="stock-editor__btn" data-stock-step="-1" data-id="${p.id}" aria-label="Restar una unidad de ${p.nombre}">−</button>
          <input type="number" class="stock-editor__input" value="${stock}" min="0" step="1"
                 data-stock-input data-id="${p.id}" aria-label="Stock de ${p.nombre}">
          <button type="button" class="stock-editor__btn" data-stock-step="1" data-id="${p.id}" aria-label="Sumar una unidad de ${p.nombre}">+</button>
        </div>
        <span class="stock-editor__hint">${stock === 0 ? 'Oculto en la tienda' : 'En la tienda'}</span>
      </td>
      <td>${p.badge ? `<span class="product-card__badge product-card__badge--${p.badge}" style="position:static;">${p.badge}</span>` : '—'}</td>
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
  document.getElementById('form-title').textContent = 'Editar Producto';
  const formCard = document.getElementById('product-form-card');
  if (formCard) {
    formCard.style.display = 'block';
    formCard.scrollIntoView({ behavior: 'smooth' });
  }
};

window.deleteProduct = async (id) => {
  if (!confirm('¿Eliminar este producto?')) return;

  // Borrado quirúrgico: relee el estado actual y saca sólo este producto,
  // sin pisar cambios hechos desde el Punto de Venta.
  removeLocalProduct(id);
  products = getLocalProducts();

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
      // `activo` ya no se maneja a mano: la visibilidad en la tienda depende
      // sólo del stock. Se deja en true para la rama de Supabase, que filtra por él.
      activo: true,
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
      // Guardado local quirúrgico: releemos el estado fresco para no revivir
      // el stock que el POS haya descontado mientras el formulario estaba abierto.
      const fresh = getLocalProducts();
      if (id) {
        const idx = fresh.findIndex(p => String(p.id) === String(id));
        if (idx >= 0) fresh[idx] = { ...fresh[idx], ...productData };
      } else {
        fresh.push({ id: 'prod-' + Date.now(), ...productData });
      }
      products = fresh;
    }

    await saveDataAsync();
    products = getLocalProducts();
    renderProducts(document.getElementById('inventory-search')?.value || '');
    if (formCard) formCard.style.display = 'none';
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Guardar Producto';
    }
  });

  document.getElementById('inventory-search')?.addEventListener('input', (e) => {
    renderProducts(e.target.value);
  });

  // ── Contador de stock editable en la tabla ──
  const productsTbody = document.getElementById('products-tbody');

  // Mientras esta pantalla escribe, ignoramos el eco de nuestro propio guardado
  // para no re-renderizar la tabla y robarle el foco al contador.
  let guardandoStock = false;

  /** Refresca sólo el color y el texto de la celda tocada, sin rehacer la tabla */
  function refrescarCeldaStock(editor, stock) {
    const nivel = stock === 0 ? 'agotado' : stock <= APP_CONFIG.lowStockThreshold ? 'bajo' : 'ok';
    editor.className = `stock-editor stock-editor--${nivel}`;
    const hint = editor.parentElement.querySelector('.stock-editor__hint');
    if (hint) hint.textContent = stock === 0 ? 'Oculto en la tienda' : 'En la tienda';
  }

  async function aplicarStock(id, valor, editor) {
    guardandoStock = true;
    const actualizado = await setProductStock(id, valor);
    guardandoStock = false;
    if (actualizado && editor) refrescarCeldaStock(editor, getStock(actualizado));
  }

  // Botones − / +
  productsTbody?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-stock-step]');
    if (!btn) return;

    const editor = btn.closest('.stock-editor');
    const input = editor.querySelector('[data-stock-input]');
    const nuevo = Math.max(0, (parseInt(input.value, 10) || 0) + parseInt(btn.dataset.stockStep, 10));

    input.value = nuevo; // feedback inmediato
    aplicarStock(btn.dataset.id, nuevo, editor);
  });

  // Escritura directa en el campo (se confirma al salir del campo o con Enter)
  productsTbody?.addEventListener('change', (e) => {
    const input = e.target.closest('[data-stock-input]');
    if (!input) return;

    const nuevo = Math.max(0, parseInt(input.value, 10) || 0);
    input.value = nuevo; // normaliza negativos o texto vacío
    aplicarStock(input.dataset.id, nuevo, input.closest('.stock-editor'));
  });

  productsTbody?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.closest('[data-stock-input]')) {
      e.preventDefault();
      e.target.blur(); // dispara el 'change'
    }
  });

  // ── Sincronización con el resto del panel ──
  // Releemos y re-renderizamos; nunca escribimos acá, o se genera un bucle.
  function refrescarDesdeAlmacenamiento() {
    if (guardandoStock) return;
    products = getLocalProducts();
    renderProducts(document.getElementById('inventory-search')?.value || '');
  }

  // Cambios de esta pestaña (POS abierto en la misma pestaña, formularios, etc.)
  window.addEventListener('voko_products_updated', refrescarDesdeAlmacenamiento);
  // Cambios hechos en OTRA pestaña
  window.addEventListener('storage', (e) => {
    if (e.key === 'voko_products') refrescarDesdeAlmacenamiento();
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

  // Los cambios de productos se sincronizan más arriba, en
  // refrescarDesdeAlmacenamiento(). Ese listener sólo relee y re-renderiza:
  // ya no hay riesgo de sobrescritura circular porque las escrituras son
  // quirúrgicas (updateLocalProduct / removeLocalProduct), no del array entero.

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
    const nuevos = [];

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

      nuevos.unshift(newProduct);
      createdCount++;
    }

    // Releemos recién ahora, después de procesar todas las fotos, para no
    // trabajar sobre una copia vieja mientras se comprimían las imágenes.
    products = [...nuevos, ...getLocalProducts()];

    await saveDataAsync();
    products = getLocalProducts();
    renderProducts();
    closeMassModal();

    alert(`¡Éxito! Se crearon ${createdCount} productos borradores con las fotos seleccionadas. Podés hacer clic en ✏️ Editar en cualquier fila para ajustar el título y precio.`);
  });

  renderCategories();
  renderProducts();
});
