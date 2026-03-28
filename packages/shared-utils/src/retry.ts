/**
 * Retry Logic Utilities
 * Exponential backoff para polling de generaciones
 */

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: Error) => void;
}

export class RetryError extends Error {
    constructor(
        message: string,
        public attempts: number,
        public lastError: Error
    ) {
        super(message);
        this.name = 'RetryError';
    }
}

/**
 * Sleep utility
 */
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ejecuta una función con retry lógico usando exponential backoff
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 30000,
        backoffMultiplier = 2,
        onRetry
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Si es el último intento, fallar
            if (attempt === maxRetries) {
                throw new RetryError(
                    `Failed after ${maxRetries + 1} attempts: ${lastError.message}`,
                    maxRetries + 1,
                    lastError
                );
            }

            // Calcular delay con exponential backoff
            const delay = Math.min(
                initialDelay * Math.pow(backoffMultiplier, attempt),
                maxDelay
            );

            // Callback de retry
            if (onRetry) {
                onRetry(attempt + 1, lastError);
            }

            console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message);

            // Esperar antes de reintentar
            await sleep(delay);
        }
    }

    // Nunca debería llegar aquí, pero por seguridad
    throw new RetryError(
        `Failed after ${maxRetries + 1} attempts`,
        maxRetries + 1,
        lastError!
    );
}

/**
 * Polling con retry lógico y timeout
 */
export async function pollWithRetry<T>(
    pollFn: () => Promise<T | null>,
    options: {
        interval?: number;
        timeout?: number;
        retryOptions?: RetryOptions;
        onPoll?: (result: T | null, attempt: number) => void;
    } = {}
): Promise<T> {
    const {
        interval = 5000,
        timeout = 300000, // 5 minutos
        retryOptions = {},
        onPoll
    } = options;

    const startTime = Date.now();
    let attempt = 0;

    while (true) {
        attempt++;

        // Verificar timeout
        if (Date.now() - startTime > timeout) {
            throw new Error(`Polling timeout after ${timeout}ms`);
        }

        try {
            // Hacer polling con retry
            const result = await withRetry(pollFn, retryOptions);

            // Callback de polling
            if (onPoll) {
                onPoll(result, attempt);
            }

            // Si obtuvimos un resultado, retornar
            if (result !== null) {
                return result;
            }

            // Si no hay resultado, esperar y reintentar
            await sleep(interval);

        } catch (error) {
            // Si falla el retry, propagar el error
            if (error instanceof RetryError) {
                throw error;
            }
            throw error;
        }
    }
}

/**
 * Wrapper para fetch con retry
 */
export async function fetchWithRetry(
    url: string,
    options?: RequestInit,
    retryOptions?: RetryOptions
): Promise<Response> {
    return withRetry(
        async () => {
            const response = await fetch(url, options);

            // Si es un error de servidor (5xx), reintentar
            // Si es un error de cliente (4xx), no reintentar
            if (response.status >= 500) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }

            return response;
        },
        retryOptions
    );
}
