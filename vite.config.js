import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        productos: resolve(__dirname, 'productos.html'),
        nosotros: resolve(__dirname, 'nosotros.html'),
        personalizado: resolve(__dirname, 'personalizado.html'),
        adminLogin: resolve(__dirname, 'admin/index.html'),
        adminDashboard: resolve(__dirname, 'admin/dashboard.html'),
        adminInventario: resolve(__dirname, 'admin/inventario.html'),
        adminPos: resolve(__dirname, 'admin/pos.html'),
        adminCalculadora: resolve(__dirname, 'admin/calculadora.html'),
        adminPedidos: resolve(__dirname, 'admin/pedidos.html'),
      },
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
