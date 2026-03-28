import React from 'react';
import { Link } from 'react-router-dom';
import { APPS_CONFIG } from '../config/apps';

export const AppNavigation: React.FC = () => {
    const primaryApps = Object.entries(APPS_CONFIG).filter(
        ([_, app]) => app.category === 'primary'
    );

    const toolApps = Object.entries(APPS_CONFIG).filter(
        ([_, app]) => app.category === 'tools' && !app.hidden
    );

    return (
        <nav className="bg-[#1e2139] border-b border-[#40FDAE]/20">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-[#40FDAE] to-[#B858FE] bg-clip-text text-transparent">
                        Son1kVers3
                    </Link>

                    {/* Primary Apps */}
                    <div className="flex gap-6">
                        {primaryApps.map(([key, app]) => (
                            app.external ? (
                                <a
                                    key={key}
                                    href={app.externalUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-gray-300 hover:text-[#40FDAE] transition-colors group relative"
                                >
                                    <span>{app.icon}</span>
                                    <span className="hidden md:inline">{app.name}</span>

                                    {/* Badge de herramientas integradas */}
                                    {key === 'generatorFull' && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#40FDAE] rounded-full animate-pulse"
                                            title="Incluye Lyric Studio + Command Palette" />
                                    )}
                                </a>
                            ) : (
                                <Link
                                    key={key}
                                    to={app.path}
                                    className="flex items-center gap-2 text-gray-300 hover:text-[#40FDAE] transition-colors"
                                >
                                    <span>{app.icon}</span>
                                    <span className="hidden md:inline">{app.name}</span>
                                </Link>
                            )
                        ))}

                        {/* Tools Dropdown */}
                        <div className="relative group">
                            <button className="flex items-center gap-2 text-gray-300 hover:text-[#40FDAE] transition-colors">
                                <span>🛠️</span>
                                <span className="hidden md:inline">Herramientas</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1e2139] border border-[#40FDAE]/20 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                                {/* Header */}
                                <div className="p-4 border-b border-[#40FDAE]/10">
                                    <h3 className="font-bold text-white text-sm">Herramientas Integradas</h3>
                                    <p className="text-xs text-gray-400 mt-1">Ya incluidas en tus apps</p>
                                </div>

                                {/* Herramientas en The Generator */}
                                <div className="p-3 bg-[#40FDAE]/5">
                                    <p className="text-xs font-bold text-[#40FDAE] mb-2">🎵 En The Generator:</p>
                                    <div className="space-y-2">
                                        <Link
                                            to="/generator"
                                            className="flex items-start gap-2 text-sm hover:bg-[#40FDAE]/10 p-2 rounded transition-colors"
                                        >
                                            <span>🎤</span>
                                            <div>
                                                <div className="font-medium text-white">Lyric Studio</div>
                                                <div className="text-xs text-gray-400">Generación de letras con IA</div>
                                            </div>
                                        </Link>
                                        <div className="flex items-start gap-2 text-sm p-2">
                                            <span>⌘</span>
                                            <div>
                                                <div className="font-medium text-white">Command Palette</div>
                                                <div className="text-xs text-gray-400">Presiona Cmd/Ctrl+K</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Herramientas Globales */}
                                <div className="p-3">
                                    <p className="text-xs font-bold text-[#B858FE] mb-2">💫 Globales:</p>
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-2 text-sm p-2">
                                            <span>💫</span>
                                            <div>
                                                <div className="font-medium text-white">Pixel Assistant</div>
                                                <div className="text-xs text-gray-400">Chat flotante siempre visible</div>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 text-sm p-2">
                                            <span>🔧</span>
                                            <div>
                                                <div className="font-medium text-white">Extension Wizard</div>
                                                <div className="text-xs text-gray-400">Configuración de tokens</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Apps Próximamente */}
                                {toolApps.filter(([_, app]) => app.comingSoon).length > 0 && (
                                    <div className="p-3 border-t border-[#40FDAE]/10 bg-black/20">
                                        <p className="text-xs font-bold text-gray-400 mb-2">🚧 Próximamente:</p>
                                        {toolApps.filter(([_, app]) => app.comingSoon).map(([key, app]) => (
                                            <div key={key} className="flex items-center gap-2 text-sm text-gray-500 p-2">
                                                <span>{app.icon}</span>
                                                <span>{app.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};
