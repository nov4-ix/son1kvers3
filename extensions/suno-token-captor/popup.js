document.addEventListener('DOMContentLoaded', () => {
    updateUI();

    document.getElementById('scanBtn').addEventListener('click', scan);
    document.getElementById('openBtn').addEventListener('click', openSuno);
    document.getElementById('clearBtn').addEventListener('click', clearTokens);

    // Auto-refresh cada 2 segundos
    setInterval(updateUI, 2000);
});

async function updateUI() {
    const result = await chrome.storage.local.get(null);
    const tokens = Object.keys(result).filter(k => k.startsWith('token_'));

    document.getElementById('count').textContent = tokens.length;

    const list = document.getElementById('tokenList');
    list.innerHTML = '';

    if (tokens.length === 0) {
        list.innerHTML = '<div class="empty">No hay tokens capturados</div>';
    } else {
        tokens.forEach((key, index) => {
            const token = result[key];
            const div = document.createElement('div');
            div.className = 'token-item';
            div.innerHTML = `
        <div class="token-preview">${token.substring(0, 30)}...</div>
        <div class="token-meta">Capturado: ${new Date(parseInt(key.split('_')[1])).toLocaleTimeString()}</div>
      `;
            list.appendChild(div);
        });
    }
}

function scan() {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]?.url?.includes('suno.com')) {
            chrome.tabs.sendMessage(tabs[0].id, { type: 'RESCAN_TOKENS' });
            document.getElementById('status').textContent = '🔍 Escaneando...';
            setTimeout(() => {
                document.getElementById('status').textContent = '✅ Listo';
                updateUI();
            }, 1000);
        } else {
            document.getElementById('status').textContent = '⚠️ Abre suno.com primero';
        }
    });
}

function openSuno() {
    chrome.tabs.create({ url: 'https://suno.com/create' });
}

async function clearTokens() {
    if (confirm('¿Eliminar todos los tokens?')) {
        await chrome.storage.local.clear();
        updateUI();
    }
}
