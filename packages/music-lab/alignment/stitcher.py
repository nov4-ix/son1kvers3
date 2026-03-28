"""
Stitcher Module
Crossfades and concatenates audio sections smoothly

Part of the Harmonic Alignment Module (HAM v1) for hybrid music generation.
Provides clean section transitions without clicks or artifacts.
"""

import numpy as np
from typing import Optional, List, Tuple


def crossfade(
    a: np.ndarray,
    b: np.ndarray,
    fade_duration: float,
    sr: int,
    curve: str = "logarithmic",
    mode: str = "equal_power",
) -> np.ndarray:
    """
    Crossfade two audio signals with logarithmic fade curves.

    Creates a smooth transition between sections by fading out
    the first signal while fading in the second.

    Args:
        a: First audio section (will fade out at the end)
        b: Second audio section (will fade in at the start)
        fade_duration: Duration of crossfade in seconds. Default: 2.0
        sr: Sample rate in Hz
        curve: Fade curve type ('linear', 'logarithmic', 'exponential')
        mode: Crossfade mode ('equal_power', 'equal_gain')

    Returns:
        Crossfaded audio combining both sections

    Raises:
        ValueError: If fade_duration exceeds audio length

    Example:
        >>> combined = crossfade(verse, chorus, fade_duration=2.0, sr=44100)
    """
    fade_samples = int(fade_duration * sr)

    if a.ndim == 2:
        a_len = a.shape[1]
    else:
        a_len = len(a)

    if b.ndim == 2:
        b_len = b.shape[1]
    else:
        b_len = len(b)

    if fade_samples > a_len or fade_samples > b_len:
        fade_samples = min(a_len // 2, b_len // 2)

    if fade_samples < 1:
        fade_samples = 1

    fade_out = _generate_fade_curve(fade_samples, curve, "out")
    fade_in = _generate_fade_curve(fade_samples, curve, "in")

    if mode == "equal_power":
        fade_out = np.sqrt(fade_out)
        fade_in = np.sqrt(fade_in)

    a = a.copy().astype(np.float32)
    b = b.copy().astype(np.float32)

    if a.ndim == 2:
        a_crossfade_region = a[:, -fade_samples:]
        for ch in range(a.shape[0]):
            a_crossfade_region[ch] *= fade_out
        a[:, -fade_samples:] = a_crossfade_region

        b_crossfade_region = b[:, :fade_samples]
        for ch in range(b.shape[0]):
            b_crossfade_region[ch] *= fade_in
        b[:, :fade_samples] = b_crossfade_region

        overlap = a[:, -fade_samples:] + b[:, :fade_samples]

        combined = np.concatenate(
            [a[:, :-fade_samples], overlap, b[:, fade_samples:]], axis=1
        )
    else:
        a[-fade_samples:] *= fade_out
        b[:fade_samples] *= fade_in

        overlap = a[-fade_samples:] + b[:fade_samples]

        combined = np.concatenate([a[:-fade_samples], overlap, b[fade_samples:]])

    max_val = np.max(np.abs(combined))
    if max_val > 0.99:
        combined = combined * (0.95 / max_val)

    return combined.astype(np.float32)


def _generate_fade_curve(samples: int, curve_type: str, direction: str) -> np.ndarray:
    """
    Generate a fade curve for crossfading.

    Args:
        samples: Number of samples
        curve_type: 'linear', 'logarithmic', 'exponential'
        direction: 'in' or 'out'

    Returns:
        Fade curve array
    """
    if curve_type == "linear":
        if direction == "in":
            return np.linspace(0, 1, samples, dtype=np.float32)
        else:
            return np.linspace(1, 0, samples, dtype=np.float32)

    elif curve_type == "logarithmic":
        if direction == "in":
            curve = np.logspace(-3, 0, samples, dtype=np.float32)
            return curve / curve[-1]
        else:
            curve = np.logspace(0, -3, samples, dtype=np.float32)
            return curve / curve[0]

    elif curve_type == "exponential":
        if direction == "in":
            curve = np.exp(np.linspace(-6, 0, samples, dtype=np.float32))
            return curve / curve[-1]
        else:
            curve = np.exp(np.linspace(0, -6, samples, dtype=np.float32))
            return curve

    else:
        if direction == "in":
            return np.linspace(0, 1, samples, dtype=np.float32)
        else:
            return np.linspace(1, 0, samples, dtype=np.float32)


def concatenate_with_crossfade(
    sections: List[np.ndarray],
    sr: int,
    fade_duration: float = 2.0,
    apply_fade_edges: bool = True,
) -> np.ndarray:
    """
    Concatenate multiple audio sections with crossfades between each.

    Args:
        sections: List of audio arrays to concatenate
        sr: Sample rate in Hz
        fade_duration: Crossfade duration in seconds
        apply_fade_edges: Apply fade in/out at start/end

    Returns:
        Concatenated audio with smooth transitions

    Raises:
        ValueError: If sections list is empty
    """
    if not sections:
        raise ValueError("Sections list cannot be empty")

    if len(sections) == 1:
        result = sections[0].copy().astype(np.float32)
        if apply_fade_edges:
            result = _apply_edge_fades(result, sr)
        return result

    result = sections[0].copy().astype(np.float32)

    for i in range(1, len(sections)):
        current = sections[i].copy().astype(np.float32)
        result = crossfade(result, current, fade_duration, sr)

    if apply_fade_edges:
        result = _apply_edge_fades(result, sr)

    return result


def _apply_edge_fades(
    y: np.ndarray, sr: int, fade_duration: float = 0.05
) -> np.ndarray:
    """Apply short fade in/out at edges to prevent clicks."""
    fade_samples = int(fade_duration * sr)

    y = y.copy()

    if y.ndim == 2:
        total_samples = y.shape[1]
        if fade_samples > total_samples:
            fade_samples = total_samples // 4

        fade_in = np.linspace(0, 1, fade_samples, dtype=np.float32)
        fade_out = np.linspace(1, 0, fade_samples, dtype=np.float32)

        y[:, :fade_samples] *= fade_in
        y[:, -fade_samples:] *= fade_out
    else:
        total_samples = len(y)
        if fade_samples > total_samples:
            fade_samples = total_samples // 4

        fade_in = np.linspace(0, 1, fade_samples, dtype=np.float32)
        fade_out = np.linspace(1, 0, fade_samples, dtype=np.float32)

        y[:fade_samples] *= fade_in
        y[-fade_samples:] *= fade_out

    return y


def butt_splice(
    a: np.ndarray, b: np.ndarray, fade_duration: float = 0.01, sr: int = 44100
) -> np.ndarray:
    """
    Simple butt splice with minimal fade to prevent clicks.

    Useful for quick concatenation where full crossfade isn't needed.

    Args:
        a: First audio section
        b: Second audio section
        fade_duration: Short fade duration in seconds
        sr: Sample rate in Hz

    Returns:
        Concatenated audio
    """
    fade_samples = int(fade_duration * sr)

    a = a.copy().astype(np.float32)
    b = b.copy().astype(np.float32)

    if a.ndim == 2:
        if fade_samples > 0 and fade_samples < a.shape[1] and fade_samples < b.shape[1]:
            fade_out = np.linspace(1, 0, fade_samples, dtype=np.float32)
            fade_in = np.linspace(0, 1, fade_samples, dtype=np.float32)

            a[:, -fade_samples:] *= fade_out
            b[:, :fade_samples] *= fade_in

        combined = np.concatenate([a, b], axis=1)
    else:
        if fade_samples > 0 and fade_samples < len(a) and fade_samples < len(b):
            fade_out = np.linspace(1, 0, fade_samples, dtype=np.float32)
            fade_in = np.linspace(0, 1, fade_samples, dtype=np.float32)

            a[-fade_samples:] *= fade_out
            b[:fade_samples] *= fade_in

        combined = np.concatenate([a, b])

    return combined


def beat_synced_crossfade(
    a: np.ndarray, b: np.ndarray, sr: int, bpm: float, beats_per_crossfade: int = 2
) -> np.ndarray:
    """
    Crossfade synchronized to musical beats.

    Args:
        a: First audio section
        b: Second audio section
        sr: Sample rate in Hz
        bpm: Tempo in beats per minute
        beats_per_crossfade: Number of beats for crossfade

    Returns:
        Beat-synced crossfaded audio
    """
    beat_duration = 60.0 / bpm
    fade_duration = beat_duration * beats_per_crossfade

    return crossfade(a, b, fade_duration, sr)


def trim_silence(
    y: np.ndarray, sr: int, threshold_db: float = -40.0, min_silence_samples: int = 512
) -> np.ndarray:
    """
    Trim silence from start and end of audio.

    Args:
        y: Audio time series
        sr: Sample rate in Hz
        threshold_db: Silence threshold in dB
        min_silence_samples: Minimum samples to consider as silence

    Returns:
        Trimmed audio
    """
    threshold_linear = 10 ** (threshold_db / 20)

    if y.ndim == 2:
        mono = np.mean(np.abs(y), axis=0)
    else:
        mono = np.abs(y)

    non_silent = mono > threshold_linear

    if not np.any(non_silent):
        return y

    start = np.argmax(non_silent)
    end = len(non_silent) - np.argmax(non_silent[::-1])

    if end <= start:
        return y

    if y.ndim == 2:
        return y[:, start:end]
    else:
        return y[start:end]


def pad_to_length(y: np.ndarray, target_length: int, mode: str = "zero") -> np.ndarray:
    """
    Pad audio to target length.

    Args:
        y: Audio time series
        target_length: Target length in samples
        mode: Padding mode ('zero', 'reflect', 'edge')

    Returns:
        Padded audio
    """
    if y.ndim == 2:
        current_length = y.shape[1]
        if current_length >= target_length:
            return y[:, :target_length]

        pad_length = target_length - current_length

        if mode == "zero":
            return np.pad(y, ((0, 0), (0, pad_length)), mode="constant")
        elif mode == "reflect":
            return np.pad(y, ((0, 0), (0, pad_length)), mode="reflect")
        elif mode == "edge":
            return np.pad(y, ((0, 0), (0, pad_length)), mode="edge")
    else:
        current_length = len(y)
        if current_length >= target_length:
            return y[:target_length]

        pad_length = target_length - current_length

        if mode == "zero":
            return np.pad(y, (0, pad_length), mode="constant")
        elif mode == "reflect":
            return np.pad(y, (0, pad_length), mode="reflect")
        elif mode == "edge":
            return np.pad(y, (0, pad_length), mode="edge")

    return y


if __name__ == "__main__":
    print("Stitcher Module - HAM v1")
    print("=" * 40)

    sr = 44100
    duration = 3.0

    t = np.linspace(0, duration, int(sr * duration))

    a = 0.5 * np.sin(2 * np.pi * 440 * t)
    b = 0.5 * np.sin(2 * np.pi * 880 * t)

    print("Test crossfade (2 second logarithmic):")
    combined = crossfade(a, b, fade_duration=2.0, sr=sr)
    print(f"  Input A length: {len(a)} samples ({duration:.1f}s)")
    print(f"  Input B length: {len(b)} samples ({duration:.1f}s)")
    print(f"  Combined length: {len(combined)} samples ({len(combined) / sr:.1f}s)")

    print("\nTest beat-synced crossfade (120 BPM, 2 beats):")
    beat_synced = beat_synced_crossfade(a, b, sr, bpm=120.0)
    expected_fade = (60.0 / 120.0) * 2
    print(f"  Expected fade duration: {expected_fade:.2f}s")
    print(f"  Combined length: {len(beat_synced) / sr:.1f}s")

    print("\nTest multi-section concatenation:")
    sections = [a, b, a.copy()]
    concatenated = concatenate_with_crossfade(sections, sr, fade_duration=1.0)
    print(f"  3 sections of {duration:.1f}s each")
    print(f"  Total length: {len(concatenated) / sr:.1f}s")

    print("\nTest silence trimming:")
    silence = np.zeros(int(sr * 0.5))
    padded = np.concatenate([silence, a, silence])
    trimmed = trim_silence(padded, sr)
    print(f"  Original: {len(padded) / sr:.1f}s")
    print(f"  Trimmed: {len(trimmed) / sr:.1f}s")

    print("\n" + "=" * 40)
    print("Stitcher module ready for integration.")
