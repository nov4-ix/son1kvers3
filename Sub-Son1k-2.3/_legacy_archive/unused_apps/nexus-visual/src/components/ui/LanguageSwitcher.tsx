import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'es' : 'en';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors group"
        >
            <Globe size={14} className="text-gray-400 group-hover:text-neon-cyan transition-colors" />
            <span className="text-xs font-mono text-gray-300 group-hover:text-white">
                {i18n.language === 'en' ? 'EN' : 'ES'}
            </span>
        </button>
    );
}
