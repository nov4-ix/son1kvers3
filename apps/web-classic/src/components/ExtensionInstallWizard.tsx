
import React, { useState, useEffect } from 'react';
import { Download, ShieldCheck, Cpu, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ExtensionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onInstalled: () => void;
}

export const ExtensionInstallWizard: React.FC<ExtensionWizardProps> = ({ isOpen, onClose, onInstalled }) => {
    const [step, setStep] = useState(1);
    const [agreed, setAgreed] = useState(true);
    const [isChecking, setIsChecking] = useState(false);

    // Detección automática de la extensión
    useEffect(() => {
        const checkExtension = () => {
            // Buscamos la marca que deja la extensión en el DOM
            // @ts-ignore
            if (window.SON1K_EXTENSION_INSTALLED || document.getElementById('son1k-bridge-active')) {
                onInstalled();
            }
        };

        const interval = setInterval(checkExtension, 1000);
        return () => clearInterval(interval);
    }, [onInstalled]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-lg bg-[#0f111a] border border-[#40FDAE]/30 rounded-2xl shadow-[0_0_50px_rgba(64,253,174,0.1)] overflow-hidden relative">

                {/* Header Cyberpunk */}
                <div className="bg-gradient-to-r from-[#15333B] to-[#0f111a] p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <Cpu className={`w-6 h-6 ${step === 3 ? 'text-[#40FDAE]' : 'text-[#B858FE]'} animate-pulse`} />
                        <h2 className="text-xl font-bold tracking-wider text-white">
                            NEURAL BRIDGE <span className="text-[#40FDAE] text-xs align-top">v2.1</span>
                        </h2>
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h3 className="text-2xl font-light text-white mb-4">Requerimiento de Sistema</h3>
                            <p className="text-white/60 mb-6 leading-relaxed">
                                Para habilitar la generación de audio de alta fidelidad y latencia cero, esta plataforma requiere instalar el
                                <span className="text-[#40FDAE]"> Módulo de Puente Neural</span>.
                            </p>

                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                                <ul className="space-y-3">
                                    <li className="flex items-center gap-3 text-sm text-white/80">
                                        <ShieldCheck className="w-4 h-4 text-[#40FDAE]" />
                                        Generación ilimitada sin restricciones
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-white/80">
                                        <Cpu className="w-4 h-4 text-[#40FDAE]" />
                                        Aceleración por hardware distribuido
                                    </li>
                                    <li className="flex items-center gap-3 text-sm text-white/80">
                                        <AlertTriangle className="w-4 h-4 text-[#B858FE]" />
                                        Acceso a modelos experimentales (Beta)
                                    </li>
                                </ul>
                            </div>

                            <div className="flex items-start gap-3 mb-8 bg-[#171925] p-3 rounded-lg border border-white/10">
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-[#40FDAE] focus:ring-[#40FDAE]"
                                />
                                <label htmlFor="terms" className="text-xs text-white/50 cursor-pointer select-none">
                                    Acepto los Términos de Servicio y autorizo el uso de recursos locales inactivos para contribuir a la red neuronal distribuida de Son1kVers3.
                                </label>
                            </div>

                            <button
                                onClick={() => setStep(2)}
                                disabled={!agreed}
                                className="w-full bg-[#40FDAE] hover:bg-[#32c98a] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Iniciar Configuración <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                            <h3 className="text-xl font-bold text-white mb-2">Instalación del Módulo</h3>
                            <p className="text-sm text-white/50 mb-6">Sigue estos pasos para activar el puente.</p>

                            <div className="space-y-4 mb-8">
                                <a
                                    href="/son1k-engine-v2.2.zip"
                                    download="Son1k_Neural_Bridge_v2.2.zip"
                                    className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#40FDAE]/50 transition-colors cursor-pointer group no-underline"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#40FDAE]/20 flex items-center justify-center text-[#40FDAE] font-bold">1</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white group-hover:text-[#40FDAE]">Descargar Paquete</h4>
                                        <p className="text-xs text-white/40">Son1k_Engine_v2.2.zip</p>
                                    </div>
                                    <Download className="w-5 h-5 text-white/50 group-hover:text-[#40FDAE]" />
                                </a>

                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/50 font-bold">2</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-white">Arrastrar a Extensiones</h4>
                                        <p className="text-xs text-white/40">Abre chrome://extensions y suelta el archivo</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center p-4">
                                {isChecking ? (
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 border-2 border-[#40FDAE] border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-xs text-[#40FDAE] animate-pulse">Esperando señal del puente...</p>
                                        </div>

                                        {/* Fallback button after delay */}
                                        {/* Fallback button after delay */}
                                        <button
                                            onClick={onInstalled}
                                            className="bg-[#1C232E] border border-white/20 text-white text-sm px-4 py-2 rounded-lg hover:bg-white/10 transition-colors mt-4 w-full"
                                        >
                                            La extensión está instalada (Continuar)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={() => setIsChecking(true)}
                                            className="text-[#40FDAE] text-sm hover:underline font-medium"
                                        >
                                            Verificar instalación nuevamente
                                        </button>
                                        <button
                                            onClick={() => window.location.reload()}
                                            className="text-white/40 text-xs hover:text-white flex items-center gap-1"
                                        >
                                            ¿No funciona? Prueba recargar la página
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
