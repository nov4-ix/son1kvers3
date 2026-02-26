"""
Stereo Enhancer
Stereo width enhancement and harmonic excitation
"""

import numpy as np
from scipy import signal
from typing import Tuple, Dict, Optional

from config import MASTERING_CONFIG, AUDIO_CONFIG
from utils.logging import setup_logger

logger = setup_logger("StereoEnhancer")


class StereoEnhancer:
    def __init__(self, sample_rate: int = None, config: Dict = None):
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]
        self.config = config or MASTERING_CONFIG["stereo_enhancer"]

        self.width_factor = self.config.get("width_factor", 1.2)
        self.harmonic_excitation = self.config.get("harmonic_excitation", True)
        self.excitation_mix = self.config.get("excitation_mix", 0.15)

        logger.info(f"Stereo Enhancer initialized")
        logger.info(f"  Width factor: {self.width_factor}")
        logger.info(
            f"  Harmonic excitation: {self.harmonic_excitation} (mix: {self.excitation_mix})"
        )

    def enhance(self, audio: np.ndarray) -> Tuple[np.ndarray, Dict]:
        if audio.ndim != 2 or audio.shape[0] != 2:
            if audio.ndim == 1:
                audio = np.stack([audio, audio])
            else:
                audio = audio[:2]

        metrics = {}

        initial_width = self._measure_stereo_width(audio)

        enhanced = self._apply_width(audio, self.width_factor)

        if self.harmonic_excitation:
            enhanced = self._apply_harmonic_excitation(enhanced, self.excitation_mix)

        final_width = self._measure_stereo_width(enhanced)

        metrics["initial_width"] = float(initial_width)
        metrics["final_width"] = float(final_width)
        metrics["width_factor_applied"] = self.width_factor
        metrics["harmonic_excitation"] = self.harmonic_excitation

        logger.info(f"Stereo width: {initial_width:.2f} -> {final_width:.2f}")

        return enhanced, metrics

    def _apply_width(self, audio: np.ndarray, width: float) -> np.ndarray:
        mid = (audio[0] + audio[1]) / 2
        side = (audio[0] - audio[1]) / 2

        side = side * width

        left = mid + side
        right = mid - side

        enhanced = np.stack([left, right])

        max_val = np.max(np.abs(enhanced))
        if max_val > 1.0:
            enhanced = enhanced / max_val * 0.99

        return enhanced

    def _apply_harmonic_excitation(self, audio: np.ndarray, mix: float) -> np.ndarray:
        highpass_freq = 5000
        nyquist = self.sample_rate / 2
        cutoff = min(highpass_freq / nyquist, 0.49)

        b, a = signal.butter(2, cutoff, btype="high")

        high_freq = np.array(
            [signal.filtfilt(b, a, audio[0]), signal.filtfilt(b, a, audio[1])]
        )

        harmonics = self._generate_harmonics(high_freq)

        excited = audio + harmonics * mix

        max_val = np.max(np.abs(excited))
        if max_val > 1.0:
            excited = excited / max_val * 0.99

        return excited

    def _generate_harmonics(self, signal_band: np.ndarray) -> np.ndarray:
        harmonics = np.tanh(signal_band * 3) * 0.3

        harmonics = np.sign(harmonics) * (np.abs(harmonics) ** 0.8)

        return harmonics

    def _measure_stereo_width(self, audio: np.ndarray) -> float:
        if audio.ndim != 2 or audio.shape[0] != 2:
            return 0.0

        left = audio[0]
        right = audio[1]

        left_power = np.mean(left**2)
        right_power = np.mean(right**2)
        sum_signal = left + right
        diff_signal = left - right

        sum_power = np.mean(sum_signal**2)
        diff_power = np.mean(diff_signal**2)

        if sum_power > 0:
            width = np.sqrt(diff_power / sum_power)
        else:
            width = 0.0

        return min(width, 2.0)


def enhance_stereo(
    audio: np.ndarray, width_factor: float = 1.2, harmonic_excitation: bool = True
) -> Tuple[np.ndarray, Dict]:
    config = {
        "width_factor": width_factor,
        "harmonic_excitation": harmonic_excitation,
    }
    enhancer = StereoEnhancer(config=config)
    return enhancer.enhance(audio)
