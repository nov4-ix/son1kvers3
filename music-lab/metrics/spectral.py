"""
Spectral Metrics
Spectral centroid, bandwidth, and dynamic range analysis
"""

import numpy as np
from scipy import signal
from typing import Dict, Tuple, Optional
import librosa

from config import AUDIO_CONFIG
from utils.logging import setup_logger

logger = setup_logger("SpectralMetrics")


class SpectralAnalyzer:
    def __init__(self, sample_rate: int = None):
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]

    def analyze(self, audio: np.ndarray) -> Dict[str, float]:
        if audio.ndim == 2:
            audio_mono = np.mean(audio, axis=0)
        else:
            audio_mono = audio

        metrics = {}

        metrics["spectral_centroid_hz"] = self._calculate_centroid(audio_mono)
        metrics["spectral_bandwidth_hz"] = self._calculate_bandwidth(audio_mono)
        metrics["spectral_rolloff_hz"] = self._calculate_rolloff(audio_mono)
        metrics["spectral_flatness"] = self._calculate_flatness(audio_mono)
        metrics["spectral_contrast_db"] = self._calculate_contrast(audio_mono)

        metrics["dynamic_range_db"] = self._calculate_dynamic_range(audio)
        metrics["zero_crossing_rate"] = self._calculate_zcr(audio_mono)

        metrics.update(self._analyze_frequency_bands(audio_mono))

        logger.info(
            f"Spectral: centroid={metrics['spectral_centroid_hz']:.0f}Hz, "
            f"bandwidth={metrics['spectral_bandwidth_hz']:.0f}Hz, "
            f"DR={metrics['dynamic_range_db']:.1f}dB"
        )

        return metrics

    def _calculate_centroid(self, audio: np.ndarray) -> float:
        try:
            centroid = librosa.feature.spectral_centroid(
                y=audio, sr=self.sample_rate, n_fft=2048, hop_length=512
            )
            return float(np.mean(centroid))
        except Exception as e:
            logger.warning(f"Centroid calculation failed: {e}")
            return 0.0

    def _calculate_bandwidth(self, audio: np.ndarray) -> float:
        try:
            bandwidth = librosa.feature.spectral_bandwidth(
                y=audio, sr=self.sample_rate, n_fft=2048, hop_length=512
            )
            return float(np.mean(bandwidth))
        except Exception as e:
            logger.warning(f"Bandwidth calculation failed: {e}")
            return 0.0

    def _calculate_rolloff(
        self, audio: np.ndarray, roll_percent: float = 0.85
    ) -> float:
        try:
            rolloff = librosa.feature.spectral_rolloff(
                y=audio,
                sr=self.sample_rate,
                n_fft=2048,
                hop_length=512,
                roll_percent=roll_percent,
            )
            return float(np.mean(rolloff))
        except Exception as e:
            logger.warning(f"Rolloff calculation failed: {e}")
            return 0.0

    def _calculate_flatness(self, audio: np.ndarray) -> float:
        try:
            flatness = librosa.feature.spectral_flatness(
                y=audio, n_fft=2048, hop_length=512
            )
            return float(np.mean(flatness))
        except Exception as e:
            logger.warning(f"Flatness calculation failed: {e}")
            return 0.0

    def _calculate_contrast(self, audio: np.ndarray) -> float:
        try:
            contrast = librosa.feature.spectral_contrast(
                y=audio, sr=self.sample_rate, n_fft=2048, hop_length=512
            )
            return float(np.mean(contrast))
        except Exception as e:
            logger.warning(f"Contrast calculation failed: {e}")
            return 0.0

    def _calculate_dynamic_range(self, audio: np.ndarray) -> float:
        if audio.ndim == 2:
            audio = np.mean(audio, axis=0)

        block_size = int(self.sample_rate * 0.1)
        num_blocks = max(1, len(audio) // block_size)

        block_rms = []
        for i in range(num_blocks):
            block = audio[i * block_size : (i + 1) * block_size]
            if len(block) > 0:
                rms = np.sqrt(np.mean(block**2))
                if rms > 0:
                    block_rms.append(rms)

        if len(block_rms) < 2:
            return 0.0

        max_rms = np.percentile(block_rms, 95)
        min_rms = np.percentile(block_rms, 5)

        if min_rms > 0:
            return float(20 * np.log10(max_rms / min_rms))
        return 0.0

    def _calculate_zcr(self, audio: np.ndarray) -> float:
        try:
            zcr = librosa.feature.zero_crossing_rate(audio)
            return float(np.mean(zcr))
        except Exception as e:
            logger.warning(f"ZCR calculation failed: {e}")
            return 0.0

    def _analyze_frequency_bands(self, audio: np.ndarray) -> Dict[str, float]:
        nyquist = self.sample_rate / 2

        bands = {
            "sub_bass": (20, 60),
            "bass": (60, 250),
            "low_mid": (250, 500),
            "mid": (500, 2000),
            "high_mid": (2000, 4000),
            "presence": (4000, 6000),
            "brilliance": (6000, 20000),
        }

        total_energy = np.sum(audio**2)
        band_energies = {}

        for band_name, (low, high) in bands.items():
            low_norm = low / nyquist
            high_norm = min(high / nyquist, 0.99)

            if low_norm >= 1.0 or high_norm > 1.0:
                continue

            try:
                b, a = signal.butter(4, [low_norm, high_norm], btype="band")
                filtered = signal.filtfilt(b, a, audio)
                band_energy = np.sum(filtered**2)

                if total_energy > 0:
                    band_energies[f"{band_name}_energy_ratio"] = float(
                        band_energy / total_energy
                    )
                else:
                    band_energies[f"{band_name}_energy_ratio"] = 0.0
            except Exception:
                band_energies[f"{band_name}_energy_ratio"] = 0.0

        return band_energies


def analyze_spectral(audio: np.ndarray, sample_rate: int = None) -> Dict[str, float]:
    analyzer = SpectralAnalyzer(sample_rate)
    return analyzer.analyze(audio)
