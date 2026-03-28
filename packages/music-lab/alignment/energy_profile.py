"""
Energy Profile Module
Computes and normalizes audio energy levels (RMS)

Part of the Harmonic Alignment Module (HAM v1) for hybrid music generation.
Ensures consistent loudness across sections from different generation models.
"""

import numpy as np
import librosa
from typing import Tuple, Optional


def compute_rms_energy(
    y: np.ndarray, frame_length: int = 2048, hop_length: int = 512
) -> float:
    """
    Compute the overall RMS energy of an audio signal.

    RMS (Root Mean Square) energy represents the average signal power
    and is commonly used for loudness estimation.

    Args:
        y: Audio time series (mono or stereo)
        frame_length: Frame length for RMS computation. Default: 2048
        hop_length: Hop length between frames. Default: 512

    Returns:
        RMS energy value (0.0 to 1.0 for normalized audio)

    Raises:
        ValueError: If audio array is empty

    Example:
        >>> y, sr = librosa.load('song.wav', sr=44100)
        >>> energy = compute_rms_energy(y)
        >>> print(f"RMS energy: {energy:.4f}")
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_flat = y.flatten()
    else:
        y_flat = y

    y_flat = y_flat.astype(np.float32)

    rms_frames = librosa.feature.rms(
        y=y_flat, frame_length=frame_length, hop_length=hop_length
    )

    rms_mean = float(np.mean(rms_frames))

    return rms_mean


def compute_rms_envelope(
    y: np.ndarray, frame_length: int = 2048, hop_length: int = 512
) -> np.ndarray:
    """
    Compute RMS energy envelope over time.

    Returns per-frame RMS values useful for dynamic analysis.

    Args:
        y: Audio time series
        frame_length: Frame length for RMS computation
        hop_length: Hop length between frames

    Returns:
        Array of RMS values per frame
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_flat = y.flatten()
    else:
        y_flat = y

    rms_frames = librosa.feature.rms(
        y=y_flat, frame_length=frame_length, hop_length=hop_length
    )

    return rms_frames.flatten()


def normalize_energy(
    y: np.ndarray,
    target_energy: float,
    peak_limit: float = 0.99,
    preserve_stereo: bool = True,
) -> np.ndarray:
    """
    Normalize audio to a target RMS energy level.

    Applies gain scaling to match target energy while preventing clipping.

    Args:
        y: Audio time series (mono or stereo)
        target_energy: Target RMS energy (e.g., 0.1 for moderate loudness)
        peak_limit: Maximum allowed peak value to prevent clipping
        preserve_stereo: If True, applies same gain to both channels

    Returns:
        Normalized audio array

    Raises:
        ValueError: If target_energy or peak_limit invalid

    Example:
        >>> y_normalized = normalize_energy(y, target_energy=0.15)
    """
    if target_energy <= 0 or target_energy > 1:
        raise ValueError("target_energy must be between 0 and 1")
    if peak_limit <= 0 or peak_limit > 1:
        raise ValueError("peak_limit must be between 0 and 1")

    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    y = y.astype(np.float32)

    current_energy = compute_rms_energy(y)

    if current_energy < 1e-8:
        return np.zeros_like(y)

    gain = target_energy / current_energy

    max_val = np.max(np.abs(y)) if y.ndim == 1 else np.max(np.abs(y))
    if max_val * gain > peak_limit:
        gain = peak_limit / (max_val + 1e-8)

    normalized = y * gain

    return normalized.astype(np.float32)


def match_energy(
    source: np.ndarray, target: np.ndarray, headroom_db: float = 0.0
) -> np.ndarray:
    """
    Match source audio energy to target audio energy.

    Args:
        source: Audio to be adjusted
        target: Reference audio for energy matching
        headroom_db: Additional headroom in dB (negative = quieter)

    Returns:
        Energy-matched source audio
    """
    source_energy = compute_rms_energy(source)
    target_energy = compute_rms_energy(target)

    if source_energy < 1e-8:
        return np.zeros_like(source)

    headroom_linear = 10 ** (headroom_db / 20)
    target_with_headroom = target_energy * headroom_linear

    return normalize_energy(source, target_with_headroom)


def compute_loudness_range(
    y: np.ndarray, frame_length: int = 2048, hop_length: int = 512
) -> Tuple[float, float, float]:
    """
    Compute loudness statistics: min, max, and dynamic range.

    Args:
        y: Audio time series
        frame_length: Frame length for analysis
        hop_length: Hop length between frames

    Returns:
        Tuple of (min_rms, max_rms, dynamic_range_db)
    """
    envelope = compute_rms_envelope(y, frame_length, hop_length)

    min_rms = float(np.min(envelope))
    max_rms = float(np.max(envelope))

    if min_rms > 1e-8 and max_rms > 1e-8:
        dynamic_range_db = 20 * np.log10(max_rms / min_rms)
    else:
        dynamic_range_db = 0.0

    return min_rms, max_rms, float(dynamic_range_db)


