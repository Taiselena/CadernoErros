// Build de teste: troca o Firebase por implementações falsas em memória.
import { defineConfig, mergeConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import base from './vite.config';
const f = (p: string) => fileURLToPath(new URL(p, import.meta.url));
export default mergeConfig(base, defineConfig({
  build: { outDir: 'dist-teste' },
  resolve: { alias: [
    { find: /^firebase\/firestore$/, replacement: f('./tests/fake/firestore.ts') },
    { find: /^firebase\/auth$/, replacement: f('./tests/fake/auth.ts') },
    { find: /^\.\/firebase$/, replacement: f('./tests/fake/firebase.ts') },
    { find: /^\.\.\/lib\/firebase$/, replacement: f('./tests/fake/firebase.ts') },
  ] },
}));
