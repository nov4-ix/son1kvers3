"""
Preprocessing Layer - Lightweight audio preprocessing
Runs on LIGHT_CPU tier before any GPU request
"""

import os
import logging
import tempfile
from typing import Dict, Any, Optional, Tuple
from pathlib import Path
import numpy as np

logger = logging.getLogger(__name__)


class AudioPreprocessor:
    """
    Lightweight audio preprocessing
    Runs before any GPU inference to optimize performance
    """

    def __init__(self, output_dir: str = '/tmp/preprocessed'):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    async def preprocess(
        self,
        audio_path: str,
        operations: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Apply preprocessing operations to audio
        """
        import librosa
        import soundfile as sf
        
        logger.info(f"Preprocessing: {audio_path}")
        
        # Load audio
        y, sr = librosa.load(audio_path, sr=None, mono=False)
        
        # Get original duration
        original_duration = len(y) / sr if y.ndim == 1 else len(y[0]) / sr
        
        results = {
            'original_path': audio_path,
            'original_sr': sr,
            'original_duration': original_duration,
            'operations_applied': []
        }
        
        # Apply operations
        if operations.get('normalize', False):
            y = self._normalize(y)
            results['operations_applied'].append('normalize')
        
        if operations.get('trim_silence', False):
            y, sr = self._trim_silence(y, sr)
            results['operations_applied'].append('trim_silence')
        
        if operations.get('convert_mono', False) and y.ndim > 1:
            y = librosa.to_mono(y)
            results['operations_applied'].append('convert_mono')
        
        if operations.get('resample'):
            target_sr = operations['resample']
            if sr != target_sr:
                y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
                sr = target_sr
                results['operations_applied'].append('resample')
        
        if operations.get('fade_in'):
            y = self._fade_in(y, sr, duration=operations.get('fade_in_duration', 0.5))
            results['operations_applied'].append('fade_in')
        
        if operations.get('fade_out'):
            y = self._fade_out(y, sr, duration=operations.get('fade_out_duration', 0.5))
            results['operations_applied'].append('fade_out')
        
        # Generate output path
        output_path = self._generate_output_path(audio_path)
        
        # Save preprocessed audio
        sf.write(output_path, y, sr)
        
        results['output_path'] = output_path
        results['output_sr'] = sr
        results['output_duration'] = len(y) / sr
        results['output_channels'] = 1 if y.ndim == 1 else y.shape[0]
        
        logger.info(f"Preprocessing complete: {len(results['operations_applied'])} operations")
        
        return results

    def _normalize(self, y: np.ndarray) -> np.ndarray:
        """Normalize audio to -1 dB"""
        import librosa
        
        # Convert to mono for normalization
        y_mono = librosa.to_mono(y) if y.ndim > 1 else y
        
        # Normalize to -1 dB
        target_db = -1.0
        current_db = 20 * np.log10(np.max(np.abs(y_mono)) + 1e-8)
        gain_db = target_db - current_db
        gain = 10 ** (gain_db / 20)
        
        # Apply gain
        y_normalized = y * gain
        
        # Clip to prevent clipping
        y_normalized = np.clip(y_normalized, -1.0, 1.0)
        
        return y_normalized

    def _trim_silence(self, y: np.ndarray, sr: int) -> Tuple[np.ndarray, int]:
        """Trim silence from beginning and end"""
        import librosa
        
        # Trim
        y_trimmed, index = librosa.effects.trim(y, top_db=20)
        
        return y_trimmed, sr

    def _fade_in(self, y: np.ndarray, sr: int, duration: float = 0.5) -> np.ndarray:
        """Apply fade in"""
        samples = int(duration * sr)
        samples = min(samples, len(y))
        
        if y.ndim == 1:
            fade = np.linspace(0, 1, samples)
            y[:samples] = y[:samples] * fade
        else:
            fade = np.linspace(0, 1, samples)
            y[:, :samples] = y[:, :samples] * fade
        
        return y

    def _fade_out(self, y: np.ndarray, sr: int, duration: float = 0.5) -> np.ndarray:
        """Apply fade out"""
        samples = int(duration * sr)
        samples = min(samples, len(y))
        
        if y.ndim == 1:
            fade = np.linspace(1, 0, samples)
            y[-samples:] = y[-samples:] * fade
        else:
            fade = np.linspace(1, 0, samples)
            y[:, -samples:] = y[:, -samples:] * fade
        
        return y

    def _generate_output_path(self, original_path: str) -> str:
        """Generate unique output path"""
        import uuid
        
        basename = os.path.basename(original_path)
        name, ext = os.path.splitext(basename)
        
        unique_id = uuid.uuid4().hex[:8]
        output_name = f"{name}_preprocessed_{unique_id}{ext}"
        
        return os.path.join(self.output_dir, output_name)

    async def get_audio_info(self, audio_path: str) -> Dict[str, Any]:
        """Get audio file information"""
        import librosa
        import soundfile as sf
        
        info = {}
        
        try:
            # Get duration
            info['duration'] = librosa.get_duration(path=audio_path)
            
            # Get sample rate
            y, sr = librosa.load(audio_path, sr=None)
            info['sample_rate'] = sr
            
            # Get channels
            info['channels'] = 1 if y.ndim == 1 else y.shape[0]
            
            # Get bit depth
            info['bit_depth'] = 16  # Assuming 16-bit for now
            
            # Get file size
            info['file_size'] = os.path.getsize(audio_path)
            
            # Check if has vocals (basic check)
            S = np.abs(librosa.stft(y))
            vocal_range_energy = np.mean(S[1:10, :])  # 80-250 Hz range
            total_energy = np.mean(S)
            info['likely_has_vocals'] = vocal_range_energy / total_energy > 0.3
            
        except Exception as e:
            logger.error(f"Error getting audio info: {e}")
            info['error'] = str(e)
        
        return info


# Singleton
_preprocessor: Optional[AudioPreprocessor] = None


def get_preprocessor() -> AudioPreprocessor:
    """Get preprocessor instance"""
    global _preprocessor
    if not _preprocessor:
        _preprocessor = AudioPreprocessor()
    return _preprocessor


# Export
export default AudioPreprocessor
