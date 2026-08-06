# 🧵 VOKO ACCESORIOS — Guía de Contexto para Agentes de IA (`AGENTS.md`)

Este archivo documenta de manera integral el contexto, la arquitectura, el progreso actual y el mapa de ruta del proyecto **Voko Accesorios**. Cualquier modelo o agente de IA que trabaje en esta carpeta debe leer este documento para tener visibilidad completa antes de realizar modificaciones.

---

## 📌 1. Visión General del Proyecto

- **Negocio:** Voko Accesorios (boutique artesanal de accesorios de cuerina: bolsos, bandoleras, riñoneras, carteras, morrales, materos, sobres, cinturones, billeteras).
- **Propietaria:** Mamá de Franco.
- **Redes Oficiales:**
  - **Instagram:** [instagram.com/voko.accesorios](https://www.instagram.com/voko.accesorios)
  - **Facebook:** [facebook.com/profile.php?id=61589357885130](https://www.facebook.com/profile.php?id=61589357885130)
  - **WhatsApp:** `+54 9 343 428-9398`
- **Objetivo:** Crear una plataforma web dual:
  1. **Tienda Pública (Mobile-First):** Catálogo interactivo con carrito, filtros por categoría/precio/búsqueda, pedido personalizado con upload de imagen y checkout formateado directo a WhatsApp.
  2. **Panel de Administración (Internal Tool / POS):** Dashboard con métricas de venta, gestión dinámicas de productos e inventario (CRUD), Punto de Venta (POS) para ferias, calculadora de precios de costo/ganancia y gestión de pedidos.

---

## 🛠️ 2. Arquitectura y Stack Tecnológico

- **Frontend:** Vanilla HTML5, CSS3 moderno (Variables CSS, Grid, Flexbox, Material Design 3 tokens), JavaScript ES Modules.
- **Build Tool:** Vite v6 (multi-page application).
- **Base de Datos & Auth:** Supabase (PostgreSQL, Supabase Auth, Supabase Storage).
- **Estrategia Fallback:** Si Supabase aún no tiene credenciales configuradas, la app utiliza **datos de demostración** y **`localStorage`** para que toda la interfaz sea 100% navegable y funcional de inmediato.
- **Hosting / Deploy:** Vercel (servidor de desarrollo Vite en `http://localhost:3000`).

---

## 📁 3. Estructura de Directorios del Proyecto

```
Pagina V/
├── AGENTS.md                     # Documento de contexto principal para modelos de IA
├── index.html                    # Página de Inicio (Hero, Nav Grid, Cita, Destacados, Footer)
├── productos.html                # Catálogo (Búsqueda, Filtros precio/categoría, Grid, Carrito)
├── nosotros.html                 # Historia, valores y Formulario de Contacto → WhatsApp
├── personalizado.html            # Formulario de Pedido a Medida (Drag & drop imagen + WhatsApp)
├── package.json                  # Dependencias del proyecto (vite, @supabase/supabase-js)
├── vite.config.js                # Configuración Multi-Page de Vite
├── vercel.json                   # Rewrites para routing en Vercel
├── admin/
│   ├── index.html                # Login del Panel de Control
│   ├── dashboard.html            # Dashboard principal con métricas y accesos rápidos
│   └── inventario.html           # CRUD de Productos y Categorías con modal y form
├── css/
│   ├── variables.css             # Design Tokens (colores cálidos, fuentes, spacing 4/8px)
│   ├── base.css                  # CSS Reset, utilidades y animaciones scroll reveal
│   ├── components.css            # Componentes (Navbar, Footer, Buttons, Cards, Carrito Drawer, Badges)
│   ├── pages.css                 # Estilos específicos de páginas públicas
│   └── admin.css                 # Estilos completos del panel de administración (Sidebar, POS, Stats, Tables)
└── js/
    ├── config.js                 # Constantes globales, redes, helpers de precio ARS ($85.000)
    ├── supabase.js               # Cliente y métodos CRUD de Supabase (fallbacks incluidos)
    ├── navigation.js             # Efecto scroll navbar, menú hamburguesa mobile, scroll reveal
    ├── cart.js                   # Carrito de compras, persistencia localStorage, WhatsApp checkout
    └── products.js               # Renderizado dinámico de productos, filtros y categorías
```

---

## 🎨 4. Sistema de Diseño (Design System)

- **Paleta de Colores (Cálida / Tonos Tierra):**
  - Primary (Terracota / Cuero): `#99420d` (`var(--color-primary)`)
  - Secondary (Marrón cálido): `#7b5641` (`var(--color-secondary)`)
  - Surface / Background (Crema claro): `#fff9ef` (`var(--color-surface)`)
  - Accent / Gold: `#b95925` (`var(--color-tertiary)`)
  - Success (Verde WhatsApp): `#25D366` (`var(--color-success)`)
- **Tipografías:**
  - Títulos / Display: `Playfair Display`, serif.
  - Cuerpo / Interfaz: `Inter`, system-ui, sans-serif.

---

## ✅ 5. Trabajo Realizado Hasta la Fecha

1. **Configuración del Entorno:**
   - Proyecto Vite configurado para Multi-Page Application.
   - Node.js (v24.19.0) y npm (v11.17.0) operativos.
   - Política de ejecución de PowerShell corregida.
2. **Sistema de Estilos:**
   - `variables.css`, `base.css`, `components.css`, `pages.css` y `admin.css` construidos íntegramente sin librerías pesadas como Tailwind, asegurando máxima flexibilidad y velocidad de carga.
3. **Páginas Públicas Finalizadas:**
   - **`index.html`**: Hero con estética artesanal, grid de atajos visuales, cita sobre calidad, productos destacados que cargan dinámicamente, footer y botón flotante de WhatsApp.
   - **`productos.html`**: Filtros funcionales por texto, rango de precios min/max, chips por categoría y ordenamiento (A-Z, precio, fecha).
   - **`nosotros.html`**: Presentación del taller, valores de marca y formulario de contacto con redirigido automático a WhatsApp.
   - **`personalizado.html`**: Formulario interactivo con vista previa drag-and-drop de foto de referencia, descripción detallada del pedido y envío formateado por WhatsApp.
4. **Módulos JS Interactivos:**
   - **`js/cart.js`**: Carrito lateral deslizable (drawer), persistencia de items en `localStorage`, actualización de badges en tiempo real y mensaje con lista estructurada enviada a WhatsApp.
   - **`js/products.js`**: Lógica de filtrado en cliente, estado de carga con fallback de datos demo en caso de no estar conectado a la nube.
   - **`js/supabase.js`**: Cliente completo para productos, categorías, ventas y storage.
5. **Panel de Administración y Módulos JS Finalizados:**
   - **`admin/index.html`**: Pantalla de login.
   - **`admin/dashboard.html` + `js/admin/dashboard.js`**: Vista general con tarjetas de métricas en vivo (productos, ventas del día, pedidos online, stock bajo) y tabla de transacciones recientes.
   - **`admin/inventario.html` + `js/admin/inventory.js`**: CRUD completo de productos y categorías con toggles de activo/destacado, badges, imágenes y buscador en tiempo real.
   - **`admin/pos.html` + `js/admin/pos.js`**: Punto de Venta para ferias. Registra ventas presenciales, calcula subtotal/total y descuenta el stock automáticamente.
   - **`admin/calculadora.html` + `js/admin/calculator.js`**: Calculadora de costos artesanales y botón para incorporar el accesorio calculado directamente al inventario.
   - **`admin/pedidos.html` + `js/admin/orders.js`**: Gestión dinámica de encargos a medida (`personalizado.html`) y consultas de la web (`nosotros.html`) con buscador y cambios de estado (`Pendiente`, `En Proceso`, `Completado`, `Cancelado`).
6. **Script de Base de Datos SQL:**
   - **`supabase_schema.sql`**: Generado en la raíz con las 5 tablas principales (`categorias`, `productos`, `ventas`, `venta_items`, `pedidos`), RLS y bucket de almacenamiento `product-images`.

---

## 🚨 6. Features Pendientes / Backlog para el Siguiente Modelo

A continuación se detalla lo pendiente para el despliegue final:

### ☁️ 1. Conexión a Instancia Real de Supabase
- Ejecutar el script `supabase_schema.sql` en el Editor de SQL de Supabase.
- Reemplazar las credenciales en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).

### 🖼️ 2. Sustitución por Fotos Reales de Voko
- Reemplazar las imágenes temporales de Unsplash en `images/productos/` por fotos reales tomadas a los productos artesanales y al taller.

### 🚀 3. Deploy a Producción en Vercel / Netlify
- El proyecto compila limpiamente (`npm run build`). Subir repositorio a GitHub y conectar con Vercel para obtener la URL pública.

### 💎 4. Pulido Final y Assets
- **Favicon:** Crear `favicon.ico` con el isotipo de la letra "V" de Voko Accesorios.
- **OpenGraph:** Agregar metaetiqueta e imagen previa (`og:image`) para compartidos en WhatsApp o Instagram.

---

## 💡 7. Guía de Trabajo para Nuevos Agentes

1. **Mantener la Estética:** Usar siempre las variables CSS definidas en `variables.css`. No introducir Tailwind ni clases en línea arbitrarias.
2. **Respetar el Flujo de WhatsApp:** Los pedidos se procesan enviando un mensaje pre-formateado a WhatsApp (`wa.me/5493434289398`). Asegurar que los mensajes siempre lleven emojis, desglose claro de items y el total.
3. **Mantener los Fallbacks de Datos:** Si Supabase no está conectado, el código JS NUNCA debe romperse. Siempre debe retornar los datos de demo o `localStorage`.
4. **Verificación:** Probar los cambios en el servidor Vite local (`http://localhost:3000`).
