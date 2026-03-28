"""
Unit Tests for Chord Detection Module
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alignment.chord_detection import (
    ChordDetector,
    ChordDetectionResult,
    ChordProgression,
)


class TestChordDetector:
    """Tests for chord detection."""

    def test_detector_initialization(self):
        """Test ChordDetector initialization."""
        detector = ChordDetector()
        assert detector is not None

    def test_detector_custom_params(self):
        """Test ChordDetector with custom parameters."""
        detector = ChordDetector(sr=48000, hop_length=1024)
        assert detector.sr == 48000
        assert detector.hop_length == 1024

    def test_detect_chord_returns_result(self, generate_chord_progression, sr):
        """Test that detect_chord returns ChordDetectionResult."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression()

        result = detector.detect_chord(audio, sr, time=0.5)

        assert isinstance(result, ChordDetectionResult)

    def test_detect_progression_returns_progression(
        self, generate_chord_progression, sr
    ):
        """Test that detect_progression returns ChordProgression."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression()

        result = detector.detect_progression(audio, sr)

        assert isinstance(result, ChordProgression)

    def test_detect_progression_c_major(self, generate_chord_progression, sr):
        """Test detection of C major chord."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression(chords=[(261.63, 329.63, 392.00)])

        result = detector.detect_progression(audio, sr)

        assert len(result.chords) > 0
        assert result.chords[0].chord is not None

    def test_detect_progression_g_major(self, generate_chord_progression, sr):
        """Test detection of G major chord."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression(chords=[(196.00, 246.94, 293.66)])

        result = detector.detect_progression(audio, sr)

        assert len(result.chords) > 0

    def test_detect_progression_confidence(self, generate_chord_progression, sr):
        """Test that confidence scores are in valid range."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression()

        result = detector.detect_progression(audio, sr)

        for chord in result.chords:
            assert 0.0 <= chord.confidence <= 1.0

    def test_detect_progression_times(self, generate_chord_progression, sr, duration):
        """Test that chord times are correctly assigned."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression()

        result = detector.detect_progression(audio, sr)

        for chord in result.chords:
            assert 0.0 <= chord.time <= duration

    def test_detect_progression_chord_format(self, generate_chord_progression, sr):
        """Test that chord names are in expected format."""
        detector = ChordDetector(sr=sr)
        audio = generate_chord_progression()

        result = detector.detect_progression(audio, sr)

        valid_chord_pattern = True
        for chord in result.chords:
            name = chord.chord
            if name != "N":
                assert len(name) >= 1

    def test_get_chord_from_chroma(self, sr):
        """Test chroma to chord mapping."""
        detector = ChordDetector(sr=sr)

        c_major_chroma = np.array([1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0])
        chord, confidence = detector.get_chord_from_chroma(c_major_chroma)

        assert chord is not None
        assert 0.0 <= confidence <= 1.0


class TestChordProgression:
    """Tests for ChordProgression dataclass."""

    def test_progression_attributes(self):
        """Test ChordProgression has expected attributes."""
        progression = ChordProgression(
            chords=[],
            key="C",
            mode="major",
            duration=10.0,
        )

        assert progression.chords == []
        assert progression.key == "C"
        assert progression.mode == "major"
        assert progression.duration == 10.0

    def test_progression_with_chords(self):
        """Test ChordProgression with chord results."""
        chord1 = ChordDetectionResult(chord="C", confidence=0.9, time=0.0)
        chord2 = ChordDetectionResult(chord="G", confidence=0.85, time=2.0)

        progression = ChordProgression(
            chords=[chord1, chord2],
            key="C",
            mode="major",
            duration=5.0,
        )

        assert len(progression.chords) == 2
        assert progression.chords[0].chord == "C"
        assert progression.chords[1].chord == "G"


class TestChordDetectionEdgeCases:
    """Edge case tests for chord detection."""

    def test_silence(self, sr):
        """Test detection with silence."""
        detector = ChordDetector(sr=sr)
        audio = np.zeros(int(sr * 2), dtype=np.float32)

        result = detector.detect_progression(audio, sr)

        assert isinstance(result, ChordProgression)

    def test_noise(self, sr):
        """Test detection with noise."""
        detector = ChordDetector(sr=sr)
        audio = np.random.randn(int(sr * 2)).astype(np.float32) * 0.1

        result = detector.detect_progression(audio, sr)

        assert isinstance(result, ChordProgression)

    def test_single_note(self, generate_sine_wave, sr):
        """Test detection with single note (no chord)."""
        detector = ChordDetector(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = detector.detect_progression(audio, sr)

        assert isinstance(result, ChordProgression)

    def test_short_audio(self, sr):
        """Test detection with very short audio."""
        detector = ChordDetector(sr=sr)
        t = np.linspace(0, 0.3, int(sr * 0.3))
        audio = (0.3 * np.sin(2 * np.pi * 261.63 * t)).astype(np.float32)

        result = detector.detect_progression(audio, sr)

        assert isinstance(result, ChordProgression)
