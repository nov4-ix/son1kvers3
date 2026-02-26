"""
BPM Detection Module
Detects tempo (beats per minute) from audio signals

Part of the Harmonic Alignment Module (HAM v1) for hybrid music generation.
Enables tempo detection and time-stretch alignment between sections.
"""

import numpy as np
import librosa
from typing import Tuple, Optional, List


def detect_bpm(
    y: np.ndarray,
    sr: int,
    min_bpm: float = 60.0,
    max_bpm: float = 200.0,
    hop_length: int = 512,
) -> float:
    """
    Detect the tempo (BPM) of an audio signal.

    Uses librosa's beat tracking with onset strength analysis.

    Args:
        y: Audio time series (mono or stereo). Shape: (n_samples,) or (2, n_samples)
        sr: Sample rate in Hz
        min_bpm: Minimum expected BPM. Default: 60.0
        max_bpm: Maximum expected BPM. Default: 200.0
        hop_length: Hop length for onset detection. Default: 512

    Returns:
        Detected BPM as float (e.g., 120.0)

    Raises:
        ValueError: If audio array is empty or invalid

    Example:
        >>> y, sr = librosa.load('drums.wav', sr=44100)
        >>> bpm = detect_bpm(y, sr)
        >>> print(f"Detected BPM: {bpm:.1f}")
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    y_mono = y_mono.astype(np.float32)

    onset_env = librosa.onset.onset_strength(y=y_mono, sr=sr, hop_length=hop_length)

    tempo, _ = librosa.beat.beat_track(
        onset_envelope=onset_env,
        sr=sr,
        hop_length=hop_length,
        min_tempo=min_bpm,
        max_tempo=max_bpm,
    )

    if isinstance(tempo, np.ndarray):
        tempo = float(tempo[0]) if len(tempo) > 0 else 120.0

    return float(tempo)


def detect_bpm_with_beats(
    y: np.ndarray,
    sr: int,
    min_bpm: float = 60.0,
    max_bpm: float = 200.0,
    hop_length: int = 512,
) -> Tuple[float, np.ndarray]:
    """
    Detect BPM and beat positions in audio.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        min_bpm: Minimum expected BPM
        max_bpm: Maximum expected BPM
        hop_length: Hop length for onset detection

    Returns:
        Tuple of (bpm, beat_frames) where beat_frames are sample positions
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    y_mono = y_mono.astype(np.float32)

    onset_env = librosa.onset.onset_strength(y=y_mono, sr=sr, hop_length=hop_length)

    tempo, beat_frames = librosa.beat.beat_track(
        onset_envelope=onset_env,
        sr=sr,
        hop_length=hop_length,
        min_tempo=min_bpm,
        max_tempo=max_bpm,
    )

    if isinstance(tempo, np.ndarray):
        tempo = float(tempo[0]) if len(tempo) > 0 else 120.0

    beat_samples = librosa.frames_to_samples(beat_frames, hop_length=hop_length)

    return float(tempo), beat_samples


def compute_time_stretch_ratio(
    base_bpm: float, target_bpm: float, max_stretch: float = 0.15
) -> float:
    """
    Compute the time stretch ratio needed to match tempos.

    The ratio indicates how much to stretch/compress the audio.
    A ratio > 1.0 means stretching (slower), < 1.0 means compressing (faster).

    Args:
        base_bpm: Source BPM
        target_bpm: Target BPM to match
        max_stretch: Maximum allowed stretch ratio deviation from 1.0

    Returns:
        Stretch ratio (target_bpm / base_bpm), clamped to reasonable range

    Example:
        >>> compute_time_stretch_ratio(120.0, 128.0)
        1.0667  # Stretch by ~6.7%
        >>> compute_time_stretch_ratio(128.0, 120.0)
        0.9375  # Compress by ~6.25%
    """
    if base_bpm <= 0 or target_bpm <= 0:
        raise ValueError("BPM values must be positive")

    ratio = target_bpm / base_bpm

    min_ratio = 1.0 - max_stretch
    max_ratio = 1.0 + max_stretch

    return float(np.clip(ratio, min_ratio, max_ratio))


def time_stretch_audio(
    y: np.ndarray, sr: int, rate: float, hop_length: int = 512
) -> np.ndarray:
    """
    Time stretch audio by a given rate without affecting pitch.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        rate: Stretch rate (> 1.0 = slower, < 1.0 = faster)
        hop_length: Hop length for phase vocoder

    Returns:
        Time-stretched audio array
    """
    if rate == 1.0:
        return y.copy()

    if rate <= 0:
        raise ValueError("Rate must be positive")

    if y.ndim == 2:
        stretched = np.array(
            [librosa.effects.time_stretch(channel, rate=rate) for channel in y]
        )
        return stretched

    return librosa.effects.time_stretch(y, rate=rate)


