console.log('[Suno Extension] 🚀 Loaded on', window.location.href);

// Función para encontrar tokens JWT en localStorage
function findSunoTokens() {
    const tokens = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        // Buscar keys relacionadas con Clerk Auth (que usa Suno)
        if (key.includes('clerk') || key.includes('session') || key.includes('token')) {
            const value = localStorage.getItem(key);

            // JWT tokens empiezan con eyJ
            if (value && value.startsWith('eyJ')) {
                tokens.push(value);
                console.log('[Suno Extension] 🔑 Found JWT in:', key);
            }

            // Buscar dentro de JSON
            try {
                const parsed = JSON.parse(value);
                const foundToken = findJWTInObject(parsed);
                if (foundToken) tokens.push(foundToken);
            } catch (e) { }
        }
    }

    return [...new Set(tokens)]; // Remover duplicados
}

function findJWTInObject(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return null;

    for (const key in obj) {
        const value = obj[key];
        if (typeof value === 'string' && value.startsWith('eyJ')) return value;
        if (typeof value === 'object') {
            const found = findJWTInObject(value, depth + 1);
            if (found) return found;
        }
    }
    return null;
}

// Enviar tokens al Generator
function sendTokens(tokens) {
    tokens.forEach(token => {
        // Guardar en storage local de la extensión también
        const key = `token_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        chrome.storage.local.set({ [key]: token });

        window.postMessage({
            type: 'SUNO_TOKEN_CAPTURED',
            token: token,
            source: 'suno-extension',
            timestamp: Date.now()
        }, '*');
        console.log('[Suno Extension] 📤 Sent token:', token.substring(0, 20) + '...');
    });
}

// Auto-scan al cargar
setTimeout(() => {
    const tokens = findSunoTokens();
    if (tokens.length > 0) {
        console.log('[Suno Extension] ✅ Found', tokens.length, 'token(s)');
        sendTokens(tokens);
    }
}, 2000);

// Monitorear cambios en localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key, value) {
    originalSetItem.apply(this, arguments);
    if (value && value.startsWith('eyJ')) {
        console.log('[Suno Extension] 🆕 New token detected');
        sendTokens([value]);
    }
};

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'RESCAN_TOKENS') {
        const tokens = findSunoTokens();
        sendTokens(tokens);
        sendResponse({ count: tokens.length });
    }
});

// Botón flotante para captura manual
const btn = document.createElement('button');
btn.textContent = '🔑 Capture Tokens';
btn.style.cssText = `
  position: fixed; bottom: 20px; right: 20px; z-index: 10000;
  padding: 12px 20px; background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; border: none; border-radius: 8px; cursor: pointer;
  font-weight: 600; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
`;
btn.onclick = () => {
    const tokens = findSunoTokens();
    sendTokens(tokens);
    btn.textContent = `✅ Captured ${tokens.length}!`;
    setTimeout(() => btn.textContent = '🔑 Capture Tokens', 2000);
};
document.body.appendChild(btn);
