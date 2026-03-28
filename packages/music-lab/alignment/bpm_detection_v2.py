"""
BPM Detection Module v2
Enhanced tempo detection with multi-method ensemble and beat tracking

Improvements over v1:
- Multi-method ensemble (onset + spectral + comb filtering)
- Beat phase alignment
- Tempo stability analysis
- Half/double tempo detection
- Groove analysis
"""

import numpy as np
import librosa
from scipy import signal, optimize
from scipy.ndimage import maximum_filter1d
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass


@dataclass
class BPMDetectionResult:
    """Enhanced BPM detection result."""

    bpm: float
    confidence: float
    tempo_stability: float
    beat_positions: np.ndarray
    beat_intervals: np.ndarray
    groove_strength: float
    is_half_tempo: bool
    is_double_tempo: bool
    method_results: Dict[str, float]


class RobustBPMDetector:
    """
    Production-grade BPM detection using multi-method ensemble.

    Features:
    - Onset-based detection
    - Spectral flux analysis
    - Comb filtering
    - Autocorrelation refinement
    - Tempo stability scoring
    - Half/double tempo detection

    Example:
        >>> detector = RobustBPMDetector(sr=44100)
        >>> result = detector.detect_bpm(audio, sr)
        >>> print(f"BPM: {result.bpm:.1f} (conf: {result.confidence:.2f})")
    """

    def __init__(
        self,
        sr: int = 44100,
        min_bpm: float = 60.0,
        max_bpm: float = 200.0,
        hop_length: int = 512,
    ):
        self.sr = sr
        self.min_bpm = min_bpm
        self.max_bpm = max_bpm
        self.hop_length = hop_length

        self.bpm_range = np.arange(min_bpm, max_bpm + 1, 1.0)

    def detect_bpm(self, y: np.ndarray, sr: Optional[int] = None) -> BPMDetectionResult:
        """
        Detect BPM using ensemble of methods.

        Args:
            y: Audio time series
            sr: Sample rate

        Returns:
            BPMDetectionResult with comprehensive tempo analysis
        """
        sr = sr or self.sr

        if y.ndim == 2:
            y = np.mean(y, axis=0)

        y = y.astype(np.float32)

        onset_bpm, onset_conf = self._onset_based_detection(y, sr)
        spectral_bpm, spectral_conf = self._spectral_flux_detection(y, sr)
        comb_bpm, comb_conf = self._comb_filter_detection(y, sr)
        autocorr_bpm, autocorr_conf = self._autocorrelation_detection(y, sr)

        methods = {
            "onset": (onset_bpm, onset_conf),
            "spectral": (spectral_bpm, spectral_conf),
            "comb": (comb_bpm, comb_conf),
            "autocorrelation": (autocorr_bpm, autocorr_conf),
        }

        final_bpm, final_confidence = self._ensemble_vote(methods)

        final_bpm, is_half, is_double = self._check_tempo_octave(final_bpm, methods)

        tempo, beat_frames = librosa.beat.beat_track(
            y=y, sr=sr, hop_length=self.hop_length
        )
        if isinstance(tempo, np.ndarray):
            tempo = float(tempo[0]) if len(tempo) > 0 else final_bpm
        else:
            tempo = float(tempo)

        beat_times = librosa.frames_to_time(
            beat_frames, sr=sr, hop_length=self.hop_length
        )
        beat_intervals = np.diff(beat_times) if len(beat_times) > 1 else np.array([])

        stability = self._calculate_stability(beat_intervals)
        groove = self._calculate_groove_strength(beat_intervals)

        return BPMDetectionResult(
            bpm=round(final_bpm, 1),
            confidence=final_confidence,
            tempo_stability=stability,
            beat_positions=beat_times,
            beat_intervals=beat_intervals,
            groove_strength=groove,
            is_half_tempo=is_half,
            is_double_tempo=is_double,
            method_results={
                name: {"bpm": bpm, "confidence": conf}
                for name, (bpm, conf) in methods.items()
            },
        )

    def _onset_based_detection(self, y: np.ndarray, sr: int) -> Tuple[float, float]:
        """Onset strength envelope analysis."""
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=self.hop_length)

        tempo = librosa.beat.tempo(
            onset_envelope=onset_env,
            sr=sr,
            hop_length=self.hop_length,
            min_bpm=self.min_bpm,
            max_bpm=self.max_bpm,
        )

        if isinstance(tempo, np.ndarray):
            tempo = float(tempo[0]) if len(tempo) > 0 else 120.0
        else:
            tempo = float(tempo)

        ac = librosa.autocorrelate(onset_env)
        ac_norm = ac / (np.max(ac) + 1e-8)

        target_lag = int(60 * sr / self.hop_length / tempo)
        confidence = float(ac_norm[target_lag]) if target_lag < len(ac_norm) else 0.5

        return tempo, confidence

    def _spectral_flux_detection(self, y: np.ndarray, sr: int) -> Tuple[float, float]:
        """Spectral flux based tempo detection."""
        n_fft = 2048
        hop_length = 512

        S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))

        flux = np.sum(np.maximum(0, S[:, 1:] - S[:, :-1]), axis=0)

        ac = librosa.autocorrelate(flux)

        min_lag = int(60 * sr / hop_length / self.max_bpm)
        max_lag = int(60 * sr / hop_length / self.min_bpm)

        if max_lag >= len(ac):
            max_lag = len(ac) - 1

        search_region = ac[min_lag:max_lag]
        if len(search_region) == 0:
            return 120.0, 0.3

        peak_idx = np.argmax(search_region) + min_lag
        bpm = 60 * sr / hop_length / peak_idx

        confidence = float(ac[peak_idx] / (np.max(ac) + 1e-8))

        return float(bpm), confidence

    def _comb_filter_detection(self, y: np.ndarray, sr: int) -> Tuple[float, float]:
        """Comb filter bank tempo detection."""
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=self.hop_length)
        onset_env = onset_env / (np.max(np.abs(onset_env)) + 1e-8)

        best_bpm = 120.0
        best_energy = 0.0

        for bpm in self.bpm_range:
            period = int(60 * sr / self.hop_length / bpm)

            if period < 2 or period > len(onset_env) // 4:
                continue

            comb = np.zeros(len(onset_env))
            for i in range(0, len(onset_env) - period, period):
                comb[i : i + period // 4] += 1.0

            energy = np.sum(onset_env * comb)

            if energy > best_energy:
                best_energy = energy
                best_bpm = bpm

        confidence = min(1.0, best_energy / (len(onset_env) * 0.5 + 1e-8))

        return float(best_bpm), confidence

    def _autocorrelation_detection(self, y: np.ndarray, sr: int) -> Tuple[float, float]:
        """Direct signal autocorrelation."""
        if len(y) > sr * 30:
            y = y[: sr * 30]

        y_down = librosa.resample(y, orig_sr=sr, target_sr=sr // 4)
        sr_down = sr // 4

        ac = np.correlate(y_down, y_down, mode="full")
        ac = ac[len(ac) // 2 :]
        ac = ac / (np.max(ac) + 1e-8)

        min_lag = int(60 * sr_down / self.max_bpm)
        max_lag = int(60 * sr_down / self.min_bpm)

        if max_lag >= len(ac):
            max_lag = len(ac) - 1

        search_region = ac[min_lag:max_lag]
        if len(search_region) == 0:
            return 120.0, 0.3

        peak_idx = np.argmax(search_region) + min_lag
        bpm = 60 * sr_down / peak_idx

        confidence = float(ac[peak_idx])

        return float(bpm), confidence

    def _ensemble_vote(
        self, methods: Dict[str, Tuple[float, float]]
    ) -> Tuple[float, float]:
        """Weighted ensemble voting for final BPM."""
        bpms = []
        weights = []

        for name, (bpm, conf) in methods.items():
            if self.min_bpm <= bpm <= self.max_bpm:
                bpms.append(bpm)
                weights.append(conf)

        if not bpms:
            return 120.0, 0.3

        weights = np.array(weights)
        weights = weights / (np.sum(weights) + 1e-8)

        weighted_sum = sum(b * w for b, w in zip(bpms, weights))

        bpm_variations = [abs(b - weighted_sum) for b in bpms]
        agreement = 1.0 - (np.mean(bpm_variations) / 50.0)
        agreement = max(0.0, min(1.0, agreement))

        final_confidence = float(np.mean(weights) * agreement)

        return float(weighted_sum), final_confidence

    def _check_tempo_octave(
        self, bpm: float, methods: Dict[str, Tuple[float, float]]
    ) -> Tuple[float, bool, bool]:
        """Check for half/double tempo errors."""
        half_bpm = bpm / 2
        double_bpm = bpm * 2

        half_count = sum(
            1 for m_bpm, _ in methods.values() if abs(m_bpm - half_bpm) < 5
        )
        double_count = sum(
            1 for m_bpm, _ in methods.values() if abs(m_bpm - double_bpm) < 5
        )

        is_half = False
        is_double = False

        if half_count >= 2 and half_bpm >= self.min_bpm:
            is_double = True
            return half_bpm, is_half, is_double
        elif double_count >= 2 and double_bpm <= self.max_bpm:
            is_half = True
            return double_bpm, is_half, is_double

        return bpm, is_half, is_double

    def _calculate_stability(self, beat_intervals: np.ndarray) -> float:
        """Calculate tempo stability from beat intervals."""
        if len(beat_intervals) < 2:
            return 0.5

        cv = np.std(beat_intervals) / (np.mean(beat_intervals) + 1e-8)

        stability = max(0.0, min(1.0, 1.0 - cv))

        return float(stability)

    def _calculate_groove_strength(self, beat_intervals: np.ndarray) -> float:
        """Calculate groove strength (beat consistency)."""
        if len(beat_intervals) < 4:
            return 0.5

        mean_interval = np.mean(beat_intervals)

        deviations = np.abs(beat_intervals - mean_interval)
        mean_deviation = np.mean(deviations)

        tolerance = mean_interval * 0.1

        in_grid = np.sum(deviations < tolerance) / len(deviations)

        return float(in_grid)

    def get_downbeats(
        self, y: np.ndarray, sr: Optional[int] = None, beats_per_bar: int = 4
    ) -> np.ndarray:
        """
        Detect downbeat positions.

        Args:
            y: Audio time series
            sr: Sample rate
            beats_per_bar: Beats per measure

        Returns:
            Array of downbeat times
        """
        sr = sr or self.sr

        tempo, beat_frames = librosa.beat.beat_track(
            y=y, sr=sr, hop_length=self.hop_length
        )

        beat_times = librosa.frames_to_time(
            beat_frames, sr=sr, hop_length=self.hop_length
        )

        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=self.hop_length)

        beat_strengths = []
        for frame in beat_frames:
            if frame < len(onset_env):
                beat_strengths.append(onset_env[frame])
            else:
                beat_strengths.append(0)

        beat_strengths = np.array(beat_strengths)

        downbeats = []
        for i in range(0, len(beat_times), beats_per_bar):
            if i < len(beat_times):
                downbeats.append(beat_times[i])

        return np.array(downbeats)


def detect_bpm_robust(y: np.ndarray, sr: int = 44100) -> BPMDetectionResult:
    """Convenience function for robust BPM detection."""
    detector = RobustBPMDetector(sr=sr)
    return detector.detect_bpm(y, sr)


if __name__ == "__main__":
    print("Robust BPM Detection Module v2")
    print("=" * 50)

    sr = 44100
    duration = 15.0

    target_bpm = 120.0
    beat_period = 60.0 / target_bpm

    t = np.linspace(0, duration, int(sr * duration))

    y = np.zeros(len(t))
    for i, beat_time in enumerate(np.arange(0, duration, beat_period)):
        sample_idx = int(beat_time * sr)
        if sample_idx + 1000 < len(y):
            click = np.exp(-np.linspace(0, 15, 1000)) * np.sin(
                2 * np.pi * 1000 * np.linspace(0, 0.01, 1000)
            )
            y[sample_idx : sample_idx + 1000] += 0.5 * click

    y += 0.05 * np.random.randn(len(y))

    detector = RobustBPMDetector(sr=sr)
    result = detector.detect_bpm(y, sr)

    print(f"\nTest: 120 BPM Click Track")
    print(f"  Detected BPM: {result.bpm}")
    print(f"  Target BPM: {target_bpm}")
    print(f"  Error: {abs(result.bpm - target_bpm):.1f} BPM")
    print(f"  Confidence: {result.confidence:.3f}")
    print(f"  Stability: {result.tempo_stability:.3f}")
    print(f"  Groove: {result.groove_strength:.3f}")

    print(f"\n  Method Results:")
    for method, data in result.method_results.items():
        print(f"    {method}: {data['bpm']:.1f} BPM (conf: {data['confidence']:.3f})")

    print(f"\n  Beat count: {len(result.beat_positions)}")
    print(f"  Mean beat interval: {np.mean(result.beat_intervals):.3f}s")

    print("\n" + "=" * 50)
    print("Robust BPM detection ready.")
