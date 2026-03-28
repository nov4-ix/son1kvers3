"""
Loudness Metrics
LUFS, RMS, and peak level measurements
"""

import numpy as np
from typing import Dict, Tuple, Optional
import pyloudnorm

from config import AUDIO_CONFIG
from utils.logging import setup_logger

logger = setup_logger("LoudnessMetrics")


class LoudnessAnalyzer:
    def __init__(self, sample_rate: int = None):
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]
        self.meter = pyloudnorm.Meter(self.sample_rate)

    def analyze(self, audio: np.ndarray) -> Dict[str, float]:
        if audio.ndim == 2:
            audio_mono = audio.T
        else:
            audio_mono = audio.reshape(-1, 1)

        metrics = {}

        try:
            lufs = self.meter.integrated_loudness(audio_mono)
            metrics["integrated_lufs"] = float(lufs) if not np.isinf(lufs) else -70.0
        except Exception as e:
            logger.warning(f"LUFS measurement failed: {e}")
            metrics["integrated_lufs"] = -70.0

        metrics["rms_db"] = self._calculate_rms(audio)
        metrics["peak_db"] = self._calculate_peak(audio)
        metrics["crest_factor_db"] = metrics["peak_db"] - metrics["rms_db"]

        metrics["lufs_range"] = self._calculate_loudness_range(audio_mono)

        logger.info(
            f"Loudness: {metrics['integrated_lufs']:.1f} LUFS, "
            f"RMS: {metrics['rms_db']:.1f}dB, Peak: {metrics['peak_db']:.1f}dB"
        )

        return metrics

    def _calculate_rms(self, audio: np.ndarray) -> float:
        rms = np.sqrt(np.mean(audio**2))
        if rms > 0:
            return float(20 * np.log10(rms))
        return -100.0

    def _calculate_peak(self, audio: np.ndarray) -> float:
        peak = np.max(np.abs(audio))
        if peak > 0:
            return float(20 * np.log10(peak))
        return -100.0

    def _calculate_loudness_range(self, audio: np.ndarray) -> float:
        try:
            if audio.ndim == 2:
                audio = audio.T

            block_size = int(self.sample_rate * 0.4)
            num_blocks = len(audio) // block_size

            if num_blocks < 2:
                return 0.0

            block_loudness = []
            for i in range(num_blocks):
                block = audio[i * block_size : (i + 1) * block_size]
                if block.shape[0] > 0:
                    try:
                        lufs = self.meter.integrated_loudness(block)
                        if not np.isinf(lufs) and not np.isnan(lufs):
                            block_loudness.append(lufs)
                    except:
                        pass

            if len(block_loudness) < 2:
                return 0.0

            loudness_range = np.percentile(block_loudness, 95) - np.percentile(
                block_loudness, 10
            )
            return float(loudness_range)

        except Exception as e:
            logger.warning(f"Loudness range calculation failed: {e}")
            return 0.0


def analyze_loudness(audio: np.ndarray, sample_rate: int = None) -> Dict[str, float]:
    analyzer = LoudnessAnalyzer(sample_rate)
    return analyzer.analyze(audio)
