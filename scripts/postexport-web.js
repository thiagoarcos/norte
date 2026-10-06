/* Después de `expo export --platform web`: agrega lo necesario para instalar Vamo en la
   pantalla de inicio (manifest, ícono de iPhone, idioma) al index.html generado. */
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'dist', 'index.html');
let html = fs.readFileSync(file, 'utf8');
html = html.replace('<html lang="en">', '<html lang="es">');
html = html.replace('<meta httpEquiv="X-UA-Compatible" content="IE=edge" />', '');
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, viewport-fit=cover"',
);
const head = [
  '<link rel="manifest" href="/manifest.webmanifest" />',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png" />',
  '<meta name="theme-color" content="#FF5A1F" />',
  '<meta name="apple-mobile-web-app-capable" content="yes" />',
  '<meta name="mobile-web-app-capable" content="yes" />',
  '<meta name="apple-mobile-web-app-status-bar-style" content="default" />',
  '<meta name="apple-mobile-web-app-title" content="Vamo" />',
  '<meta name="description" content="Hábitos, gym, correr, dieta, plata y agenda." />',
].join('\n    ');
if (!html.includes('manifest.webmanifest')) html = html.replace('</title>', `</title>\n    ${head}`);
fs.writeFileSync(file, html);
console.log('index.html listo para instalar en el teléfono');
