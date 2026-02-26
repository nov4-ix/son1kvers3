"""
Key Detection Module
Detects musical key from audio signals using chroma analysis

Part of the Harmonic Alignment Module (HAM v1) for hybrid music generation.
Enables key detection and pitch alignment between sections from different models.
"""

import numpy as np
import librosa
from typing import Tuple, Optional

KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

KEY_PROFILES = {
    "major": np.array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1], dtype=np.float32),
    "minor": np.array([1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0], dtype=np.float32),
}


def detect_key(
    y: np.ndarray, sr: int, n_fft: int = 4096, hop_length: int = 1024
) -> int:
    """
    Detect the dominant musical key from an audio signal.

    Uses chroma STFT analysis with mean aggregation to determine
    the most prominent key in the audio.

    Args:
        y: Audio time series (mono or stereo). Shape: (n_samples,) or (2, n_samples)
        sr: Sample rate in Hz
        n_fft: FFT window size. Default: 4096
        hop_length: Hop length between frames. Default: 1024

    Returns:
        Key index (0-11) where:
            0 = C, 1 = C#, 2 = D, ..., 11 = B

    Raises:
        ValueError: If audio array is empty or invalid

    Example:
        >>> y, sr = librosa.load('song.wav', sr=44100)
        >>> key_idx = detect_key(y, sr)
        >>> print(f"Detected key: {KEY_NAMES[key_idx]}")
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y = np.mean(y, axis=0)

    y = y.astype(np.float32)

    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, norm=2
    )

    chroma_mean = np.mean(chroma, axis=1)

    best_score = -np.inf
    best_key = 0

    for shift in range(12):
        score = np.sum(chroma_mean * np.roll(KEY_PROFILES["major"], shift))
        if score > best_score:
            best_score = score
            best_key = shift

    for shift in range(12):
        score = np.sum(chroma_mean * np.roll(KEY_PROFILES["minor"], shift))
        if score > best_score:
            best_score = score
            best_key = shift

    return int(best_key)


def detect_key_with_confidence(
    y: np.ndarray, sr: int, n_fft: int = 4096, hop_length: int = 1024
) -> Tuple[int, float]:
    """
    Detect the dominant key with confidence score.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        n_fft: FFT window size
        hop_length: Hop length between frames

    Returns:
        Tuple of (key_index, confidence) where confidence is 0.0-1.0
    """
    if y is None or y.size == 0:
        raise ValueError("Audio array cannot be empty")

    if y.ndim == 2:
        y = np.mean(y, axis=0)

    y = y.astype(np.float32)

    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, norm=2
    )

    chroma_mean = np.mean(chroma, axis=1)

    scores = []
    for shift in range(12):
        major_score = np.sum(chroma_mean * np.roll(KEY_PROFILES["major"], shift))
        minor_score = np.sum(chroma_mean * np.roll(KEY_PROFILES["minor"], shift))
        scores.append(max(major_score, minor_score))

    scores = np.array(scores)
    scores_normalized = (scores - scores.min()) / (scores.max() - scores.min() + 1e-8)

    best_key = int(np.argmax(scores_normalized))
    confidence = float(scores_normalized[best_key])

    return best_key, confidence


def compute_semitone_shift(base_key: int, target_key: int) -> int:
    """
    Compute the number of semitones to shift from base key to target key.

    Returns the shortest path (positive or negative) between keys.

    Args:
        base_key: Source key index (0-11)
        target_key: Target key index (0-11)

    Returns:
        Semitone shift amount (-6 to +6)

    Example:
        >>> compute_semitone_shift(0, 4)  # C to E
        4
        >>> compute_semitone_shift(4, 0)  # E to C
        -4
    """
    base_key = base_key % 12
    target_key = target_key % 12

    direct = target_key - base_key

    if direct > 6:
        return direct - 12
    elif direct < -6:
        return direct + 12
    else:
        return direct


def pitch_shift_audio(
    y: np.ndarray, sr: int, n_semitones: int, n_steps_per_semitone: int = 12
) -> np.ndarray:
    """
    Pitch shift audio by a specified number of semitones.

    Uses librosa's phase vocoder for high-quality pitch shifting.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        n_semitones: Number of semitones to shift (negative = down)
        n_steps_per_semitone: Resolution for pitch shifting

    Returns:
        Pitch-shifted audio array
    """
    if n_semitones == 0:
        return y.copy()

    if y.ndim == 2:
        shifted = np.zeros_like(y)
        for i in range(y.shape[0]):
            shifted[i] = librosa.effects.pitch_shift(
                y[i],
                sr=sr,
                n_steps=n_semitones,
                n_steps_per_semitone=n_steps_per_semitone,
            )
        return shifted

    return librosa.effects.pitch_shift(
        y, sr=sr, n_steps=n_semitones, n_steps_per_semitone=n_steps_per_semitone
    )


def get_key_name(key_index: int) -> str:
    """Convert key index to note name."""
    return KEY_NAMES[key_index % 12]


def estimate_mode(
    y: np.ndarray,
    sr: int,
    estimated_key: int,
    n_fft: int = 4096,
    hop_length: int = 1024,
) -> str:
    """
    Estimate whether the mode is major or minor.

    Args:
        y: Audio time series
        sr: Sample rate
        estimated_key: Previously detected key index
        n_fft: FFT window size
        hop_length: Hop length

    Returns:
        'major' or 'minor'
    """
    if y.ndim == 2:
        y = np.mean(y, axis=0)

    chroma = librosa.feature.chroma_stft(
        y=y, sr=sr, n_fft=n_fft, hop_length=hop_length, norm=2
    )

    chroma_mean = np.mean(chroma, axis=1)

    major_score = np.sum(chroma_mean * np.roll(KEY_PROFILES["major"], estimated_key))
    minor_score = np.sum(chroma_mean * np.roll(KEY_PROFILES["minor"], estimated_key))

    return "major" if major_score >= minor_score else "minor"


if __name__ == "__main__":
    print("Key Detection Module - HAM v1")
    print("=" * 40)

    sr = 44100
    duration = 5.0

    t = np.linspace(0, duration, int(sr * duration))

    freq_c4 = 261.63
    freq_e4 = 329.63
    freq_g4 = 392.00

    y_c_major = (
        0.5 * np.sin(2 * np.pi * freq_c4 * t)
        + 0.3 * np.sin(2 * np.pi * freq_e4 * t)
        + 0.2 * np.sin(2 * np.pi * freq_g4 * t)
    )

    detected = detect_key(y_c_major, sr)
    print(f"Test signal (C major chord)")
    print(f"  Detected key: {get_key_name(detected)} (index {detected})")

    key_idx, conf = detect_key_with_confidence(y_c_major, sr)
    mode = estimate_mode(y_c_major, sr, key_idx)
    print(f"  Confidence: {conf:.2f}")
    print(f"  Mode: {mode}")

    shift = compute_semitone_shift(detected, 4)
    print(f"\n  Shift from {get_key_name(detected)} to E: {shift:+d} semitones")

    print("\n" + "=" * 40)
    print("Key detection module ready for integration.")
