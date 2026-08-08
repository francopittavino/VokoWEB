# 🧵 VOKO ACCESORIOS — Guía de Contexto para Agentes de IA (`AGENTS.md`)

Este archivo documenta el contexto, la arquitectura, el estado actual y el mapa de ruta del proyecto **Voko Accesorios**. Cualquier modelo o agente de IA que trabaje en esta carpeta debe leer este documento antes de realizar modificaciones.

> **Última revisión:** 8 de agosto de 2026.

---

## 📌 1. Visión General del Proyecto

- **Negocio:** Voko Accesorios (boutique artesanal de accesorios de cuerina: bolsos, bandoleras, riñoneras, carteras, morrales, materos, sobres, cinturones, billeteras).
- **Propietaria:** Mamá de Franco.
- **Redes Oficiales:**
  - **Instagram:** [instagram.com/voko.accesorios](https://www.instagram.com/voko.accesorios)
  - **Facebook:** [facebook.com/profile.php?id=61589357885130](https://www.facebook.com/profile.php?id=61589357885130)
  - **WhatsApp:** `+54 9 343 428-9398`
- **Objetivo:** Plataforma web dual:
  1. **Tienda Pública (Mobile-First):** catálogo con carrito, filtros por categoría/precio/búsqueda, pedido personalizado y checkout formateado directo a WhatsApp.
  2. **Panel de Administración (Internal Tool / POS):** dashboard con métricas, CRUD de productos e inventario con stock, Punto de Venta para ferias, fichas de costos de fabricación y gestión de pedidos.

---

## 🛠️ 2. Arquitectura y Stack Tecnológico

- **Frontend:** HTML5 y CSS3 sin frameworks (variables CSS, Grid, Flexbox, tokens estilo Material Design 3), JavaScript ES Modules.
- **Build Tool:** Vite v6 (multi-page application, 11 entradas en `vite.config.js`).
- **Base de Datos & Auth:** Supabase (PostgreSQL, Storage). **Todavía no está conectado** — ver §6.
- **Estrategia Fallback:** mientras Supabase no tenga credenciales, la app funciona 100% con **`localStorage`** (metadata) e **IndexedDB** (fotos). Nada del JS debe romperse si la nube no responde.
- **Hosting / Deploy:** Vercel. Dev local en `http://localhost:3000` (`npm run dev`).

---

## 📁 3. Estructura de Directorios

```
VokoWEB/
├── AGENTS.md                     # Este documento
├── .env                          # Secretos locales (IGNORADO por git)
├── .env.example                  # Plantilla de variables de entorno (versionada)
├── index.html                    # Inicio (Hero, Nav Grid, Cita, Destacados, Footer)
├── productos.html                # Catálogo (búsqueda, filtros, grid, carrito)
├── nosotros.html                 # Historia, valores y tarjetas de contacto directo
├── personalizado.html            # Pedido a medida → WhatsApp + registro en Pedidos
├── package.json                  # Dependencias (vite, @supabase/supabase-js)
├── vite.config.js                # Configuración multipágina de Vite
├── vercel.json                   # Rewrites para routing en Vercel
├── supabase_schema.sql           # Script de inicialización de la base
├── public/
│   └── favicon.svg               # Isotipo "V" (se copia tal cual a dist/)
├── images/                       # Fotos de hero, grillas y logos
├── admin/
│   ├── index.html                # Login del panel
│   ├── dashboard.html            # Métricas + ventas recientes
│   ├── inventario.html           # CRUD de productos/categorías + carga masiva
│   ├── pos.html                  # Punto de Venta
│   ├── pedidos.html              # Encargos y consultas recibidas
│   └── costos.html               # Fichas de costos de fabricación
├── css/
│   ├── variables.css             # Design tokens
│   ├── base.css                  # Reset, utilidades y animaciones scroll reveal
│   ├── components.css            # Navbar, footer, botones, cards, carrito, badges
│   ├── pages.css                 # Estilos de páginas públicas
│   └── admin.css                 # Estilos del panel (sidebar, POS, stats, tablas)
└── js/
    ├── config.js                 # Constantes, redes, hash de admin, helpers de precio
    ├── supabase.js               # Cliente y CRUD de Supabase
    ├── navigation.js             # Navbar scroll, menú mobile, scroll reveal, año del footer
    ├── cart.js                   # Carrito, persistencia y checkout por WhatsApp
    ├── products.js               # Render de productos, filtros y modal de vista previa
    └── admin/
        ├── auth.js               # Login por hash, sesión con vencimiento
        ├── auth-guard.js         # Guardia importada por cada página del panel
        ├── storage-helper.js     # ⭐ Fuente única de datos locales (ver §5)
        ├── dashboard.js
        ├── inventory.js
        ├── pos.js
        ├── orders.js
        └── costs.js
```

> ⚠️ **Toda página nueva debe registrarse en `vite.config.js`.** Si no está ahí, no entra al build y queda muerta en producción aunque funcione en `npm run dev`.

---

## 🎨 4. Sistema de Diseño

Todos los tokens viven en `css/variables.css`. **Nunca hardcodear colores ni tamaños**: usar siempre las variables.

- **Paleta — Warm Leather & Mocha (tema oscuro cálido):**
  - Primary (dorado champagne): `#d4a359` (`--color-primary`)
  - Secondary (marrón suela miel): `#e2b495` (`--color-secondary`)
  - Tertiary (dorado herrajes): `#f3c46a` (`--color-tertiary`)
  - Surface / Background (marrón cuero tostado): `#665347` (`--color-surface`)
  - Texto sobre superficie: `#ffffff` (`--color-on-surface`)
  - Success: `#52c457` · Warning: `#ffbe53` · Error: `#ff7b7b` · WhatsApp: `#25d366`
- **Tipografías:**
  - Títulos / Display: `Cormorant Garamond`, serif (`--font-display`)
  - Cuerpo / Interfaz: `Plus Jakarta Sans`, sans-serif (`--font-body`)
- **Espaciado:** escala de 4px (`--space-1` … `--space-24`).

---

## 🧠 5. Reglas de Datos (importante)

### `js/admin/storage-helper.js` es la única fuente de verdad local
Exporta las semillas de demo (`INITIAL_DEMO_PRODUCTS`, `INITIAL_DEMO_CATEGORIES`) y los helpers compartidos. **No dupliques estos datos en otros archivos.**

Helpers que hay que reutilizar en lugar de reescribir:

| Helper | Para qué sirve |
| --- | --- |
| `getLocalProducts()` / `saveLocalProducts()` | Leer y escribir productos (metadata) |
| `updateLocalProduct(id, cambios)` | ⭐ Modificar **un** producto sin pisar el resto |
| `addLocalProduct()` / `removeLocalProduct(id)` | Alta y baja puntual |
| `decreaseLocalStock(items)` / `increaseLocalStock(items)` | Descontar (venta) y devolver (anulación) stock |
| `getLocalProductsWithImages()` / `saveLocalProductsAsync()` | Igual, resolviendo las fotos guardadas en IndexedDB |
| `getProductImg(p)` | Imagen a mostrar (acepta URL, data URL, y cae en `PLACEHOLDER_IMAGE`) |
| `getStock(p)` | Stock normalizado a entero ≥ 0 |
| `isFromToday(registro)` | Filtrar ventas/pedidos del día (usa `timestamp`, con fallback a `fecha` es-AR) |
| `getLocalSales()` / `saveLocalSales()` | Historial de ventas del POS |

### Claves de `localStorage`
`voko_products` · `voko_categories` · `voko_sales_history` · `voko_orders` · `voko_cart` · `voko_product_costs`

Las fotos pesadas (data URLs) se externalizan a IndexedDB (`voko_images_db`) y en `localStorage` queda sólo la referencia `idb://<id>`, para no reventar la cuota.

### Stock — el Punto de Venta es el único que lo modifica

Todo producto tiene `stock` (entero ≥ 0). **La regla central: el stock sólo baja desde el POS.** Los pedidos de la web se cierran por WhatsApp, así que la dueña los carga a mano en el Punto de Venta; el checkout del carrito **nunca** descuenta stock.

| Acción | Efecto sobre el stock |
| --- | --- |
| Cobrar una venta en el POS | **Resta** las unidades vendidas |
| Pedido por la web (carrito → WhatsApp) | **Ninguno** — se carga después en el POS |
| Borrar una venta con "Devolver al stock y eliminar" | **Suma** de vuelta las unidades de esa venta |
| Borrar una venta con "Eliminar sin tocar el stock" | **Ninguno** |
| Editar el producto en Inventario | Se fija a mano |

### Qué se publica en la tienda

**El stock es lo único que decide la visibilidad.** `filterProducts()` en `js/products.js`:

```js
products.filter((p) => getStock(p) > 0)
```

Un producto en 0 **desaparece del catálogo** (no se muestra deshabilitado). No hay toggle de Mostrar/Ocultar: para sacar algo de la tienda se le pone stock 0 desde Inventario.

> El campo `activo` sigue existiendo en el modelo y se escribe siempre en `true`, porque la rama de Supabase (`getProducts`) filtra por él. **No volver a exponerlo en la UI**: se quitó a propósito para que haya un solo control.

El stock se edita **en línea** desde la tabla de Inventario, con un contador `− N +` (clase `.stock-editor`); no hace falta abrir el formulario de edición. El dashboard cuenta como *stock bajo* los productos con `APP_CONFIG.lowStockThreshold` (3) unidades o menos.

### ⚠️ Nunca guardar el array completo de productos desde una copia en memoria

Este fue un bug real y silencioso: Inventario cargaba `products` al abrir la página y cualquier acción posterior escribía **todo** el array. Si mientras tanto el POS había descontado stock, ese guardado lo revivía — el stock volvía al valor viejo al recargar.

**Regla:** para tocar productos usar siempre las funciones quirúrgicas de la tabla de arriba, que releen el estado actual y modifican sólo lo necesario. `saveLocalProducts(arrayCompleto)` queda reservado para cuando el array acaba de leerse de `getLocalProducts()` en la misma operación.

Además, `saveLocalProducts()` emite el evento `voko_products_updated` para que la pantalla actual se refresque, y el evento nativo `storage` cubre las otras pestañas. **Los listeners sólo pueden releer y re-renderizar, nunca escribir**, o se genera un bucle.

### Devolver stock al borrar una venta
Sólo se puede reponer lo que la venta haya guardado en su array `items`. Las ventas viejas sin ese detalle muestran el botón deshabilitado: **nunca inventar el producto** (el código anterior usaba `products[0]` como fallback y le sumaba stock a un producto al azar).

### Fechas
Las ventas y los pedidos nuevos guardan `timestamp` (epoch ms) además del `fecha` legible. Para cualquier métrica "de hoy", usar `isFromToday()`.

---

## 🔐 6. Acceso al Panel

- El login (`admin/index.html`) compara el **SHA-256** de lo tipeado contra `ADMIN_PASSWORD_HASH`, que **sale exclusivamente de la variable de entorno `VITE_ADMIN_PASSWORD_HASH`**. El repositorio es público: en el código no hay contraseña ni en texto plano ni hasheada.
- La sesión se guarda en **`localStorage`** con vencimiento de 12 horas. Se usa `localStorage` y no `sessionStorage` a propósito: este último es por pestaña, y obligaba a loguearse de nuevo al abrir el POS y el Inventario a la vez. "Cerrar Sesión" la borra en el acto.
- Cada página de `/admin` importa `js/admin/auth-guard.js` desde el `<head>`; sin sesión válida redirige al login y además cablea los botones "Cerrar Sesión".
- **Falla en cerrado:** si la variable no está cargada, `isAdminPasswordConfigured()` da `false`, el botón de ingreso queda deshabilitado y el login avisa que falta la configuración (en vez de decir "contraseña incorrecta").

### Dónde se carga la variable
| Entorno | Dónde |
| --- | --- |
| Local | archivo `.env` en la raíz (ignorado por git). Partir de `.env.example`. |
| Producción | Vercel → Project Settings → Environment Variables |

### Cambiar la contraseña
```powershell
$h = [System.Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes('tu-clave-nueva'))
($h | ForEach-Object { $_.ToString('x2') }) -join ''
```
Pegar el resultado en `VITE_ADMIN_PASSWORD_HASH` (local y en Vercel). **La contraseña en texto plano no se escribe en ningún archivo del proyecto.**

> ⚠️ **La contraseña original está comprometida.** Estuvo versionada en texto plano en el archivo `CREDENCIALES.md` (eliminado) y sigue visible en el historial público de git, a partir del commit `9926743`. Borrar el archivo no la des-publica.
>
> Además, Vite **inlinea las variables `VITE_*` en el bundle** al compilar: el hash termina siendo visible en el JS del sitio publicado. Eso es inevitable en una validación del lado del cliente, y significa que un SHA-256 sin sal de una palabra corta se revierte en segundos con una tabla arcoíris. Por eso **la contraseña nueva tiene que ser larga** (una frase de varias palabras), no una palabra suelta.

> ⚠️ **Limitación conocida:** al ser una app sin backend, esta protección frena el acceso casual pero no a alguien decidido (puede escribir la sesión a mano en el navegador). Los datos del panel viven en el navegador de cada dispositivo, no en un servidor. La protección real llega recién al mover el panel a **Supabase Auth** con RLS por usuario.

---

## 🚨 7. Pendientes / Backlog

### ☁️ 1. Conexión a la instancia real de Supabase
- Ejecutar `supabase_schema.sql` en el SQL Editor de Supabase.
- Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` como variables de entorno en Vercel (y en un `.env` local).
- Las políticas RLS del script son de acceso completo con la anon key: **antes de producción** hay que restringir la escritura a usuarios autenticados.

### 🖼️ 2. Fotos reales de Voko
- Reemplazar las imágenes de demo (Unsplash) por fotos reales de los productos y del taller. Las semillas están en `INITIAL_DEMO_PRODUCTS`.

### 🌐 3. URLs absolutas para compartir
- Los `og:image` de las páginas públicas usan rutas relativas. Cuando esté el dominio de Vercel definitivo, pasarlas a URLs absolutas y agregar `og:url` — algunos scrapers (WhatsApp incluido) no resuelven rutas relativas.

### 🚀 4. Deploy
- El repo ya está en GitHub: `https://github.com/francopittavino/VokoWEB` → rama `main`.
- El proyecto compila limpio con `npm run build`. Falta conectar el repo a Vercel para tener la URL pública.

---

## 🧭 8. Decisiones de Producto ya Tomadas

Estas decisiones vivían sólo en los mensajes de commit y ya causaron que se deshiciera trabajo por error. **Antes de "arreglar" algo que parece incompleto, revisá `git log` y esta lista.**

| Decisión | Estado |
| --- | --- |
| **La calculadora rápida fue retirada** (commit `2593347`). `admin/costos.html` + `js/admin/costs.js` la reemplazan: las fichas de costos con insumos, cantidades y margen cubren el mismo caso mejor. Los archivos `admin/calculadora.html` y `js/admin/calculator.js` fueron eliminados. | **Vigente** — no reintroducirla. |
| **El toggle Mostrar/Ocultar** (`activo`) controla qué se ve en la tienda. Es independiente del stock: un producto con stock puede estar oculto, y uno visible puede estar agotado. | **Vigente.** |
| **El control de stock fue eliminado en el commit `d45b636`** y reincorporado a pedido el 8/8/2026, ahora sí completo: el POS descuenta de verdad en modo local (antes sólo lo hacía la rama de Supabase, que nunca se usaba), el catálogo público deshabilita los agotados y el dashboard cuenta el stock bajo. | **Reincorporado** — la versión anterior estaba incompleta, esta funciona. |

---

## 💡 9. Guía de Trabajo para Nuevos Agentes

1. **Mantener la estética:** usar siempre las variables de `variables.css`. No introducir Tailwind ni otras librerías de estilos.
2. **Respetar el flujo de WhatsApp:** los pedidos se envían como mensaje pre-formateado vía `getWhatsAppLink()` (`js/config.js`). Usa `api.whatsapp.com/send` a propósito: el acortador `wa.me` corrompe los emojis UTF-8 en su redirect 302. Los emojis se escriben con `String.fromCodePoint()` por el mismo motivo. Los mensajes llevan emojis, desglose de items y total.
3. **Mantener los fallbacks:** si Supabase no responde, el JS nunca debe romperse; siempre cae a `localStorage` / IndexedDB.
4. **No duplicar datos ni helpers:** revisar §5 antes de escribir una función nueva.
5. **Verificación:** probar en `npm run dev` (`http://localhost:3000`) y confirmar que `npm run build` sigue compilando. Al agregar una página nueva, registrarla en `vite.config.js` — si no, no entra al build.
6. **Cuidado con `alert()`/`confirm()`:** el panel los usa en POS, inventario, pedidos y dashboard. Si automatizás el navegador para probar, sustituilos antes (`window.alert = ...`), porque bloquean la sesión.