def apply_fade(
    y: np.ndarray,
    fade_in_samples: int = 0,
    fade_out_samples: int = 0,
    curve: str = "linear",
) -> np.ndarray:
    """
    Apply fade in/out to audio.

    Args:
        y: Audio time series
        fade_in_samples: Number of samples for fade in
        fade_out_samples: Number of samples for fade out
        curve: Fade curve type ('linear', 'exponential', 'logarithmic')

    Returns:
        Audio with fades applied
    """
    y = y.copy().astype(np.float32)

    if fade_in_samples > 0:
        fade_in_samples = min(fade_in_samples, len(y) if y.ndim == 1 else y.shape[1])

        if curve == "linear":
            fade_curve = np.linspace(0, 1, fade_in_samples)
        elif curve == "exponential":
            fade_curve = np.exp(np.linspace(-6, 0, fade_in_samples))
            fade_curve = fade_curve / fade_curve[-1]
        elif curve == "logarithmic":
            fade_curve = np.logspace(-2, 0, fade_in_samples)
            fade_curve = fade_curve / fade_curve[-1]
        else:
            fade_curve = np.linspace(0, 1, fade_in_samples)

        if y.ndim == 2:
            y[:, :fade_in_samples] *= fade_curve
        else:
            y[:fade_in_samples] *= fade_curve

    if fade_out_samples > 0:
        total_samples = len(y) if y.ndim == 1 else y.shape[1]
        fade_out_samples = min(fade_out_samples, total_samples)
        start_idx = total_samples - fade_out_samples

        if curve == "linear":
            fade_curve = np.linspace(1, 0, fade_out_samples)
        elif curve == "exponential":
            fade_curve = np.exp(np.linspace(0, -6, fade_out_samples))
        elif curve == "logarithmic":
            fade_curve = np.logspace(0, -2, fade_out_samples)
        else:
            fade_curve = np.linspace(1, 0, fade_out_samples)

        if y.ndim == 2:
            y[:, start_idx:] *= fade_curve
        else:
            y[start_idx:] *= fade_curve

    return y


def compute_peak_energy(y: np.ndarray) -> float:
    """
    Compute peak (maximum absolute) energy of audio.

    Args:
        y: Audio time series

    Returns:
        Peak amplitude (0.0 to 1.0 for normalized audio)
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    return float(np.max(np.abs(y)))


def soft_clip(y: np.ndarray, threshold: float = 0.8, amount: float = 0.5) -> np.ndarray:
    """
    Apply soft clipping to prevent harsh digital clipping.

    Args:
        y: Audio time series
        threshold: Clipping threshold (0 to 1)
        amount: Clipping intensity (0 to 1)

    Returns:
        Soft-clipped audio
    """
    y = y.copy().astype(np.float32)

    above_threshold = np.abs(y) > threshold
    sign = np.sign(y)

    y_clipped = np.abs(y)
    y_clipped[above_threshold] = threshold + (
        (y_clipped[above_threshold] - threshold) * (1 - amount)
    )

    return sign * np.clip(y_clipped, 0, 1.0)


if __name__ == "__main__":
    print("Energy Profile Module - HAM v1")
    print("=" * 40)

    sr = 44100
    duration = 5.0

    t = np.linspace(0, duration, int(sr * duration))

    y_quiet = 0.1 * np.sin(2 * np.pi * 440 * t)
    y_loud = 0.8 * np.sin(2 * np.pi * 440 * t)

    quiet_energy = compute_rms_energy(y_quiet)
    loud_energy = compute_rms_energy(y_loud)

    print(f"Test signal analysis:")
    print(f"  Quiet signal RMS: {quiet_energy:.4f}")
    print(f"  Loud signal RMS: {loud_energy:.4f}")

    target_energy = 0.2
    y_normalized = normalize_energy(y_quiet, target_energy)
    normalized_energy = compute_rms_energy(y_normalized)

    print(f"\nNormalization test:")
    print(f"  Target energy: {target_energy:.4f}")
    print(f"  Normalized energy: {normalized_energy:.4f}")

    y_matched = match_energy(y_quiet, y_loud)
    matched_energy = compute_rms_energy(y_matched)

    print(f"\nEnergy matching test:")
    print(f"  Source (quiet): {quiet_energy:.4f}")
    print(f"  Target (loud): {loud_energy:.4f}")
    print(f"  Matched result: {matched_energy:.4f}")

    min_rms, max_rms, dr = compute_loudness_range(y_loud)
    print(f"\nLoudness range (loud signal):")
    print(f"  Min RMS: {min_rms:.4f}")
    print(f"  Max RMS: {max_rms:.4f}")
    print(f"  Dynamic range: {dr:.1f} dB")

    print("\n" + "=" * 40)
    print("Energy profile module ready for integration.")
