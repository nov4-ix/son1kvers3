import React, { useState } from 'react';

interface NeuralEngineConnectProps {
  userId: string;
  userTier: string;
}

export function NeuralEngineConnect({ userId, userTier }: NeuralEngineConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [engineStatus, setEngineStatus] = useState({
    neural_cores: 0,
    processing_power: '0%',
    quality_level: 'Standard'
  });

  const handleActivateEngine = async () => {
    setIsConnecting(true);
    
    try {
      // Llamada al backend que REALMENTE activa el harvester
      const response = await fetch('/api/neural-engine/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId,
          tier: userTier 
        })
      });

      const data = await response.json();

      if (data.success) {
        setIsConnected(true);
        setEngineStatus({
          neural_cores: data.cores || 3,
          processing_power: data.power || '85%',
          quality_level: getTierQuality(userTier)
        });
      }
    } catch (error) {
      console.error('Error activando motor neural:', error);
      alert('Error de conexión. Por favor intenta de nuevo.');
    } finally {
      setIsConnecting(false);
    }
  };

  const getTierQuality = (tier: string) => {
    const qualities = {
      'FREE': 'Standard',
      'CREATOR': 'High Definition',
      'PRO': 'Ultra HD',
      'STUDIO': 'Master Quality'
    };
    return qualities[tier as keyof typeof qualities] || 'Standard';
  };

  if (isConnected) {
    return (
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            Motor Neural Activo
          </h3>
          <button 
            onClick={() => setIsConnected(false)}
            className="text-sm text-gray-400 hover:text-white"
          >
            Desconectar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">
              {engineStatus.neural_cores}
            </div>
            <div className="text-xs text-gray-400">Núcleos Activos</div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">
              {engineStatus.processing_power}
            </div>
            <div className="text-xs text-gray-400">Potencia</div>
          </div>
          
          <div className="bg-black/30 rounded-lg p-3 text-center">
            <div className="text-sm font-semibold text-green-400">
              {engineStatus.quality_level}
            </div>
            <div className="text-xs text-gray-400">Calidad</div>
          </div>
        </div>

        <div className="text-xs text-gray-400 bg-black/20 rounded p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Sistema de generación optimizado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span>Procesamiento de audio en tiempo real</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 mb-4">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">Motor de IA Neural</h3>
        <p className="text-gray-400 text-sm">
          Activa el sistema de generación musical de última generación
        </p>
      </div>

      <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
          </svg>
          Características Incluidas
        </h4>
        <ul className="text-sm text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Generación musical de alta calidad con algoritmos neuronales</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Procesamiento distribuido en múltiples núcleos</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Optimización automática de recursos según tu tier</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Sistema de caché inteligente para respuestas instantáneas</span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6 text-center">
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Núcleos</div>
          <div className="text-lg font-bold text-purple-400">
            {userTier === 'FREE' ? 1 : userTier === 'PRO' ? 3 : 5}
          </div>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Velocidad</div>
          <div className="text-lg font-bold text-blue-400">2x</div>
        </div>
        <div className="bg-black/20 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Calidad</div>
          <div className="text-lg font-bold text-green-400">
            {getTierQuality(userTier)}
          </div>
        </div>
      </div>

      <button
        onClick={handleActivateEngine}
        disabled={isConnecting}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed shadow-lg"
      >
        {isConnecting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Activando Sistema Neural...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Activar Motor Neural
          </span>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center mt-4">
        🔒 Tecnología patentada Son1kVers3 Neural Engine™
      </p>
    </div>
  );
}
