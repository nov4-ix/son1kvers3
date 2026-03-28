"""
Unit Tests for Stitcher Module
Tests both v1 (basic) and v2 (advanced) audio stitching
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from alignment.stitcher import (
    crossfade,
    concatenate_with_crossfade,
    butt_splice,
    beat_synced_crossfade,
    trim_silence,
    pad_to_length,
)
from alignment.stitcher_v2 import AdvancedStitcher, CrossfadeConfig, SplicePoint


class TestStitcherV1:
    """Tests for basic audio stitching."""

    def test_crossfade_returns_audio(self, generate_sine_wave, sr):
        """Test that crossfade returns audio array."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = crossfade(audio_a, audio_b, duration=1.0, sr=sr)

        assert isinstance(result, np.ndarray)
        assert len(result) > 0

    def test_crossfade_length(self, generate_sine_wave, sr):
        """Test that crossfade produces correct length."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = crossfade(audio_a, audio_b, duration=1.0, sr=sr)

        expected_min = min(len(audio_a), len(audio_b))
        assert len(result) >= expected_min

    def test_crossfade_no_nan(self, generate_sine_wave, sr):
        """Test that crossfade produces no NaN values."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = crossfade(audio_a, audio_b, duration=1.0, sr=sr)

        assert not np.any(np.isnan(result))

    def test_crossfade_no_inf(self, generate_sine_wave, sr):
        """Test that crossfade produces no infinity values."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = crossfade(audio_a, audio_b, duration=1.0, sr=sr)

        assert not np.any(np.isinf(result))

    def test_concatenate_with_crossfade(self, generate_sine_wave, sr):
        """Test concatenating multiple audio sections."""
        sections = [
            generate_sine_wave(freq=440.0),
            generate_sine_wave(freq=523.25),
            generate_sine_wave(freq=659.25),
        ]

        result = concatenate_with_crossfade(sections, crossfade_duration=0.5, sr=sr)

        assert isinstance(result, np.ndarray)
        assert len(result) > sum(len(s) for s in sections) - 2 * int(0.5 * sr) * 2

    def test_concatenate_single_section(self, generate_sine_wave, sr):
        """Test concatenating single section."""
        sections = [generate_sine_wave(freq=440.0)]

        result = concatenate_with_crossfade(sections, crossfade_duration=0.5, sr=sr)

        assert len(result) == len(sections[0])

    def test_butt_splice(self, generate_sine_wave, sr):
        """Test basic butt splice (no crossfade)."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = butt_splice(audio_a, audio_b)

        assert len(result) == len(audio_a) + len(audio_b)

    def test_beat_synced_crossfade(self, generate_sine_wave, sr):
        """Test beat-synchronized crossfade."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = beat_synced_crossfade(audio_a, audio_b, bpm=120.0, sr=sr)

        assert isinstance(result, np.ndarray)
        assert len(result) > 0

    def test_trim_silence(self, sr):
        """Test trimming silence from audio."""
        audio = np.zeros(int(sr * 2), dtype=np.float32)
        audio[int(sr * 0.5) : int(sr * 1.5)] = 0.5

        result = trim_silence(audio, threshold=0.01)

        assert len(result) < len(audio)

    def test_trim_silence_no_silence(self, generate_sine_wave, sr):
        """Test trimming when there's no silence."""
        audio = generate_sine_wave(freq=440.0)

        result = trim_silence(audio, threshold=0.001)

        assert len(result) == len(audio)

    def test_pad_to_length_extend(self, generate_sine_wave, sr):
        """Test padding audio to longer length."""
        audio = generate_sine_wave(freq=440.0)
        target_length = len(audio) + 1000

        result = pad_to_length(audio, target_length)

        assert len(result) == target_length

    def test_pad_to_length_shorten(self, generate_sine_wave, sr):
        """Test padding audio to shorter length."""
        audio = generate_sine_wave(freq=440.0)
        target_length = len(audio) - 1000

        result = pad_to_length(audio, target_length)

        assert len(result) == target_length


