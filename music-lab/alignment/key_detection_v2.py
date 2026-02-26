"""
Robust Key Detection Module v2
Multi-method ensemble key detection with confidence scoring

This module provides production-grade key detection using multiple
algorithms combined through weighted voting for maximum reliability.

Methods:
1. Krumhansl-Schmuckler correlation
2. Template matching with temporal windows
3. Harmonic Pitch Class Profile (HPCP)
"""

import numpy as np
import librosa
from scipy.stats import mode
from typing import Dict, Tuple, List, Optional
from dataclasses import dataclass


@dataclass
class KeyDetectionResult:
    """Result of key detection analysis."""

    key_index: int
    key_name: str
    mode: str  # 'major' or 'minor'
    confidence: float
    method_results: Dict[str, Dict]


# Krumhansl-Schmuckler key profiles (empirically derived)
MAJOR_PROFILE = np.array(
    [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
    dtype=np.float32,
)

MINOR_PROFILE = np.array(
    [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
    dtype=np.float32,
)

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


class RobustKeyDetector:
    """
    Production-grade key detection using ensemble methods.

    Combines multiple detection algorithms for robust key identification
    with confidence scoring.

    Example:
        >>> detector = RobustKeyDetector()
        >>> result = detector.detect_key('song.wav')
        >>> print(f"Key: {result.key_name} ({result.mode})")
        >>> print(f"Confidence: {result.confidence:.2f}")
    """

    def __init__(
        self,
        sr: int = 44100,
        analysis_duration: float = 30.0,
        min_confidence: float = 0.5,
    ):
        """
        Initialize the robust key detector.

        Args:
            sr: Sample rate for analysis
            analysis_duration: Maximum duration to analyze (seconds)
            min_confidence: Minimum confidence threshold for detection
        """
        self.sr = sr
        self.analysis_duration = analysis_duration
        self.min_confidence = min_confidence

        self.major_profile = MAJOR_PROFILE / np.sum(MAJOR_PROFILE)
        self.minor_profile = MINOR_PROFILE / np.sum(MINOR_PROFILE)

    def detect_key(self, y: np.ndarray, sr: Optional[int] = None) -> KeyDetectionResult:
        """
        Detect musical key using ensemble of methods.

        Args:
            y: Audio time series (file path or numpy array)
            sr: Sample rate (uses self.sr if not specified)

        Returns:
            KeyDetectionResult with key, mode, and confidence
        """
        sr = sr or self.sr

        if y.ndim == 2:
            y = np.mean(y, axis=0)

        y = y.astype(np.float32)

        if len(y) > int(self.analysis_duration * sr):
            y = y[: int(self.analysis_duration * sr)]

        ks_result = self._krumhansl_schmuckler(y, sr)
        tm_result = self._template_matching(y, sr)
        hpcp_result = self._hpcp_method(y, sr)

        keys = [ks_result["key"], tm_result["key"], hpcp_result["key"]]
        modes = [ks_result["mode"], tm_result["mode"], hpcp_result["mode"]]
        confidences = [
            ks_result["confidence"],
            tm_result["confidence"],
            hpcp_result["confidence"],
        ]

        final_key = self._weighted_vote(keys, confidences)
        final_mode = mode(modes).mode[0] if len(modes) > 0 else "major"

        weights = np.array(confidences)
        weights = weights / (np.sum(weights) + 1e-8)

        key_scores = np.zeros(12)
        for k, w in zip(keys, weights):
            key_scores[k] += w
        final_confidence = float(key_scores[final_key])

        final_key_name = self._key_to_name(final_key, final_mode)

        return KeyDetectionResult(
            key_index=final_key,
            key_name=final_key_name,
            mode=final_mode,
            confidence=final_confidence,
            method_results={
                "krumhansl_schmuckler": ks_result,
                "template_matching": tm_result,
                "hpcp": hpcp_result,
            },
        )

    def _krumhansl_schmuckler(self, y: np.ndarray, sr: int) -> Dict:
        """
        Krumhansl-Schmuckler key-finding algorithm.

        Uses correlation with empirically-derived key profiles.
        """
        y_harmonic = librosa.effects.harmonic(y)

        chroma = librosa.feature.chroma_cqt(
            y=y_harmonic, sr=sr, hop_length=512, n_chroma=12, norm=2
        )

        chroma_mean = np.mean(chroma, axis=1)
        chroma_mean = chroma_mean / (np.sum(chroma_mean) + 1e-8)

        correlations_major = []
        correlations_minor = []

        for i in range(12):
            major_rotated = np.roll(self.major_profile, i)
            minor_rotated = np.roll(self.minor_profile, i)

            corr_major = np.corrcoef(chroma_mean, major_rotated)[0, 1]
            corr_minor = np.corrcoef(chroma_mean, minor_rotated)[0, 1]

            if np.isnan(corr_major):
                corr_major = 0.0
            if np.isnan(corr_minor):
                corr_minor = 0.0

            correlations_major.append(corr_major)
            correlations_minor.append(corr_minor)

        best_major_idx = int(np.argmax(correlations_major))
        best_minor_idx = int(np.argmax(correlations_minor))
        best_major_corr = float(correlations_major[best_major_idx])
        best_minor_corr = float(correlations_minor[best_minor_idx])

        if best_major_corr > best_minor_corr:
            return {
                "key": best_major_idx,
                "mode": "major",
                "confidence": max(0, best_major_corr),
                "raw_correlations": {
                    "major": correlations_major,
                    "minor": correlations_minor,
                },
            }
        else:
            return {
                "key": best_minor_idx,
                "mode": "minor",
                "confidence": max(0, best_minor_corr),
                "raw_correlations": {
                    "major": correlations_major,
                    "minor": correlations_minor,
                },
            }

    def _template_matching(self, y: np.ndarray, sr: int) -> Dict:
        """
        Template matching with temporal window analysis.

        Analyzes multiple windows and aggregates results.
        """
        window_size = sr * 5
        hop_size = sr * 2

        if len(y) < window_size:
            window_size = len(y)
            hop_size = window_size // 2

        keys = []
        modes = []

        for start in range(0, len(y) - window_size + 1, hop_size):
            window = y[start : start + window_size]

            chroma = librosa.feature.chroma_stft(y=window, sr=sr, hop_length=512)
            chroma_mean = np.mean(chroma, axis=1)

            key = int(np.argmax(chroma_mean))

            third_major = (key + 4) % 12
            third_minor = (key + 3) % 12

            if chroma_mean[third_major] > chroma_mean[third_minor]:
                detected_mode = "major"
            else:
                detected_mode = "minor"

            keys.append(key)
            modes.append(detected_mode)

        if not keys:
            return {"key": 0, "mode": "major", "confidence": 0.0}

        final_key = int(mode(keys).mode[0])
        final_mode = str(mode(modes).mode[0])

        key_agreement = sum(1 for k in keys if k == final_key) / len(keys)

        return {
            "key": final_key,
            "mode": final_mode,
            "confidence": key_agreement,
            "window_count": len(keys),
        }

    def _hpcp_method(self, y: np.ndarray, sr: int) -> Dict:
        """
        Harmonic Pitch Class Profile method.

        Uses high-resolution CQT for better frequency resolution.
        """
        C = np.abs(librosa.cqt(y, sr=sr, hop_length=512, n_bins=84))

        chroma = librosa.feature.chroma_cqt(C=C, sr=sr)

        energy = np.sum(C, axis=0)
        if np.sum(energy) > 0:
            weights = energy / np.sum(energy)
            chroma_weighted = chroma * weights[np.newaxis, :]
            chroma_mean = np.sum(chroma_weighted, axis=1)
        else:
            chroma_mean = np.mean(chroma, axis=1)

        chroma_mean = chroma_mean / (np.sum(chroma_mean) + 1e-8)

        key = int(np.argmax(chroma_mean))

        third_major = (key + 4) % 12
        third_minor = (key + 3) % 12

        if chroma_mean[third_major] > chroma_mean[third_minor]:
            detected_mode = "major"
        else:
            detected_mode = "minor"

        confidence = float(chroma_mean[key] / (np.mean(chroma_mean) + 1e-8))
        confidence = min(1.0, confidence / 2.0)

        return {"key": key, "mode": detected_mode, "confidence": confidence}

    def _weighted_vote(self, keys: List[int], confidences: List[float]) -> int:
        """
        Weighted voting for final key selection.
        """
        weights = np.array(confidences)
        weights = weights / (np.sum(weights) + 1e-8)

        hist = np.zeros(12)
        for key, weight in zip(keys, weights):
            hist[key] += weight

        return int(np.argmax(hist))

    def _key_to_name(self, key: int, mode: str) -> str:
        """Convert key index to name."""
        return f"{KEY_NAMES[key % 12]} {mode}"

    def detect_key_changes(
        self,
        y: np.ndarray,
        sr: Optional[int] = None,
        window_size: float = 10.0,
        hop_size: float = 5.0,
    ) -> List[Dict]:
        """
        Detect key changes throughout the audio.

        Useful for analyzing modulations and key transitions.

        Args:
            y: Audio time series
            sr: Sample rate
            window_size: Analysis window size in seconds
            hop_size: Hop size between windows in seconds

        Returns:
            List of key detections at different time points
        """
        sr = sr or self.sr

        if y.ndim == 2:
            y = np.mean(y, axis=0)

        window_samples = int(window_size * sr)
        hop_samples = int(hop_size * sr)

        changes = []

        for start in range(0, len(y) - window_samples + 1, hop_samples):
            window = y[start : start + window_samples]

            result = self.detect_key(window, sr)

            changes.append(
                {
                    "time": start / sr,
                    "key_index": result.key_index,
                    "key_name": result.key_name,
                    "mode": result.mode,
                    "confidence": result.confidence,
                }
            )

        return changes

    def get_key_similarity(self, key1: int, mode1: str, key2: int, mode2: str) -> float:
        """
        Calculate key similarity based on circle of fifths.

        Args:
            key1: First key index (0-11)
            mode1: First key mode
            key2: Second key index
            mode2: Second key mode

        Returns:
            Similarity score (0-1)
        """
        circle_distance = min(abs(key1 - key2), 12 - abs(key1 - key2))

        key_similarity = 1.0 - (circle_distance / 6.0)

        mode_similarity = 1.0 if mode1 == mode2 else 0.7

        return float(key_similarity * mode_similarity)


def detect_key_robust(y: np.ndarray, sr: int = 44100) -> KeyDetectionResult:
    """
    Convenience function for robust key detection.

    Args:
        y: Audio time series
        sr: Sample rate

    Returns:
        KeyDetectionResult
    """
    detector = RobustKeyDetector(sr=sr)
    return detector.detect_key(y, sr)


if __name__ == "__main__":
    print("Robust Key Detection Module v2")
    print("=" * 50)

    sr = 44100
    duration = 10.0

    t = np.linspace(0, duration, int(sr * duration))

    freq_c = 261.63
    freq_e = 329.63
    freq_g = 392.00

    y_c_major = (
        0.5 * np.sin(2 * np.pi * freq_c * t)
        + 0.3 * np.sin(2 * np.pi * freq_e * t)
        + 0.2 * np.sin(2 * np.pi * freq_g * t)
    )

    detector = RobustKeyDetector(sr=sr)
    result = detector.detect_key(y_c_major, sr)

    print(f"\nTest: C Major Chord")
    print(f"  Detected Key: {result.key_name}")
    print(f"  Mode: {result.mode}")
    print(f"  Confidence: {result.confidence:.3f}")

    print(f"\n  Method Results:")
    for method, data in result.method_results.items():
        print(
            f"    {method}: Key {data['key']}, {data['mode']}, conf={data['confidence']:.3f}"
        )

    freq_a = 220.00
    freq_c = 261.63
    freq_e = 329.63

    y_a_minor = (
        0.5 * np.sin(2 * np.pi * freq_a * t)
        + 0.3 * np.sin(2 * np.pi * freq_c * t)
        + 0.2 * np.sin(2 * np.pi * freq_e * t)
    )

    result_minor = detector.detect_key(y_a_minor, sr)

    print(f"\nTest: A Minor Chord")
    print(f"  Detected Key: {result_minor.key_name}")
    print(f"  Confidence: {result_minor.confidence:.3f}")

    similarity = detector.get_key_similarity(
        result.key_index, result.mode, result_minor.key_index, result_minor.mode
    )
    print(f"\n  Key similarity: {similarity:.3f}")

    print("\n" + "=" * 50)
    print("Robust key detection ready.")
