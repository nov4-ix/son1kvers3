'use client';

import React, { useState, useEffect } from 'react';
import { tokenManager } from '@/lib/TokenManager';
import { sunoService } from '@/lib/SunoService';

export default function TokenManagerComponent() {
    const [tokens, setTokens] = useState<any[]>([]);
    const [newToken, setNewToken] = useState('');
    const [validating, setValidating] = useState(false);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadTokens();

        // Auto-refresh cada 5 segundos
        const interval = setInterval(loadTokens, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadTokens = () => {
        setTokens(tokenManager.getTokens());
        setStats(tokenManager.getStats());
    };

    const handleAddToken = async () => {
        if (!newToken.trim()) return;

        setValidating(true);
        try {
            const isValid = await sunoService.validateToken(newToken.trim());

            if (!isValid) {
                alert('❌ Token inválido o expirado');
                return;
            }

            const added = tokenManager.addToken(newToken.trim(), 'manual');
            if (added) {
                setNewToken('');
                loadTokens();
                alert('✅ Token agregado exitosamente');
            } else {
                alert('⚠️ Token ya existe');
            }
        } catch (error) {
            alert('❌ Error al validar token');
        } finally {
            setValidating(false);
        }
    };

    const handleRemoveToken = (token: string) => {
        if (confirm('¿Eliminar este token?')) {
            tokenManager.removeToken(token);
            loadTokens();
        }
    };

    const handleClearAll = () => {
        if (confirm('¿Eliminar TODOS los tokens?')) {
            tokenManager.clearAllTokens();
            loadTokens();
        }
    };

    return (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">
                🔑 Gestión de Tokens JWT
            </h2>

            {/* Estadísticas */}
            {stats && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded text-center">
                        <div className="text-gray-400 text-sm">Total</div>
                        <div className="text-2xl font-bold text-white">{stats.total}</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded text-center">
                        <div className="text-gray-400 text-sm">Válidos</div>
                        <div className="text-2xl font-bold text-green-500">{stats.valid}</div>
                    </div>
                    <div className="bg-gray-800 p-4 rounded text-center">
                        <div className="text-gray-400 text-sm">Fallidos</div>
                        <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                    </div>
                </div>
            )}

            {/* Info Chrome Extension */}
            <div className="bg-blue-900/30 border border-blue-500/50 p-4 rounded mb-6">
                <p className="text-blue-200 text-sm mb-2">
                    💡 <strong>¿Tokens automáticos?</strong>
                </p>
                <ol className="text-blue-300 text-sm space-y-1 ml-4">
                    <li>1. Instala la Chrome Extension "Suno Token Captor"</li>
                    <li>2. Ve a <a href="https://suno.com/create" target="_blank" className="underline">suno.com/create</a> y haz login</li>
                    <li>3. Los tokens se capturarán automáticamente</li>
                </ol>
            </div>

            {/* Agregar Token Manual */}
            <div className="mb-6">
                <label className="block text-white mb-2 font-semibold">O agrega token manualmente:</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newToken}
                        onChange={(e) => setNewToken(e.target.value)}
                        placeholder="eyJ0eXAiOiJKV1QiLCJh..."
                        className="flex-1 bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
                    />
                    <button
                        onClick={handleAddToken}
                        disabled={validating || !newToken.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white px-6 py-2 rounded font-semibold"
                    >
                        {validating ? '⏳ Validando...' : '➕ Agregar'}
                    </button>
                </div>
            </div>

            {/* Lista de Tokens */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-white font-semibold">Tokens Guardados</h3>
                    {tokens.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="text-red-400 hover:text-red-300 text-sm"
                        >
                            🗑️ Eliminar Todos
                        </button>
                    )}
                </div>

                {tokens.length === 0 ? (
                    <div className="bg-gray-800 p-6 rounded text-center">
                        <p className="text-gray-400 mb-2">📭 No hay tokens guardados</p>
                        <p className="text-gray-500 text-sm">
                            Instala la extensión o agrega uno manualmente
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tokens.map((token, index) => (
                            <div
                                key={index}
                                className="bg-gray-800 p-3 rounded flex items-center justify-between hover:bg-gray-750 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="text-white font-mono text-sm truncate">
                                            {token.token.substring(0, 50)}...
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded ${token.source === 'extension' ? 'bg-green-900 text-green-300' :
                                                token.source === 'manual' ? 'bg-blue-900 text-blue-300' :
                                                    'bg-gray-700 text-gray-300'
                                            }`}>
                                            {token.source === 'extension' ? '🔌 Auto' : '✋ Manual'}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                        Agregado: {new Date(token.addedAt).toLocaleString()}
                                        {token.lastUsed && (
                                            <> • Último uso: {new Date(token.lastUsed).toLocaleString()}</>
                                        )}
                                        {token.failures > 0 && (
                                            <span className="text-red-400 ml-2">
                                                • ⚠️ Fallos: {token.failures}/3
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleRemoveToken(token.token)}
                                    className="ml-4 text-red-400 hover:text-red-300 px-3 py-1 rounded hover:bg-red-900/30"
                                >
                                    ❌
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