class TestStitcherV2:
    """Tests for advanced audio stitching."""

    def test_advanced_stitcher_initialization(self):
        """Test AdvancedStitcher initialization."""
        stitcher = AdvancedStitcher()
        assert stitcher.sr == 44100
        assert stitcher.config is not None

    def test_advanced_stitcher_custom_config(self):
        """Test AdvancedStitcher with custom config."""
        config = CrossfadeConfig(duration=3.0, curve_type="logarithmic")
        stitcher = AdvancedStitcher(sr=48000, config=config)

        assert stitcher.sr == 48000
        assert stitcher.config.duration == 3.0
        assert stitcher.config.curve_type == "logarithmic"

    def test_crossfade_smart_returns_audio(self, generate_sine_wave, sr):
        """Test that crossfade_smart returns audio array."""
        stitcher = AdvancedStitcher(sr=sr)
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = stitcher.crossfade_smart(audio_a, audio_b)

        assert isinstance(result, np.ndarray)
        assert len(result) > 0

    def test_crossfade_smart_with_bpm(self, generate_sine_wave, sr):
        """Test crossfade_smart with BPM sync."""
        stitcher = AdvancedStitcher(sr=sr)
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = stitcher.crossfade_smart(audio_a, audio_b, bpm=120.0)

        assert isinstance(result, np.ndarray)
        assert not np.any(np.isnan(result))

    def test_crossfade_smart_no_nan(self, generate_sine_wave, sr):
        """Test that crossfade_smart produces no NaN values."""
        stitcher = AdvancedStitcher(sr=sr)
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = stitcher.crossfade_smart(audio_a, audio_b)

        assert not np.any(np.isnan(result))

    def test_find_optimal_splice_point(self, generate_sine_wave, sr):
        """Test finding optimal splice point."""
        stitcher = AdvancedStitcher(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = stitcher.find_optimal_splice_point(
            audio, search_start=0, search_end=len(audio)
        )

        assert isinstance(result, SplicePoint)
        assert result.sample_index >= 0
        assert result.sample_index < len(audio)

    def test_create_crossfade_curve_linear(self, sr):
        """Test linear crossfade curve."""
        stitcher = AdvancedStitcher(sr=sr)
        config = CrossfadeConfig(curve_type="linear")
        stitcher.config = config

        curve = stitcher.create_crossfade_curve(1000)

        assert len(curve) == 1000
        assert curve[0] >= 0
        assert curve[-1] <= 1

    def test_create_crossfade_curve_equal_power(self, sr):
        """Test equal power crossfade curve."""
        stitcher = AdvancedStitcher(sr=sr)
        config = CrossfadeConfig(curve_type="equal_power")
        stitcher.config = config

        curve = stitcher.create_crossfade_curve(1000)

        assert len(curve) == 1000

    def test_create_crossfade_curve_logarithmic(self, sr):
        """Test logarithmic crossfade curve."""
        stitcher = AdvancedStitcher(sr=sr)
        config = CrossfadeConfig(curve_type="logarithmic")
        stitcher.config = config

        curve = stitcher.create_crossfade_curve(1000)

        assert len(curve) == 1000


class TestCrossfadeConfig:
    """Tests for CrossfadeConfig dataclass."""

    def test_default_config(self):
        """Test default configuration values."""
        config = CrossfadeConfig()

        assert config.duration == 2.0
        assert config.curve_type == "equal_power"
        assert config.prevent_clips is True
        assert config.match_energy is True

    def test_custom_config(self):
        """Test custom configuration values."""
        config = CrossfadeConfig(
            duration=4.0,
            curve_type="logarithmic",
            prevent_clips=False,
            match_energy=False,
        )

        assert config.duration == 4.0
        assert config.curve_type == "logarithmic"
        assert config.prevent_clips is False
        assert config.match_energy is False


class TestSplicePoint:
    """Tests for SplicePoint dataclass."""

    def test_splice_point_creation(self):
        """Test creating a SplicePoint."""
        point = SplicePoint(
            sample_index=1000,
            time=0.023,
            energy=0.5,
            zero_crossing=True,
            spectral_similarity=0.8,
        )

        assert point.sample_index == 1000
        assert point.time == 0.023
        assert point.energy == 0.5
        assert point.zero_crossing is True
        assert point.spectral_similarity == 0.8


class TestStitcherEdgeCases:
    """Edge case tests for stitching."""

    def test_crossfade_very_short_duration(self, generate_sine_wave, sr):
        """Test crossfade with very short duration."""
        audio_a = generate_sine_wave(freq=440.0)
        audio_b = generate_sine_wave(freq=523.25)

        result = crossfade(audio_a, audio_b, duration=0.01, sr=sr)

        assert isinstance(result, np.ndarray)

    def test_crossfade_longer_than_audio(self, sr):
        """Test crossfade when duration exceeds audio length."""
        audio_a = np.random.randn(int(sr * 1.0)).astype(np.float32) * 0.3
        audio_b = np.random.randn(int(sr * 1.0)).astype(np.float32) * 0.3

        result = crossfade(audio_a, audio_b, duration=2.0, sr=sr)

        assert isinstance(result, np.ndarray)

    def test_concatenate_empty_list(self, sr):
        """Test concatenating empty list."""
        result = concatenate_with_crossfade([], crossfade_duration=0.5, sr=sr)

        assert len(result) == 0

    def test_trim_all_silence(self, sr):
        """Test trimming when all audio is silence."""
        audio = np.zeros(int(sr * 2), dtype=np.float32)

        result = trim_silence(audio, threshold=0.01)

        assert len(result) == 0

    def test_stitch_clipped_audio(self, clipped_audio, sr):
        """Test stitching clipped audio."""
        stitcher = AdvancedStitcher(sr=sr)

        result = stitcher.crossfade_smart(clipped_audio, clipped_audio)

        assert isinstance(result, np.ndarray)
