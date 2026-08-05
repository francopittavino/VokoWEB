# 🧵 VOKO ACCESORIOS — Guía de Contexto para Agentes de IA (`AGENTS.md`)

Este archivo documenta de manera integral el contexto, la arquitectura, el progreso actual y el mapa de ruta del proyecto **Voko Accesorios**. Cualquier modelo o agente de IA que trabaje en esta carpeta debe leer este documento para tener visibilidad completa antes de realizar modificaciones.

---

## 📌 1. Visión General del Proyecto

- **Negocio:** Voko Accesorios (boutique artesanal de accesorios de cuero: bolsos, bandoleras, riñoneras, carteras, morrales, materos, sobres, cinturones, billeteras).
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
5. **Panel de Administración (MVP Creado):**
   - **`admin/index.html`**: Pantalla de login.
   - **`admin/dashboard.html`**: Vista general con tarjetas de métricas (stock bajo, productos, ventas), accesos rápidos y tabla de transacciones.
   - **`admin/inventario.html`**: CRUD completo de productos y categorías con toggles de activo/destacado, badges, imágenes y modal.

---

## 🚨 6. Features Pendientes / Backlog para el Siguiente Modelo

A continuación se detalla lo que faltó implementar o conectar respecto al plan original:

### 📥 1. Punto de Venta (POS) para Ferias (`admin/pos.html` + `js/admin/pos.js`)
- **Descripción:** Interfaz tipo caja registradora para ferias artesanales o ventas presenciales.
- **Requerimientos:**
  - Buscador o selector rápido de productos con imágenes en miniatura.
  - Teclado o controles de cantidad rápida (+1, -1).
  - Cálculo instantáneo de subtotal, descuentos y total final.
  - Botón "Cobrar / Confirmar Venta": registra la venta en la DB y **descuenta el stock automáticamente** de la tabla de productos.
  - Impresión de ticket digital o resumen de venta rápida.

### 🧮 2. Calculadora de Costos y Precios Sugeridos (`admin/calculadora.html` + `js/admin/calculator.js`)
- **Descripción:** Herramienta interna para determinar el precio de venta de nuevos accesorios de cuero.
- **Requerimientos:**
  - Formulario de entrada: Costo de materia prima (cuero, herrajes, hilos) + Horas de mano de obra * Precio por hora + Gastos indirectos (luz, fletes).
  - Selector de Margen de Ganancia deseado (ej. 40%, 50%, 60%).
  - Resumen visual: Desglose del costo base, utilidad neta y precio final sugerido al público.
  - Botón **"Guardar como Producto"**: crea automáticamente un borrador del producto en el inventario con el precio calculado.

### 📋 3. Vista de Pedidos Online Recibidos (`admin/pedidos.html` + `js/admin/orders.js`)
- **Descripción:** Panel para llevar el seguimiento de encargos personalizados o consultas que entraron por la web.
- **Requerimientos:**
  - Lista de pedidos con estados: `Pendiente`, `En Proceso`, `Enviado`, `Entregado`.
  - Ver detalles de la foto de referencia adjuntada por el cliente y las especificaciones.

### 📦 4. Modularización de Scripts Admin (`js/admin/*.js`)
- **Descripción:** Actualmente los scripts del admin están insertados en etiquetas `<script>` dentro de los HTML de `/admin/`. Se recomienda modularizarlos en la carpeta `js/admin/` (`inventory.js`, `pos.js`, `calculator.js`, `dashboard.js`) para mantener un código limpio y mantenible.

### ☁️ 5. Conexión y Script SQL de Supabase Real
- **Descripción:** Configuración en la consola de Supabase.
- **Requerimientos:**
  - Ejecutar el script de creación de tablas en Supabase (`categorias`, `productos`, `ventas`, `venta_items`).
  - Crear el bucket de storage público `product-images`.
  - Reemplazar las credenciales en `js/config.js` (`SUPABASE_URL` y `SUPABASE_ANON_KEY`).

### 🖼️ 6. Sustitución por fotos reales de Voko
- **Descripción:** Reemplazar las imágenes temporales de Unsplash con fotografías reales tomadas a los productos artesanales y al taller en `images/productos/`.

### 🚀 7. Deploy a Producción en Vercel
- **Descripción:** Publicación del sitio.
- **Requerimientos:**
  - Ejecutar build de prueba (`npm run build`).
  - Subir a Vercel para obtener la URL pública (ej. `voko-accesorios.vercel.app`).
  - Configurar variables de entorno en el panel de Vercel.

### 💎 8. Pulido Final y Assets
- **Favicon:** Crear `favicon.ico` con el isotipo de la letra "V" de Voko.
- **OpenGraph:** Agregar imagen previa (`og:image`) para cuando se comparta la web en WhatsApp o Instagram.

---

## 💡 7. Guía de Trabajo para Nuevos Agentes

1. **Mantener la Estética:** Usar siempre las variables CSS definidas en `variables.css`. No introducir Tailwind ni clases en línea arbitrarias.
2. **Respetar el Flujo de WhatsApp:** Los pedidos se procesan enviando un mensaje pre-formateado a WhatsApp (`wa.me/5493434289398`). Asegurar que los mensajes siempre lleven emojis, desglose claro de items y el total.
3. **Mantener los Fallbacks de Datos:** Si Supabase no está conectado, el código JS NUNCA debe romperse. Siempre debe retornar los datos de demo o `localStorage`.
4. **Verificación:** Probar los cambios en el servidor Vite local (`http://localhost:3000`).
