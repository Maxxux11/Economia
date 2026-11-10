# Mi dinero

Aplicación personal de finanzas hecha con HTML, CSS y JavaScript sin frameworks ni servicios externos. Los movimientos se guardan en el almacenamiento local del navegador.

## Probar en tu computador

Puedes abrir `index.html` directamente en un navegador. Para probar el paquete que se publica, genera el sitio y abre `dist/index.html`:

```bash
node scripts/build.mjs
```

## Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub en la rama `main`.
2. En **Settings → Pages**, selecciona **GitHub Actions** como fuente de publicación.
3. Cada cambio en `main` ejecutará `.github/workflows/deploy.yml`. También puedes iniciarlo manualmente desde la pestaña **Actions**.

El sitio usa rutas relativas, así que funciona en repositorios de proyecto como `usuario.github.io/Economy/` y no necesita variables secretas.

## Funciones

- Consulta el balance, los ingresos, los gastos, las cuentas, metas y pagos.
- Registra movimientos y cuentas; los movimientos actualizan el saldo correspondiente.
- Filtra y elimina movimientos; al eliminarlos se corrige el saldo.
- Oculta el balance, descarga una copia JSON de tus datos y restaura los datos de ejemplo.

Los datos están vinculados al navegador y dispositivo donde se introducen. Descarga un respaldo antes de cambiar de navegador o borrar sus datos.
