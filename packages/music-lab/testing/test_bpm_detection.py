"""
Unit Tests for BPM Detection Module
Tests both v1 (basic) and v2 (robust) tempo detection
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alignment.bpm_detection import (
    detect_bpm,
    detect_bpm_confidence,
    compute_time_stretch_ratio,
    time_stretch_audio,
    quantize_bpm,
    snap_to_grid,
)
from alignment.bpm_detection_v2 import RobustBPMDetector, BPMDetectionResult


class TestBPMDetectionV1:
    """Tests for basic BPM detection."""

    def test_detect_bpm_returns_float(self, generate_rhythmic_audio, sr):
        """Test that detect_bpm returns a float."""
        audio = generate_rhythmic_audio(bpm=120.0)
        bpm = detect_bpm(audio, sr)

        assert isinstance(bpm, float)
        assert 60.0 <= bpm <= 200.0

    def test_detect_bpm_120(self, generate_rhythmic_audio, sr):
        """Test detection of 120 BPM."""
        audio = generate_rhythmic_audio(bpm=120.0)
        bpm = detect_bpm(audio, sr)

        assert 115 <= bpm <= 125

    def test_detect_bpm_90(self, generate_rhythmic_audio, sr):
        """Test detection of 90 BPM."""
        audio = generate_rhythmic_audio(bpm=90.0)
        bpm = detect_bpm(audio, sr)

        assert 85 <= bpm <= 95

    def test_detect_bpm_140(self, generate_rhythmic_audio, sr):
        """Test detection of 140 BPM."""
        audio = generate_rhythmic_audio(bpm=140.0)
        bpm = detect_bpm(audio, sr)

        assert 135 <= bpm <= 145

    def test_detect_bpm_confidence_returns_tuple(self, generate_rhythmic_audio, sr):
        """Test that detect_bpm_confidence returns (bpm, confidence)."""
        audio = generate_rhythmic_audio(bpm=120.0)
        result = detect_bpm_confidence(audio, sr)

        assert isinstance(result, tuple)
        assert len(result) == 2
        assert isinstance(result[0], float)
        assert isinstance(result[1], float)

    def test_compute_time_stretch_ratio_same_bpm(self):
        """Test time stretch ratio for same BPM."""
        ratio = compute_time_stretch_ratio(120.0, 120.0)
        assert abs(ratio - 1.0) < 0.001

    def test_compute_time_stretch_ratio_double(self):
        """Test time stretch ratio for doubling tempo."""
        ratio = compute_time_stretch_ratio(120.0, 60.0)
        assert abs(ratio - 0.5) < 0.001

    def test_compute_time_stretch_ratio_half(self):
        """Test time stretch ratio for halving tempo."""
        ratio = compute_time_stretch_ratio(60.0, 120.0)
        assert abs(ratio - 2.0) < 0.001

    def test_quantize_bpm_standard_tempos(self):
        """Test quantization to standard tempos."""
        assert quantize_bpm(119.5) in [120, 118]
        assert quantize_bpm(120.5) in [120, 122]

    def test_snap_to_grid_basic(self, sr):
        """Test snapping to beat grid."""
        position = 0.5
        bpm = 120.0
        snapped = snap_to_grid(position, bpm, sr)

        assert isinstance(snapped, (int, float))
        assert snapped >= 0

    def test_detect_bpm_empty_audio_raises(self, sr):
        """Test that empty audio raises error."""
        with pytest.raises(ValueError):
            detect_bpm(np.array([], dtype=np.float32), sr)


class TestBPMDetectionV2:
    """Tests for robust BPM detection."""

    def test_robust_detector_initialization(self):
        """Test RobustBPMDetector initialization."""
        detector = RobustBPMDetector()
        assert detector.sr == 44100
        assert detector.min_bpm == 60.0
        assert detector.max_bpm == 200.0

    def test_robust_detector_custom_params(self):
        """Test RobustBPMDetector with custom parameters."""
        detector = RobustBPMDetector(sr=48000, min_bpm=70.0, max_bpm=180.0)
        assert detector.sr == 48000
        assert detector.min_bpm == 70.0
        assert detector.max_bpm == 180.0

    def test_detect_bpm_returns_result(self, generate_rhythmic_audio, sr):
        """Test that detect_bpm returns BPMDetectionResult."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert isinstance(result, BPMDetectionResult)
        assert isinstance(result.bpm, float)
        assert isinstance(result.confidence, float)
        assert isinstance(result.tempo_stability, float)

    def test_detect_bpm_120_robust(self, generate_rhythmic_audio, sr):
        """Test robust detection of 120 BPM."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert 115 <= result.bpm <= 125

    def test_detect_bpm_confidence_range(self, generate_rhythmic_audio, sr):
        """Test that confidence is in valid range."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert 0.0 <= result.confidence <= 1.0

    def test_detect_bpm_tempo_stability(self, generate_rhythmic_audio, sr):
        """Test tempo stability score."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert 0.0 <= result.tempo_stability <= 1.0

    def test_detect_bpm_beat_positions(self, generate_rhythmic_audio, sr):
        """Test that beat positions are returned."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert isinstance(result.beat_positions, np.ndarray)
        assert len(result.beat_positions) > 0

    def test_detect_bpm_groove_strength(self, generate_rhythmic_audio, sr):
        """Test groove strength analysis."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert isinstance(result.groove_strength, float)

    def test_detect_bpm_method_results(self, generate_rhythmic_audio, sr):
        """Test that method results are returned."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert isinstance(result.method_results, dict)
        assert len(result.method_results) > 0

    def test_detect_bpm_half_tempo_detection(self, generate_rhythmic_audio, sr):
        """Test half-tempo detection flag."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=120.0)

        result = detector.detect_bpm(audio, sr)

        assert isinstance(result.is_half_tempo, bool)
        assert isinstance(result.is_double_tempo, bool)

    def test_detect_bpm_sustained_tempo(self, generate_rhythmic_audio, sr, duration):
        """Test detection with sustained tempo over time."""
        detector = RobustBPMDetector(sr=sr)
        audio = generate_rhythmic_audio(bpm=128.0)

        result = detector.detect_bpm(audio, sr)

        assert 123 <= result.bpm <= 133


class TestBPMDetectionEdgeCases:
    """Edge case tests for BPM detection."""

    def test_silence(self, sr):
        """Test detection with silence."""
        audio = np.zeros(int(sr * 5), dtype=np.float32)

        with pytest.raises((ValueError, RuntimeError)):
            detect_bpm(audio, sr)

    def test_irregular_rhythm(self, sr, duration):
        """Test detection with irregular rhythm."""
        samples = int(sr * duration)
        audio = np.zeros(samples, dtype=np.float32)

        for i in range(0, samples - 1000, np.random.randint(5000, 20000)):
            audio[i : i + 100] = 0.5

        bpm = detect_bpm(audio, sr)

        assert isinstance(bpm, float)

    def test_slow_tempo(self, generate_rhythmic_audio, sr):
        """Test detection of slow tempo."""
        audio = generate_rhythmic_audio(bpm=65.0)
        bpm = detect_bpm(audio, sr, min_bpm=60.0)

        assert 60 <= bpm <= 70

    def test_fast_tempo(self, generate_rhythmic_audio, sr):
        """Test detection of fast tempo."""
        audio = generate_rhythmic_audio(bpm=180.0)
        bpm = detect_bpm(audio, sr, max_bpm=200.0)

        assert 175 <= bpm <= 185
