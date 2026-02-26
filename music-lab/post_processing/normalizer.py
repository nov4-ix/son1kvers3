"""
Normalizer
LUFS normalization and true peak limiting
"""

import numpy as np
from typing import Tuple, Optional
import pyloudnorm

from config import AUDIO_CONFIG
from utils.logging import setup_logger

logger = setup_logger("Normalizer")


class Normalizer:
    def __init__(
        self,
        target_lufs: float = None,
        true_peak_db: float = None,
        sample_rate: int = None,
    ):
        self.target_lufs = target_lufs or AUDIO_CONFIG["target_lufs"]
        self.true_peak_db = true_peak_db or AUDIO_CONFIG["true_peak_db"]
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]

        logger.info(
            f"Normalizer initialized: target={self.target_lufs} LUFS, TP={self.true_peak_db}dB"
        )

    def normalize(self, audio: np.ndarray) -> Tuple[np.ndarray, dict]:
        if audio.ndim == 2:
            audio_for_meter = audio.T
        else:
            audio_for_meter = audio.reshape(-1, 1)

        meter = pyloudnorm.Meter(self.sample_rate)

        try:
            current_lufs = meter.integrated_loudness(audio_for_meter)
        except Exception as e:
            logger.warning(f"Could not measure LUFS: {e}, using fallback")
            current_lufs = self._estimate_loudness(audio)

        if np.isinf(current_lufs) or np.isnan(current_lufs):
            logger.warning(
                "Invalid LUFS measurement, normalizing to -23 LUFS equivalent"
            )
            current_lufs = -23

        gain_db = self.target_lufs - current_lufs
        gain_linear = 10 ** (gain_db / 20)

        normalized = audio * gain_linear

        metrics = {
            "input_lufs": float(current_lufs),
            "target_lufs": self.target_lufs,
            "gain_applied_db": float(gain_db),
        }

        normalized = self._apply_true_peak_limit(normalized)

        final_lufs = meter.integrated_loudness(
            normalized.T if normalized.ndim == 2 else normalized.reshape(-1, 1)
        )
        metrics["output_lufs"] = (
            float(final_lufs) if not np.isinf(final_lufs) else self.target_lufs
        )

        logger.info(
            f"Normalized: {current_lufs:.1f} LUFS -> {metrics['output_lufs']:.1f} LUFS "
            f"(gain: {gain_db:+.1f}dB)"
        )

        return normalized, metrics

    def _apply_true_peak_limit(self, audio: np.ndarray) -> np.ndarray:
        true_peak_linear = 10 ** (self.true_peak_db / 20)

        if audio.ndim == 2:
            peak = np.max(np.abs(audio))
        else:
            peak = np.max(np.abs(audio))

        if peak > true_peak_linear:
            audio = self._soft_clip(audio, true_peak_linear)
            logger.info(
                f"Applied true peak limiting: {20 * np.log10(peak):.1f}dB -> {self.true_peak_db}dB"
            )

        return audio

    def _soft_clip(self, audio: np.ndarray, threshold: float) -> np.ndarray:
        x = audio / threshold

        x_clipped = np.tanh(x * 1.5) / 1.5

        return x_clipped * threshold

    def _estimate_loudness(self, audio: np.ndarray) -> float:
        rms = np.sqrt(np.mean(audio**2))
        if rms > 0:
            return 20 * np.log10(rms) + 10
        return -70


def normalize_audio(
    audio: np.ndarray, target_lufs: float = -14.0, true_peak_db: float = -1.0
) -> Tuple[np.ndarray, dict]:
    normalizer = Normalizer(target_lufs=target_lufs, true_peak_db=true_peak_db)
    return normalizer.normalize(audio)
