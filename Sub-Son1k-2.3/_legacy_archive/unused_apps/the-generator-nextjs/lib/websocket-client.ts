// WebSocket Client for Real-Time Music Preview
export class GenerationWebSocketClient {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private listeners: Map<string, Set<Function>> = new Map();

    constructor(private baseUrl: string) { }

    connect(generationId: string) {
        const wsUrl = `${this.baseUrl}/ws/generation/${generationId}`.replace('http', 'ws');

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log(`[WS] Connected to generation ${generationId}`);
            this.reconnectAttempts = 0;
            this.emit('connected', {});
        };

        this.ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.emit(message.type, message.data);
            } catch (err) {
                console.error('[WS] Parse error:', err);
            }
        };

        this.ws.onclose = () => {
            console.log('[WS] Connection closed');
            this.emit('disconnected', {});
            this.attemptReconnect(generationId);
        };

        this.ws.onerror = (error) => {
            console.error('[WS] Error:', error);
            this.emit('error', error);
        };
    }

    private attemptReconnect(generationId: string) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

            setTimeout(() => {
                this.connect(generationId);
            }, delay);
        }
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback);
    }

    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data));
    }

    send(data: any) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }

    disconnect() {
        this.ws?.close();
        this.ws = null;
        this.listeners.clear();
    }
}