def quantize_bpm(
    bpm: float, standard_tempos: Optional[List[float]] = None, tolerance: float = 3.0
) -> float:
    """
    Quantize BPM to nearest standard tempo.

    Useful for aligning to common musical tempos.

    Args:
        bpm: Detected BPM
        standard_tempos: List of standard tempos. Default: common BPMs
        tolerance: Maximum deviation to quantize (in BPM)

    Returns:
        Quantized BPM or original if too far from standard
    """
    if standard_tempos is None:
        standard_tempos = [
            60,
            65,
            70,
            75,
            80,
            85,
            90,
            95,
            100,
            105,
            110,
            115,
            120,
            125,
            130,
            135,
            140,
            145,
            150,
            155,
            160,
            170,
            175,
            180,
            190,
            200,
        ]

    standard_tempos = np.array(standard_tempos)
    distances = np.abs(standard_tempos - bpm)
    min_idx = np.argmin(distances)
    min_distance = distances[min_idx]

    if min_distance <= tolerance:
        return float(standard_tempos[min_idx])

    return bpm


def detect_bpm_confidence(
    y: np.ndarray, sr: int, hop_length: int = 512
) -> Tuple[float, float]:
    """
    Detect BPM with a confidence score based on beat regularity.

    Args:
        y: Audio time series
        sr: Sample rate
        hop_length: Hop length

    Returns:
        Tuple of (bpm, confidence) where confidence is 0.0-1.0
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    onset_env = librosa.onset.onset_strength(y=y_mono, sr=sr, hop_length=hop_length)

    tempo, beat_frames = librosa.beat.beat_track(
        onset_envelope=onset_env, sr=sr, hop_length=hop_length
    )

    if isinstance(tempo, np.ndarray):
        tempo = float(tempo[0]) if len(tempo) > 0 else 120.0

    if len(beat_frames) < 2:
        return float(tempo), 0.3

    beat_intervals = np.diff(beat_frames)

    if len(beat_intervals) < 2:
        return float(tempo), 0.5

    interval_std = np.std(beat_intervals)
    interval_mean = np.mean(beat_intervals)

    cv = interval_std / (interval_mean + 1e-8)

    confidence = max(0.0, min(1.0, 1.0 - cv * 2.0))

    return float(tempo), float(confidence)


def snap_to_grid(
    y: np.ndarray, sr: int, bpm: float, beats_per_bar: int = 4
) -> np.ndarray:
    """
    Snap audio length to nearest bar boundary.

    Useful for ensuring sections align to musical grid.

    Args:
        y: Audio time series
        sr: Sample rate
        bpm: Target BPM
        beats_per_bar: Number of beats per bar (4 for 4/4 time)

    Returns:
        Audio array padded/trimmed to bar boundary
    """
    if bpm <= 0:
        return y.copy()

    beat_duration = 60.0 / bpm
    bar_duration = beat_duration * beats_per_bar
    bar_samples = int(bar_duration * sr)

    current_samples = len(y) if y.ndim == 1 else y.shape[1]

    num_bars = round(current_samples / bar_samples)
    target_samples = int(num_bars * bar_samples)

    if target_samples == current_samples:
        return y.copy()

    if y.ndim == 2:
        if target_samples > current_samples:
            pad_length = target_samples - current_samples
            return np.pad(y, ((0, 0), (0, pad_length)), mode="constant")
        else:
            return y[:, :target_samples]
    else:
        if target_samples > current_samples:
            pad_length = target_samples - current_samples
            return np.pad(y, (0, pad_length), mode="constant")
        else:
            return y[:target_samples]


if __name__ == "__main__":
    print("BPM Detection Module - HAM v1")
    print("=" * 40)

    sr = 44100
    duration = 10.0
    target_bpm = 120.0

    t = np.linspace(0, duration, int(sr * duration))
    beat_period = 60.0 / target_bpm

    click_times = np.arange(0, duration, beat_period)
    y_clicks = np.zeros(int(sr * duration))

    for click_t in click_times:
        sample_idx = int(click_t * sr)
        if sample_idx + 1000 < len(y_clicks):
            click_env = np.exp(-np.linspace(0, 20, 1000))
            y_clicks[sample_idx : sample_idx + 1000] += (
                0.5 * click_env * np.sin(2 * np.pi * 1000 * np.linspace(0, 0.001, 1000))
            )

    detected = detect_bpm(y_clicks, sr)
    print(f"Test signal (120 BPM clicks)")
    print(f"  Detected BPM: {detected:.1f}")
    print(f"  Expected: {target_bpm:.1f}")
    print(f"  Error: {abs(detected - target_bpm):.1f} BPM")

    bpm, conf = detect_bpm_confidence(y_clicks, sr)
    print(f"  Confidence: {conf:.2f}")

    stretch = compute_time_stretch_ratio(detected, 128.0)
    print(f"\n  Stretch ratio to 128 BPM: {stretch:.4f}")

    quantized = quantize_bpm(detected)
    print(f"  Quantized BPM: {quantized:.1f}")

    print("\n" + "=" * 40)
    print("BPM detection module ready for integration.")
