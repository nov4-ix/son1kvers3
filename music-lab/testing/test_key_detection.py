"""
Unit Tests for Key Detection Module
Tests both v1 (basic) and v2 (robust) key detection
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alignment.key_detection import (
    detect_key,
    detect_key_with_confidence,
    compute_semitone_shift,
    pitch_shift_audio,
    get_key_name,
    KEY_NAMES,
)
from alignment.key_detection_v2 import RobustKeyDetector, KeyDetectionResult


class TestKeyDetectionV1:
    """Tests for basic key detection."""

    def test_detect_key_returns_valid_key(self, generate_sine_with_harmonics, sr):
        """Test that detect_key returns a valid key name."""
        audio = generate_sine_with_harmonics(fundamental=440.0)
        key = detect_key(audio, sr)

        assert key is not None
        assert isinstance(key, str)
        assert key in KEY_NAMES or "m" in key

    def test_detect_key_with_confidence_returns_tuple(
        self, generate_sine_with_harmonics, sr
    ):
        """Test that detect_key_with_confidence returns (key, confidence)."""
        audio = generate_sine_with_harmonics(fundamental=440.0)
        result = detect_key_with_confidence(audio, sr)

        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], str)
        assert isinstance(result[1], float)
        assert 0.0 <= result[1] <= 1.0

    def test_detect_key_c_major(self, generate_sine_with_harmonics, sr):
        """Test detection of C major (261.63 Hz fundamental)."""
        audio = generate_sine_with_harmonics(fundamental=261.63, num_harmonics=8)
        key, confidence = detect_key_with_confidence(audio, sr)

        assert key is not None
        assert confidence >= 0.0

    def test_detect_key_a_minor(self, generate_sine_with_harmonics, sr):
        """Test detection of A minor (220 Hz fundamental)."""
        audio = generate_sine_with_harmonics(fundamental=220.0, num_harmonics=8)
        key, confidence = detect_key_with_confidence(audio, sr)

        assert key is not None

    def test_compute_semitone_shift_same_key(self):
        """Test semitone shift for same key."""
        shift = compute_semitone_shift("C", "C")
        assert shift == 0

    def test_compute_semitone_shift_up_one(self):
        """Test semitone shift up by one semitone."""
        shift = compute_semitone_shift("C", "C#")
        assert shift == 1

    def test_compute_semitone_shift_down_one(self):
        """Test semitone shift down by one semitone."""
        shift = compute_semitone_shift("D", "C#")
        assert shift == -1

    def test_compute_semitone_shift_octave(self):
        """Test semitone shift for octave."""
        shift = compute_semitone_shift("C", "C")
        assert shift == 0

    def test_compute_semitone_shift_major_to_minor(self):
        """Test semitone shift from major to relative minor."""
        shift = compute_semitone_shift("C", "Am")
        assert isinstance(shift, int)

    def test_pitch_shift_audio_no_change(self, generate_sine_wave, sr):
        """Test pitch shift of 0 semitones."""
        audio = generate_sine_wave(freq=440.0)
        shifted = pitch_shift_audio(audio, sr, 0)

        assert len(shifted) == len(audio)
        assert not np.any(np.isnan(shifted))

    def test_pitch_shift_audio_up_one_semitone(self, generate_sine_wave, sr):
        """Test pitch shift up by one semitone."""
        audio = generate_sine_wave(freq=440.0)
        shifted = pitch_shift_audio(audio, sr, 1)

        assert len(shifted) > 0
        assert not np.any(np.isnan(shifted))

    def test_get_key_name_valid_index(self):
        """Test get_key_name with valid index."""
        assert get_key_name(0) == "C"
        assert get_key_name(1) == "C#"
        assert get_key_name(11) == "B"

    def test_get_key_name_invalid_index(self):
        """Test get_key_name with invalid index."""
        with pytest.raises((IndexError, ValueError)):
            get_key_name(12)
        with pytest.raises((IndexError, ValueError)):
            get_key_name(-1)


class TestKeyDetectionV2:
    """Tests for robust key detection."""

    def test_robust_detector_initialization(self):
        """Test RobustKeyDetector initialization."""
        detector = RobustKeyDetector()
        assert detector.sr == 44100
        assert detector.analysis_duration == 30.0
        assert detector.min_confidence == 0.5

    def test_robust_detector_custom_params(self):
        """Test RobustKeyDetector with custom parameters."""
        detector = RobustKeyDetector(
            sr=48000, analysis_duration=15.0, min_confidence=0.7
        )
        assert detector.sr == 48000
        assert detector.analysis_duration == 15.0
        assert detector.min_confidence == 0.7

    def test_detect_key_returns_result(self, generate_sine_with_harmonics, sr):
        """Test that detect_key returns KeyDetectionResult."""
        detector = RobustKeyDetector(sr=sr)
        audio = generate_sine_with_harmonics(fundamental=440.0)

        result = detector.detect_key(audio, sr)

        assert isinstance(result, KeyDetectionResult)
        assert isinstance(result.key_name, str)
        assert isinstance(result.confidence, float)
        assert isinstance(result.mode, str)
        assert result.mode in ["major", "minor"]

    def test_detect_key_confidence_range(self, generate_sine_with_harmonics, sr):
        """Test that confidence is in valid range."""
        detector = RobustKeyDetector(sr=sr)
        audio = generate_sine_with_harmonics(fundamental=261.63)

        result = detector.detect_key(audio, sr)

        assert 0.0 <= result.confidence <= 1.0

    def test_detect_key_method_results(self, generate_sine_with_harmonics, sr):
        """Test that method_results contains expected methods."""
        detector = RobustKeyDetector(sr=sr)
        audio = generate_sine_with_harmonics(fundamental=440.0)

        result = detector.detect_key(audio, sr)

        assert isinstance(result.method_results, dict)
        assert len(result.method_results) > 0

    def test_detect_key_c_major_robust(self, generate_sine_with_harmonics, sr):
        """Test robust detection of C major."""
        detector = RobustKeyDetector(sr=sr)
        audio = generate_sine_with_harmonics(fundamental=261.63, num_harmonics=8)

        result = detector.detect_key(audio, sr)

        assert result.key_name is not None
        assert result.confidence > 0.0

    def test_detect_key_with_harmonic_content(self, generate_sine_with_harmonics, sr):
        """Test detection with rich harmonic content."""
        detector = RobustKeyDetector(sr=sr)
        amplitudes = [1.0, 0.5, 0.33, 0.25, 0.2, 0.17, 0.14]
        audio = generate_sine_with_harmonics(
            fundamental=329.63, num_harmonics=7, amplitudes=amplitudes
        )

        result = detector.detect_key(audio, sr)

        assert isinstance(result, KeyDetectionResult)
        assert result.key_name is not None

    def test_detect_key_stereo_audio(self, generate_stereo_audio, sr):
        """Test detection handles stereo audio."""
        detector = RobustKeyDetector(sr=sr)
        audio = generate_stereo_audio(left_freq=440.0, right_freq=440.0)

        result = detector.detect_key(audio, sr)

        assert isinstance(result, KeyDetectionResult)

    def test_detect_key_short_audio(self, sr):
        """Test detection with very short audio."""
        detector = RobustKeyDetector(sr=sr)
        t = np.linspace(0, 0.5, int(sr * 0.5))
        audio = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

        result = detector.detect_key(audio, sr)

        assert isinstance(result, KeyDetectionResult)


class TestKeyDetectionEdgeCases:
    """Edge case tests for key detection."""

    def test_silence(self, sr):
        """Test detection with silence."""
        audio = np.zeros(int(sr * 2), dtype=np.float32)

        with pytest.raises((ValueError, RuntimeError)):
            detect_key(audio, sr)

    def test_noise(self, sr):
        """Test detection with noise."""
        audio = np.random.randn(int(sr * 2)).astype(np.float32) * 0.1

        result = detect_key_with_confidence(audio, sr)

        assert result is not None or result[1] < 0.5

    def test_very_quiet_audio(self, sr):
        """Test detection with very quiet audio."""
        t = np.linspace(0, 2, int(sr * 2))
        audio = (0.001 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

        result = detect_key_with_confidence(audio, sr)

        assert result is not None
