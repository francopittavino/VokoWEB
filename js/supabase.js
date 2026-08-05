/* ============================================
   VOKO ACCESORIOS — Supabase Client
   Database operations for products, categories,
   sales, and admin functionality
   ============================================ */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

// ──────────────────────────────────────────
// Initialize Supabase Client
// ──────────────────────────────────────────
let supabase = null;

function getClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

// ──────────────────────────────────────────
// CATEGORIES
// ──────────────────────────────────────────

export async function getCategories() {
  const { data, error } = await getClient()
    .from('categorias')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAllCategories() {
  const { data, error } = await getClient()
    .from('categorias')
    .select('*')
    .order('orden', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createCategory(category) {
  const { data, error } = await getClient()
    .from('categorias')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id, updates) {
  const { data, error } = await getClient()
    .from('categorias')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await getClient()
    .from('categorias')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ──────────────────────────────────────────
// PRODUCTS
// ──────────────────────────────────────────

export async function getProducts(filters = {}) {
  let query = getClient()
    .from('productos')
    .select(`*, categorias(nombre)`)
    .eq('activo', true);

  if (filters.categoryId) {
    query = query.eq('categoria_id', filters.categoryId);
  }

  if (filters.minPrice) {
    query = query.gte('precio', filters.minPrice);
  }

  if (filters.maxPrice) {
    query = query.lte('precio', filters.maxPrice);
  }

  if (filters.search) {
    query = query.ilike('nombre', `%${filters.search}%`);
  }

  if (filters.featured) {
    query = query.eq('destacado', true);
  }

  // Sorting
  const sortField = filters.sortBy || 'created_at';
  const sortAsc = filters.sortAsc ?? false;
  query = query.order(sortField, { ascending: sortAsc });

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getAllProducts() {
  const { data, error } = await getClient()
    .from('productos')
    .select(`*, categorias(nombre)`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProductById(id) {
  const { data, error } = await getClient()
    .from('productos')
    .select(`*, categorias(nombre)`)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createProduct(product) {
  const { data, error } = await getClient()
    .from('productos')
    .insert({
      ...product,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(id, updates) {
  const { data, error } = await getClient()
    .from('productos')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProduct(id) {
  const { error } = await getClient()
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function updateStock(id, newStock) {
  return updateProduct(id, { stock: newStock });
}

// ──────────────────────────────────────────
// SALES (POS)
// ──────────────────────────────────────────

export async function createSale(sale) {
  const client = getClient();

  // Insert the sale
  const { data: saleData, error: saleError } = await client
    .from('ventas')
    .insert({
      total: sale.total,
      tipo: sale.tipo || 'local',
    })
    .select()
    .single();

  if (saleError) throw saleError;

  // Insert sale items
  const items = sale.items.map((item) => ({
    venta_id: saleData.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    subtotal: item.cantidad * item.precio_unitario,
  }));

  const { error: itemsError } = await client
    .from('venta_items')
    .insert(items);

  if (itemsError) throw itemsError;

  // Update stock for each product
  for (const item of sale.items) {
    const { data: product } = await client
      .from('productos')
      .select('stock')
      .eq('id', item.producto_id)
      .single();

    if (product) {
      await client
        .from('productos')
        .update({
          stock: Math.max(0, product.stock - item.cantidad),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.producto_id);
    }
  }

  return saleData;
}

export async function getSales(filters = {}) {
  let query = getClient()
    .from('ventas')
    .select(`*, venta_items(*, productos(nombre, imagen_url))`)
    .order('created_at', { ascending: false });

  if (filters.tipo) {
    query = query.eq('tipo', filters.tipo);
  }

  if (filters.dateFrom) {
    query = query.gte('created_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('created_at', filters.dateTo);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ──────────────────────────────────────────
// DASHBOARD STATS
// ──────────────────────────────────────────

export async function getDashboardStats() {
  const client = getClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [productsRes, salesTodayRes, lowStockRes] = await Promise.all([
    client.from('productos').select('id', { count: 'exact', head: true }),
    client
      .from('ventas')
      .select('total')
      .gte('created_at', today.toISOString()),
    client
      .from('productos')
      .select('id', { count: 'exact', head: true })
      .eq('activo', true)
      .lt('stock', 3),
  ]);

  const salesToday = salesTodayRes.data?.reduce(
    (sum, sale) => sum + Number(sale.total),
    0
  ) || 0;

  return {
    totalProducts: productsRes.count || 0,
    salesToday,
    salesCount: salesTodayRes.data?.length || 0,
    lowStockCount: lowStockRes.count || 0,
  };
}

// ──────────────────────────────────────────
// IMAGE UPLOAD
// ──────────────────────────────────────────

export async function uploadProductImage(file) {
  const client = getClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
  const filePath = `productos/${fileName}`;

  const { error } = await client.storage
    .from('product-images')
    .upload(filePath, file);

  if (error) throw error;

  const {
    data: { publicUrl },
  } = client.storage.from('product-images').getPublicUrl(filePath);

  return publicUrl;
}

// ──────────────────────────────────────────
// AUTH (Simple admin auth)
// ──────────────────────────────────────────

export async function signIn(email, password) {
  const { data, error } = await getClient().auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const {
    data: { session },
  } = await getClient().auth.getSession();
  return session;
}

export function onAuthStateChange(callback) {
  return getClient().auth.onAuthStateChange(callback);
}
