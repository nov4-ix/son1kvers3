"""
Spectral Match Module
Computes and matches spectral characteristics between audio signals

Part of the Harmonic Alignment Module (HAM v1) for hybrid music generation.
Provides lightweight spectral analysis and EQ shaping for section alignment.
"""

import numpy as np
import librosa
from typing import Tuple, Optional, Dict


def compute_spectral_centroid(
    y: np.ndarray, sr: int, n_fft: int = 2048, hop_length: int = 512
) -> float:
    """
    Compute the average spectral centroid of an audio signal.

    Spectral centroid indicates the "brightness" of a sound -
    higher values mean more high-frequency content.

    Args:
        y: Audio time series (mono or stereo)
        sr: Sample rate in Hz
        n_fft: FFT window size. Default: 2048
        hop_length: Hop length between frames. Default: 512

    Returns:
        Average spectral centroid in Hz

    Raises:
        ValueError: If audio array is empty

    Example:
        >>> y, sr = librosa.load('song.wav', sr=44100)
        >>> centroid = compute_spectral_centroid(y, sr)
        >>> print(f"Spectral centroid: {centroid:.0f} Hz")
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    y_mono = y_mono.astype(np.float32)

    centroid = librosa.feature.spectral_centroid(
        y=y_mono, sr=sr, n_fft=n_fft, hop_length=hop_length
    )

    return float(np.mean(centroid))


def compute_spectral_bandwidth(
    y: np.ndarray, sr: int, n_fft: int = 2048, hop_length: int = 512
) -> float:
    """
    Compute the average spectral bandwidth of an audio signal.

    Spectral bandwidth indicates the range of frequencies present.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        n_fft: FFT window size
        hop_length: Hop length between frames

    Returns:
        Average spectral bandwidth in Hz
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    bandwidth = librosa.feature.spectral_bandwidth(
        y=y_mono, sr=sr, n_fft=n_fft, hop_length=hop_length
    )

    return float(np.mean(bandwidth))


def compute_spectral_rolloff(
    y: np.ndarray,
    sr: int,
    rolloff_percent: float = 0.85,
    n_fft: int = 2048,
    hop_length: int = 512,
) -> float:
    """
    Compute the spectral rolloff frequency.

    The rolloff is the frequency below which a specified percentage
    of the total spectral energy is contained.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        rolloff_percent: Percentage of energy (0-1). Default: 0.85
        n_fft: FFT window size
        hop_length: Hop length between frames

    Returns:
        Average rolloff frequency in Hz
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    rolloff = librosa.feature.spectral_rolloff(
        y=y_mono,
        sr=sr,
        n_fft=n_fft,
        hop_length=hop_length,
        roll_percent=rolloff_percent,
    )

    return float(np.mean(rolloff))


def compute_spectral_flatness(
    y: np.ndarray, n_fft: int = 2048, hop_length: int = 512
) -> float:
    """
    Compute spectral flatness (Wiener entropy).

    Values near 1 indicate noise-like signals, values near 0
    indicate tonal/harmonic content.

    Args:
        y: Audio time series
        n_fft: FFT window size
        hop_length: Hop length between frames

    Returns:
        Average spectral flatness (0 to 1 in log scale)
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    flatness = librosa.feature.spectral_flatness(
        y=y_mono, n_fft=n_fft, hop_length=hop_length
    )

    return float(np.mean(flatness))


def compute_spectral_contrast(
    y: np.ndarray, sr: int, n_fft: int = 2048, hop_length: int = 512, n_bands: int = 6
) -> np.ndarray:
    """
    Compute spectral contrast across frequency bands.

    Useful for characterizing the spectral "texture" of audio.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        n_fft: FFT window size
        hop_length: Hop length between frames
        n_bands: Number of frequency bands

    Returns:
        Array of contrast values per band (averaged over time)
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y_mono = np.mean(y, axis=0)
    else:
        y_mono = y

    contrast = librosa.feature.spectral_contrast(
        y=y_mono, sr=sr, n_fft=n_fft, hop_length=hop_length, n_bands=n_bands
    )

    return np.mean(contrast, axis=1)


def get_spectral_profile(
    y: np.ndarray, sr: int, n_fft: int = 2048, hop_length: int = 512
) -> Dict[str, float]:
    """
    Compute a complete spectral profile of audio.

    Returns multiple spectral features in one call for efficiency.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        n_fft: FFT window size
        hop_length: Hop length between frames

    Returns:
        Dictionary with spectral features
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    return {
        "centroid_hz": compute_spectral_centroid(y, sr, n_fft, hop_length),
        "bandwidth_hz": compute_spectral_bandwidth(y, sr, n_fft, hop_length),
        "rolloff_hz": compute_spectral_rolloff(y, sr, 0.85, n_fft, hop_length),
        "flatness": compute_spectral_flatness(y, n_fft, hop_length),
    }


