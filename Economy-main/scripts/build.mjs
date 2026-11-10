import { cpSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = path.join(projectRoot, 'dist');
const staticFiles = ['index.html', 'styles.css', 'app.js', 'favicon.svg'];

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });

for (const file of staticFiles) {
  cpSync(path.join(projectRoot, file), path.join(outputDirectory, file));
}

console.log(`Sitio preparado en ${outputDirectory}`);
