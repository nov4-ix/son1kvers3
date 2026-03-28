import { motion } from 'framer-motion';
import { 
  Music2, Mic, Volume2, Sliders, Sparkles,
  CheckCircle
} from 'lucide-react';

interface ProgressTrackerProps {
  stage: string;
  progress: number;
}

const stages = [
  { id: 'instrumental', label: 'Instrumental', icon: Music2 },
  { id: 'vocals', label: 'Vocals', icon: Mic },
  { id: 'harmonies', label: 'Harmonies', icon: Volume2 },
  { id: 'mixing', label: 'Mixing', icon: Sliders },
  { id: 'mastering', label: 'Mastering', icon: Sparkles },
  { id: 'complete', label: 'Complete', icon: CheckCircle },
];

export function ProgressTracker({ stage, progress }: ProgressTrackerProps) {
  const currentIndex = stages.findIndex(s => s.id === stage);
  
  return (
    <div className="bg-carbón rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Generating Your Music</h3>
        <span className="text-cian font-bold">{Math.round(progress)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="h-2 bg-gray-700 rounded-full mb-6 overflow-hidden">
        <motion.div 
          className="h-full bg-gradient-to-r from-cian to-magenta"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Stages */}
      <div className="grid grid-cols-6 gap-2">
        {stages.map((s, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const Icon = s.icon;
          
          return (
            <div 
              key={s.id}
              className={`
                flex flex-col items-center text-center
                ${isCompleted ? 'text-green-400' : ''}
                ${isCurrent ? 'text-cian' : ''}
                ${!isCompleted && !isCurrent ? 'text-gray-500' : ''}
              `}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center mb-1
                ${isCompleted ? 'bg-green-400/20' : ''}
                ${isCurrent ? 'bg-cian/20 animate-pulse' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-700' : ''}
              `}>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Icon className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                )}
              </div>
              <span className="text-xs">{s.label}</span>
            </div>
          );
        })}
      </div>
      
      {/* Stage Description */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {stage === 'instrumental' && '🎵 Generating instrumental track with HeartMuLa AI...'}
        {stage === 'vocals' && '🎤 Creating vocals with Bark TTS...'}
        {stage === 'harmonies' && '🎶 Adding vocal harmonies...'}
        {stage === 'mixing' && '🎛️ Professional mixing in progress...'}
        {stage === 'mastering' && '✨ Applying professional mastering (LUFS -14)...'}
        {stage === 'complete' && '✅ Your professional track is ready!'}
      </div>
    </div>
  );
}
