"""
Test Fixtures and Utilities
Shared fixtures for all test modules
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def sr():
    """Standard sample rate for tests."""
    return 44100


@pytest.fixture
def duration():
    """Standard duration for test audio."""
    return 5.0


@pytest.fixture
def generate_sine_wave(sr, duration):
    """Generate a simple sine wave for testing."""

    def _generate(freq=440.0, amplitude=0.5):
        t = np.linspace(0, duration, int(sr * duration))
        audio = amplitude * np.sin(2 * np.pi * freq * t)
        return audio.astype(np.float32)

    return _generate


@pytest.fixture
def generate_sine_with_harmonics(sr, duration):
    """Generate a sine wave with harmonics for key detection tests."""

    def _generate(fundamental=440.0, num_harmonics=5, amplitudes=None):
        if amplitudes is None:
            amplitudes = [1.0 / (i + 1) for i in range(num_harmonics)]

        t = np.linspace(0, duration, int(sr * duration))
        audio = np.zeros(len(t))

        for i in range(num_harmonics):
            freq = fundamental * (i + 1)
            if i < len(amplitudes):
                audio += amplitudes[i] * np.sin(2 * np.pi * freq * t)

        audio = audio / np.max(np.abs(audio)) * 0.5
        return audio.astype(np.float32)

    return _generate


@pytest.fixture
def generate_rhythmic_audio(sr, duration):
    """Generate rhythmic audio for BPM detection tests."""

    def _generate(bpm=120.0, beat_freq=100.0):
        samples = int(sr * duration)
        audio = np.zeros(samples)

        beat_interval = int(60.0 / bpm * sr)
        beat_duration = int(0.1 * sr)

        for i in range(0, samples - beat_duration, beat_interval):
            t = np.linspace(0, 0.1, beat_duration)
            beat = 0.8 * np.sin(2 * np.pi * beat_freq * t) * np.exp(-t * 20)
            audio[i : i + beat_duration] = beat

        return audio.astype(np.float32)

    return _generate


@pytest.fixture
def generate_chord_progression(sr, duration):
    """Generate a simple chord progression for chord detection tests."""

    def _generate(chords=None):
        if chords is None:
            chords = [(261.63, 329.63, 392.00), (293.66, 369.99, 440.00)]

        samples_per_chord = int(sr * duration / len(chords))
        audio = np.zeros(int(sr * duration))

        for i, chord in enumerate(chords):
            start = i * samples_per_chord
            end = start + samples_per_chord
            t = np.linspace(0, duration / len(chords), samples_per_chord)

            for freq in chord:
                audio[start:end] += 0.3 * np.sin(2 * np.pi * freq * t)

        audio = audio / np.max(np.abs(audio)) * 0.5
        return audio.astype(np.float32)

    return _generate


@pytest.fixture
def generate_stereo_audio(sr, duration):
    """Generate stereo audio for stereo analysis tests."""

    def _generate(left_freq=440.0, right_freq=440.0, phase_diff=0.0):
        t = np.linspace(0, duration, int(sr * duration))
        left = 0.5 * np.sin(2 * np.pi * left_freq * t)
        right = 0.5 * np.sin(2 * np.pi * right_freq * t + phase_diff)
        return np.stack([left, right]).astype(np.float32)

    return _generate


@pytest.fixture
def noisy_audio(sr, duration):
    """Generate noisy audio for artifact detection tests."""
    t = np.linspace(0, duration, int(sr * duration))
    clean = 0.3 * np.sin(2 * np.pi * 440 * t)
    noise = np.random.randn(len(t)) * 0.2
    return (clean + noise).astype(np.float32)


@pytest.fixture
def clipped_audio(sr, duration):
    """Generate clipped audio for artifact detection tests."""
    t = np.linspace(0, duration, int(sr * duration))
    audio = 1.5 * np.sin(2 * np.pi * 440 * t)
    audio = np.clip(audio, -1.0, 1.0)
    return audio.astype(np.float32)


class AudioTestUtils:
    """Utility class for audio testing assertions."""

    @staticmethod
    def assert_audio_length(audio, expected_samples, tolerance=100):
        """Assert audio length is within tolerance."""
        actual = len(audio)
        assert abs(actual - expected_samples) <= tolerance, (
            f"Audio length {actual} differs from expected {expected_samples} "
            f"by more than {tolerance} samples"
        )

    @staticmethod
    def assert_no_nan(audio):
        """Assert audio contains no NaN values."""
        assert not np.any(np.isnan(audio)), "Audio contains NaN values"

    @staticmethod
    def assert_no_inf(audio):
        """Assert audio contains no infinity values."""
        assert not np.any(np.isinf(audio)), "Audio contains infinity values"

    @staticmethod
    def assert_peak_within_range(audio, min_peak=0.0, max_peak=1.0):
        """Assert peak amplitude is within expected range."""
        peak = np.max(np.abs(audio))
        assert min_peak <= peak <= max_peak, (
            f"Peak amplitude {peak} outside range [{min_peak}, {max_peak}]"
        )

    @staticmethod
    def assert_duration_approx(audio, sr, expected_duration, tolerance=0.1):
        """Assert audio duration is approximately correct."""
        actual_duration = len(audio) / sr
        assert abs(actual_duration - expected_duration) <= tolerance, (
            f"Duration {actual_duration:.2f}s differs from expected "
            f"{expected_duration:.2f}s by more than {tolerance}s"
        )


@pytest.fixture
def audio_utils():
    """Provide audio test utilities."""
    return AudioTestUtils()
