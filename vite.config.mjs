/* Cloudflare todavía tiene configurado el build de NORTE ("npx vite build").
   Vamo se compila con Expo, así que ese comando arma Vamo y termina acá.
   Si en Cloudflare cambiás el build command a "npm run build:web", este archivo se puede borrar. */
import { execSync } from 'node:child_process';

execSync('npm run build:web', { stdio: 'inherit' });
process.exit(0);
