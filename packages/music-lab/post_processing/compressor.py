"""
Compressor
Multiband dynamic range compression
"""

import numpy as np
from scipy import signal
from typing import Tuple, Dict, Optional, List

from config import MASTERING_CONFIG, AUDIO_CONFIG
from utils.logging import setup_logger

logger = setup_logger("Compressor")


class MultibandCompressor:
    def __init__(self, sample_rate: int = None, config: Dict = None):
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]
        self.config = config or MASTERING_CONFIG["compressor"]

        self.crossover_freqs = [200, 2000]

        self.low_threshold = self.config["low_threshold_db"]
        self.low_ratio = self.config["low_ratio"]
        self.mid_threshold = self.config["mid_threshold_db"]
        self.mid_ratio = self.config["mid_ratio"]
        self.high_threshold = self.config["high_threshold_db"]
        self.high_ratio = self.config["high_ratio"]

        self.attack_ms = self.config["attack_ms"]
        self.release_ms = self.config["release_ms"]

        logger.info(f"Multiband Compressor initialized")
        logger.info(f"  Low: {self.low_threshold}dB @ {self.low_ratio}:1")
        logger.info(f"  Mid: {self.mid_threshold}dB @ {self.mid_ratio}:1")
        logger.info(f"  High: {self.high_threshold}dB @ {self.high_ratio}:1")

    def compress(self, audio: np.ndarray) -> Tuple[np.ndarray, Dict]:
        if audio.ndim != 2:
            audio = np.stack([audio, audio])

        bands = self._split_bands(audio)

        compressed_bands = []
        metrics = {"bands": {}}

        for i, (band_name, band_audio) in enumerate(bands.items()):
            if i == 0:
                threshold = self.low_threshold
                ratio = self.low_ratio
            elif i == 1:
                threshold = self.mid_threshold
                ratio = self.mid_ratio
            else:
                threshold = self.high_threshold
                ratio = self.high_ratio

            compressed, band_metrics = self._compress_band(
                band_audio, threshold, ratio, band_name
            )
            compressed_bands.append(compressed)
            metrics["bands"][band_name] = band_metrics

        output = self._sum_bands(compressed_bands)

        metrics["gain_reduction"] = self._calculate_gain_reduction(audio, output)

        logger.info(
            f"Compression complete: {metrics['gain_reduction']:.1f}dB gain reduction"
        )

        return output, metrics

    def _split_bands(self, audio: np.ndarray) -> Dict[str, np.ndarray]:
        nyquist = self.sample_rate / 2

        low_cutoff = min(self.crossover_freqs[0] / nyquist, 0.49)
        high_cutoff = min(self.crossover_freqs[1] / nyquist, 0.49)

        b_low, a_low = signal.butter(4, low_cutoff, btype="low")
        b_mid_low, a_mid_low = signal.butter(4, low_cutoff, btype="high")
        b_mid_high, a_mid_high = signal.butter(4, high_cutoff, btype="low")
        b_high, a_high = signal.butter(4, high_cutoff, btype="high")

        low_band = np.array(
            [
                signal.filtfilt(b_low, a_low, audio[0]),
                signal.filtfilt(b_low, a_low, audio[1]),
            ]
        )

        mid_band = np.array(
            [
                signal.filtfilt(b_mid_low, a_mid_low, audio[0]),
                signal.filtfilt(b_mid_low, a_mid_low, audio[1]),
            ]
        )
        mid_band = np.array(
            [
                signal.filtfilt(b_mid_high, a_mid_high, mid_band[0]),
                signal.filtfilt(b_mid_high, a_mid_high, mid_band[1]),
            ]
        )

        high_band = np.array(
            [
                signal.filtfilt(b_high, a_high, audio[0]),
                signal.filtfilt(b_high, a_high, audio[1]),
            ]
        )

        return {"low": low_band, "mid": mid_band, "high": high_band}

    def _compress_band(
        self, audio: np.ndarray, threshold_db: float, ratio: float, band_name: str
    ) -> Tuple[np.ndarray, Dict]:
        attack_samples = int(self.attack_ms * self.sample_rate / 1000)
        release_samples = int(self.release_ms * self.sample_rate / 1000)

        threshold_linear = 10 ** (threshold_db / 20)

        envelope = self._compute_envelope(audio, attack_samples, release_samples)

        gain = np.ones_like(envelope)
        above_threshold = envelope > threshold_linear

        if np.any(above_threshold):
            excess_db = 20 * np.log10(envelope[above_threshold] / threshold_linear)
            compressed_excess_db = excess_db / ratio
            gain[above_threshold] = 10 ** (-excess_db / 20 + compressed_excess_db / 20)

        compressed = audio * gain

        gain_reduction = 20 * np.log10(np.mean(gain))

        return compressed, {
            "threshold_db": threshold_db,
            "ratio": ratio,
            "gain_reduction_db": float(gain_reduction),
        }

    def _compute_envelope(
        self, audio: np.ndarray, attack_samples: int, release_samples: int
    ) -> np.ndarray:
        if audio.ndim == 2:
            mono = np.max(np.abs(audio), axis=0)
        else:
            mono = np.abs(audio)

        envelope = np.zeros_like(mono)
        envelope[0] = mono[0]

        attack_coeff = 1.0 - np.exp(-1.0 / attack_samples)
        release_coeff = 1.0 - np.exp(-1.0 / release_samples)

        for i in range(1, len(mono)):
            if mono[i] > envelope[i - 1]:
                envelope[i] = envelope[i - 1] + attack_coeff * (
                    mono[i] - envelope[i - 1]
                )
            else:
                envelope[i] = envelope[i - 1] - release_coeff * (
                    envelope[i - 1] - mono[i]
                )

        return envelope

    def _sum_bands(self, bands: List[np.ndarray]) -> np.ndarray:
        return np.sum(bands, axis=0)

    def _calculate_gain_reduction(
        self, input_audio: np.ndarray, output_audio: np.ndarray
    ) -> float:
        input_rms = np.sqrt(np.mean(input_audio**2))
        output_rms = np.sqrt(np.mean(output_audio**2))

        if output_rms > 0 and input_rms > 0:
            return 20 * np.log10(output_rms / input_rms)
        return 0.0


def compress_audio(audio: np.ndarray, config: Dict = None) -> Tuple[np.ndarray, Dict]:
    compressor = MultibandCompressor(config=config)
    return compressor.compress(audio)
