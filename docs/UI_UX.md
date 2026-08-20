# UI / UX

## Filosofía

El usuario no debe pensar.

Debe tocar.

---

## Principios

Máximo tres toques.

Botones grandes.

Tipografía grande.

Pocas pantallas.

Evitar formularios largos.

---

## Colores

Cada negocio podrá modificar:

- Primario
- Secundario
- Fondo

Se aplican en tiempo real como variables CSS (`ThemeVars`, `apps/web/src/components/theme-vars.tsx`) — cambiar un color en Configuración se refleja al instante en toda la app (sidebar, botones, fondo), sin recargar la página.

---

## Modo oscuro

Preferencia por dispositivo (no por negocio): Claro / Oscuro / Sistema, elegible desde Configuración → Apariencia. "Sistema" sigue `prefers-color-scheme` del sistema operativo. Los colores de marca (primario/secundario) se mantienen iguales en ambos modos; lo que cambia son las superficies (fondo, tarjetas) y el texto neutro.

---

## Diseño

Minimalista.

Sin animaciones innecesarias — las que existen son feedback (sombra, presión de botón, entrada de modal), no decoración. Nunca deben interponerse entre el usuario y la siguiente acción.

Sombra con tinte del color primario (no gris genérico) para dar profundidad a tarjetas y botones sin salir de la paleta de marca.

Optimizado para celulares.

---

## Navegación

Dashboard

Agenda

Ventas

Clientes

Caja

Inventario

Configuración

---

## WhatsApp

Nunca reemplazar WhatsApp.

Integrarse con él.
