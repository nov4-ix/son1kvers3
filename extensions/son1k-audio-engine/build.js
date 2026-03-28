// Build script - Ofusca y minifica todo el código
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = __dirname;
const BUILD_DIR = path.join(__dirname, 'build');

// Crear directorio build
if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR);
}

// Configuración de ofuscación
const obfuscatorOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: false, // No debug para evitar problemas
    debugProtectionInterval: 0,
    disableConsoleOutput: true, // Deshabilitar console.log
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true, // Anti-tamper
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 2,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 4,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// Archivos a procesar
const files = [
    { src: 'background.js', dest: 'background.min.js' },
    { src: 'content.js', dest: 'content.min.js' }
];

async function build() {
    console.log('🔨 Building Son1k Audio Engine...\n');

    for (const file of files) {
        try {
            const srcPath = path.join(SRC_DIR, file.src);
            const destPath = path.join(BUILD_DIR, file.dest);

            console.log(`Processing ${file.src}...`);

            // Leer archivo fuente
            const code = fs.readFileSync(srcPath, 'utf8');

            // 1. Minificar con Terser
            const minified = await minify(code, {
                compress: {
                    dead_code: true,
                    drop_console: true,
                    drop_debugger: true,
                    keep_classnames: false,
                    keep_fnames: false,
                    passes: 3
                },
                mangle: {
                    toplevel: true,
                    properties: false
                },
                output: {
                    comments: false,
                    beautify: false
                }
            });

            // 2. Ofuscar con javascript-obfuscator
            const obfuscated = JavaScriptObfuscator.obfuscate(
                minified.code,
                obfuscatorOptions
            );

            // 3. Guardar en build/
            fs.writeFileSync(destPath, obfuscated.getObfuscatedCode());

            console.log(`✅ ${file.dest} created\n`);
        } catch (error) {
            console.error(`❌ Error processing ${file.src}:`, error.message);
            process.exit(1);
        }
    }

    // Copiar archivos estáticos
    const staticFiles = [
        'manifest.json',
        'options.html'
    ];

    for (const file of staticFiles) {
        fs.copyFileSync(
            path.join(SRC_DIR, file),
            path.join(BUILD_DIR, file)
        );
        console.log(`📋 Copied ${file}`);
    }

    // Copiar iconos si existen
    const iconsDir = path.join(SRC_DIR, 'icons');
    const buildIconsDir = path.join(BUILD_DIR, 'icons');

    if (fs.existsSync(iconsDir)) {
        if (!fs.existsSync(buildIconsDir)) {
            fs.mkdirSync(buildIconsDir);
        }

        const icons = fs.readdirSync(iconsDir);
        for (const icon of icons) {
            fs.copyFileSync(
                path.join(iconsDir, icon),
                path.join(buildIconsDir, icon)
            );
        }
        console.log(`🎨 Copied ${icons.length} icons`);
    }

    console.log('\n✨ Build completed successfully!');
    console.log(`📦 Extension ready in: ${BUILD_DIR}`);
}

build().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
});
