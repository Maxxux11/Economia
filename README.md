# Mi dinero

Aplicación personal de finanzas hecha con HTML, CSS y JavaScript sin frameworks ni servicios externos. Los movimientos se guardan en el almacenamiento local del navegador.

## Probar en tu computador

Puedes abrir `index.html` directamente en un navegador. Para probar el paquete que se publica, genera el sitio y abre `dist/index.html`:

```bash
node scripts/build.mjs
```

## Publicar en GitHub Pages

1. Los archivos del sitio, incluido `index.html`, deben estar en la raíz del repositorio.
2. En **Settings → Pages**, selecciona **Deploy from a branch**, la rama `main` y la carpeta `/(root)`.
3. GitHub Pages publicará la web automáticamente después de cada cambio en `main`. Espera a que termine el flujo **pages build and deployment**.
4. Abre la dirección que aparece en **Settings → Pages**. Para este repositorio es `https://maxxux11.github.io/Economia/`.

El sitio usa rutas relativas y no necesita dependencias ni variables secretas.

## Funciones

- Consulta el balance, los ingresos, los gastos, las cuentas, metas y pagos.
- Registra movimientos y cuentas; los movimientos actualizan el saldo correspondiente.
- Filtra y elimina movimientos; al eliminarlos se corrige el saldo.
- Oculta el balance, descarga una copia JSON de tus datos y restaura los datos de ejemplo.

Los datos están vinculados al navegador y dispositivo donde se introducen. Descarga un respaldo antes de cambiar de navegador o borrar sus datos.
