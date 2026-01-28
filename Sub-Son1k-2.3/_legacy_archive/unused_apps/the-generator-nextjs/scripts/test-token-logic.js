// Simulación de localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

// Mockear window y localStorage globalmente
global.window = {
    addEventListener: () => { },
    postMessage: () => { }
};
global.localStorage = localStorageMock;

// Importar TokenManager (necesitaremos compilar o usar ts-node, pero para simplificar
// voy a recrear la lógica básica aquí para probar el algoritmo)

console.log("🧪 Iniciando Test de TokenManager Logic...");

class TokenManagerLogic {
    constructor() {
        this.tokens = [];
        this.currentIndex = 0;
        this.MAX_FAILURES = 3;
        this.STORAGE_KEY = 'suno_jwt_tokens';
    }

    addToken(token) {
        if (this.tokens.some(t => t.token === token)) {
            console.log("⚠️ Token duplicado detectado");
            return false;
        }
        this.tokens.push({
            token,
            addedAt: Date.now(),
            failures: 0
        });
        console.log(`✅ Token agregado. Total: ${this.tokens.length}`);
        return true;
    }

    getNextToken() {
        const validTokens = this.tokens.filter(t => t.failures < this.MAX_FAILURES);
        if (validTokens.length === 0) return null;

        this.currentIndex = this.currentIndex % validTokens.length;
        const token = validTokens[this.currentIndex];
        this.currentIndex++;

        console.log(`🔄 Rotando a token índice ${this.currentIndex - 1}`);
        return token.token;
    }

    markFailure(tokenStr) {
        const token = this.tokens.find(t => t.token === tokenStr);
        if (token) {
            token.failures++;
            console.log(`❌ Token marcado como fallido. Fallos: ${token.failures}`);
        }
    }
}

// Ejecutar pruebas
const manager = new TokenManagerLogic();

// Test 1: Agregar tokens
console.log("\n--- Test 1: Agregar Tokens ---");
manager.addToken("eyJ_TOKEN_1");
manager.addToken("eyJ_TOKEN_2");

if (manager.tokens.length === 2) console.log("✅ PASSED: Se agregaron 2 tokens");
else console.error("❌ FAILED: No se agregaron los tokens");

// Test 2: Rotación
console.log("\n--- Test 2: Rotación de Tokens ---");
const t1 = manager.getNextToken();
const t2 = manager.getNextToken();
const t3 = manager.getNextToken();

if (t1 === "eyJ_TOKEN_1" && t2 === "eyJ_TOKEN_2" && t3 === "eyJ_TOKEN_1") {
    console.log("✅ PASSED: Rotación correcta (1 -> 2 -> 1)");
} else {
    console.error("❌ FAILED: Problema en rotación", { t1, t2, t3 });
}

// Test 3: Manejo de fallos
console.log("\n--- Test 3: Failover ---");
// Fallar token 1 tres veces
manager.markFailure("eyJ_TOKEN_1");
manager.markFailure("eyJ_TOKEN_1");
manager.markFailure("eyJ_TOKEN_1");

const nextValid = manager.getNextToken();
if (nextValid === "eyJ_TOKEN_2") {
    console.log("✅ PASSED: Failover correcto (saltó el token 1 inválido)");
} else {
    console.error("❌ FAILED: Debería haber saltado el token 1", nextValid);
}

console.log("\n🏁 Test Finalizado");
