/* ============================================
   VOKO ACCESORIOS — Guardia de Sesión del Panel
   Se importa desde el <head> de cada página de
   /admin: corta el acceso directo por URL y
   cablea todos los botones de "Cerrar Sesión".
   ============================================ */

import { requireAuth, logout } from './auth.js';

// Oculta la página hasta confirmar la sesión, para que no se vea
// un destello del panel antes de la redirección al login.
document.documentElement.style.visibility = 'hidden';

try {
  if (requireAuth()) {
    document.documentElement.style.visibility = '';

    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.admin-logout-btn, #logout-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          logout();
        });
      });
    });
  }
} catch (e) {
  // Ante cualquier falla al validar, cerramos el acceso en vez de dejar
  // la página en blanco o mostrarla sin verificar.
  console.error('No se pudo verificar la sesión del panel:', e);
  window.location.replace('/admin/');
}