def apply_spectral_adjustment(
    y: np.ndarray,
    sr: int,
    reference_centroid: float,
    intensity: float = 0.5,
    n_fft: int = 2048,
    hop_length: int = 512,
) -> np.ndarray:
    """
    Apply lightweight spectral adjustment to match a reference centroid.

    Uses simple high-shelf/low-shelf gain adjustment rather than
    full EQ to maintain low CPU usage and prevent artifacts.

    Args:
        y: Audio time series to adjust
        sr: Sample rate in Hz
        reference_centroid: Target spectral centroid in Hz
        intensity: Adjustment intensity (0.0 to 1.0). Default: 0.5
        n_fft: FFT window size for analysis
        hop_length: Hop length for analysis

    Returns:
        Spectrally adjusted audio

    Example:
        >>> y_adjusted = apply_spectral_adjustment(y, sr, reference_centroid=3000)
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if intensity <= 0:
        return y.copy()

    y = y.copy().astype(np.float32)

    current_centroid = compute_spectral_centroid(y, sr, n_fft, hop_length)

    centroid_ratio = reference_centroid / (current_centroid + 1e-8)

    if abs(centroid_ratio - 1.0) < 0.05:
        return y

    crossover_freq = 2000.0

    nyquist = sr / 2
    normalized_crossover = crossover_freq / nyquist

    if centroid_ratio > 1.0:
        gain_db = min(3.0 * intensity * (centroid_ratio - 1.0), 4.0)
        gain_factor = 10 ** (gain_db / 20)

        if y.ndim == 2:
            for ch in range(y.shape[0]):
                y[ch] = _apply_simple_shelf(
                    y[ch], sr, crossover_freq, gain_factor, "high"
                )
        else:
            y = _apply_simple_shelf(y, sr, crossover_freq, gain_factor, "high")
    else:
        gain_db = min(3.0 * intensity * (1.0 - centroid_ratio), 4.0)
        gain_factor = 10 ** (gain_db / 20)

        if y.ndim == 2:
            for ch in range(y.shape[0]):
                y[ch] = _apply_simple_shelf(
                    y[ch], sr, crossover_freq, gain_factor, "low"
                )
        else:
            y = _apply_simple_shelf(y, sr, crossover_freq, gain_factor, "low")

    max_val = np.max(np.abs(y))
    if max_val > 0.99:
        y = y * (0.95 / max_val)

    return y


def _apply_simple_shelf(
    y: np.ndarray, sr: int, crossover_freq: float, gain: float, shelf_type: str = "high"
) -> np.ndarray:
    """
    Apply simple shelf filter using frequency-domain manipulation.

    Internal helper function for spectral adjustment.
    """
    n = len(y)
    n_fft = 2 ** int(np.ceil(np.log2(n)))

    Y = np.fft.rfft(y, n=n_fft)

    freqs = np.fft.rfftfreq(n_fft, 1 / sr)

    if shelf_type == "high":
        mask = freqs >= crossover_freq
    else:
        mask = freqs < crossover_freq

    transition_width = crossover_freq * 0.5
    if shelf_type == "high":
        transition_mask = (freqs >= crossover_freq - transition_width) & (
            freqs < crossover_freq
        )
    else:
        transition_mask = (freqs >= crossover_freq) & (
            freqs < crossover_freq + transition_width
        )

    Y[mask] *= gain

    for i, f in enumerate(freqs):
        if transition_mask[i]:
            if shelf_type == "high":
                blend = (f - (crossover_freq - transition_width)) / transition_width
            else:
                blend = 1 - (f - crossover_freq) / transition_width
            Y[i] *= 1 + (gain - 1) * blend * 0.5

    y_out = np.fft.irfft(Y, n=n_fft)[:n]

    return y_out.astype(np.float32)


def match_spectral_profile(
    source: np.ndarray, target: np.ndarray, sr: int, intensity: float = 0.7
) -> np.ndarray:
    """
    Match source audio's spectral profile to target's.

    Adjusts centroid and energy to create spectral similarity.

    Args:
        source: Audio to be adjusted
        target: Reference audio
        sr: Sample rate in Hz
        intensity: Adjustment intensity (0.0 to 1.0)

    Returns:
        Spectrally matched source audio
    """
    target_centroid = compute_spectral_centroid(target, sr)

    return apply_spectral_adjustment(
        source, sr, reference_centroid=target_centroid, intensity=intensity
    )


if __name__ == "__main__":
    print("Spectral Match Module - HAM v1")
    print("=" * 40)

    sr = 44100
    duration = 3.0

    t = np.linspace(0, duration, int(sr * duration))

    y_bright = 0.5 * (
        np.sin(2 * np.pi * 1000 * t)
        + 0.5 * np.sin(2 * np.pi * 4000 * t)
        + 0.3 * np.sin(2 * np.pi * 8000 * t)
    )

    y_dark = 0.5 * (
        np.sin(2 * np.pi * 100 * t)
        + 0.5 * np.sin(2 * np.pi * 300 * t)
        + 0.3 * np.sin(2 * np.pi * 600 * t)
    )

    profile_bright = get_spectral_profile(y_bright, sr)
    profile_dark = get_spectral_profile(y_dark, sr)

    print("Bright signal profile:")
    for k, v in profile_bright.items():
        print(f"  {k}: {v:.2f}")

    print("\nDark signal profile:")
    for k, v in profile_dark.items():
        print(f"  {k}: {v:.2f}")

    y_adjusted = apply_spectral_adjustment(
        y_dark, sr, reference_centroid=profile_bright["centroid_hz"]
    )
    centroid_adjusted = compute_spectral_centroid(y_adjusted, sr)

    print(f"\nSpectral adjustment test:")
    print(f"  Original centroid: {profile_dark['centroid_hz']:.0f} Hz")
    print(f"  Target centroid: {profile_bright['centroid_hz']:.0f} Hz")
    print(f"  Adjusted centroid: {centroid_adjusted:.0f} Hz")

    contrast = compute_spectral_contrast(y_bright, sr)
    print(f"\nSpectral contrast (bright signal): {contrast}")

    print("\n" + "=" * 40)
    print("Spectral match module ready for integration.")
