-- ========================================================
-- VOKO ACCESORIOS — Script de Inicialización de Supabase
-- ========================================================
-- Este script crea la estructura completa de base de datos PostgreSQL
-- y habilita las políticas de almacenamiento para la plataforma web Voko.
--
-- INSTRUCCIONES:
-- 1. Ir a tu proyecto en Supabase > SQL Editor
-- 2. Pegar este script completo y ejecutar
-- 3. Las tablas, datos iniciales y políticas se crean automáticamente
-- ========================================================

-- ========================================================
-- BORRAR POLÍTICAS EXISTENTES (para poder re-ejecutar el script)
-- ========================================================
DO $$ BEGIN
  -- categorias
  DROP POLICY IF EXISTS "Lectura pública de categorías" ON public.categorias;
  DROP POLICY IF EXISTS "Escritura completa categorías" ON public.categorias;
  DROP POLICY IF EXISTS "Acceso completo categorías" ON public.categorias;
  -- productos
  DROP POLICY IF EXISTS "Lectura pública de productos" ON public.productos;
  DROP POLICY IF EXISTS "Escritura completa productos" ON public.productos;
  DROP POLICY IF EXISTS "Acceso completo productos" ON public.productos;
  -- ventas
  DROP POLICY IF EXISTS "Escritura completa ventas" ON public.ventas;
  DROP POLICY IF EXISTS "Acceso completo ventas" ON public.ventas;
  -- venta_items
  DROP POLICY IF EXISTS "Escritura completa venta_items" ON public.venta_items;
  DROP POLICY IF EXISTS "Acceso completo venta_items" ON public.venta_items;
  -- pedidos
  DROP POLICY IF EXISTS "Escritura completa pedidos" ON public.pedidos;
  DROP POLICY IF EXISTS "Acceso completo pedidos" ON public.pedidos;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. Tabla de Categorías
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    orden INT DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Productos
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    categoria_id UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    imagen_url TEXT,
    badge TEXT,
    destacado BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabla de Ventas (Punto de Venta Presencial)
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    total NUMERIC(12,2) NOT NULL,
    metodo_pago TEXT DEFAULT 'Efectivo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabla de Detalle de Ventas
CREATE TABLE IF NOT EXISTS public.venta_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    venta_id UUID REFERENCES public.ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES public.productos(id) ON DELETE SET NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(12,2) NOT NULL
);

-- 5. Tabla de Pedidos Personalizados y Consultas Web
CREATE TABLE IF NOT EXISTS public.pedidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente TEXT NOT NULL,
    tipo TEXT NOT NULL,
    detalle TEXT NOT NULL,
    has_image BOOLEAN DEFAULT false,
    estado TEXT DEFAULT 'Pendiente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- DATOS INICIALES (Semilla de Categorías)
-- ========================================================
INSERT INTO public.categorias (nombre, orden, activa) VALUES
('Bolsos', 1, true),
('Bandoleras', 2, true),
('Riñoneras', 3, true),
('Carteras', 4, true),
('Morrales', 5, true),
('Materos', 6, true),
('Sobres', 7, true),
('Cinturones', 8, true),
('Billeteras', 9, true)
ON CONFLICT DO NOTHING;

-- ========================================================
-- CONFIGURACIÓN DE POLÍTICAS RLS (Row Level Security)
-- ========================================================
-- Usamos UNA sola política "ALL" por tabla para evitar conflictos.
-- Esto permite lectura y escritura pública con la anon key.
-- En producción, deberías restringir escritura a usuarios autenticados.

ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venta_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso completo categorías" ON public.categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo ventas" ON public.ventas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo venta_items" ON public.venta_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso completo pedidos" ON public.pedidos FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- BUCKET DE IMÁGENES DE PRODUCTOS (STORAGE)
-- ========================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop existing first to allow re-run)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Lectura pública de imágenes" ON storage.objects;
  DROP POLICY IF EXISTS "Subida de imágenes" ON storage.objects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Lectura pública de imágenes" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Subida de imágenes" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'product-images');
