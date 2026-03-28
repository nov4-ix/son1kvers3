const esbuild = require('esbuild');
const { dependencies } = require('./package.json');

// Get all dependencies to mark as external, excluding our internal packages
const externalDeps = Object.keys(dependencies).filter(
    dep => !dep.startsWith('@super-son1k/')
);

esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    outfile: 'dist/server.js',
    external: externalDeps,
    sourcemap: true,
    minify: false, // Keep it readable for debugging if needed
}).catch(() => process.exit(1));
