"""
Unit Tests for Quality Metrics Module
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from metrics.quality_metrics import (
    QualityMetrics,
    QualityReport,
    QualityScore,
    QualityDimension,
    QUALITY_WEIGHTS,
)


class TestQualityMetrics:
    """Tests for quality metrics assessment."""

    def test_quality_metrics_initialization(self):
        """Test QualityMetrics initialization."""
        metrics = QualityMetrics()
        assert metrics.sr == 44100
        assert metrics.target_lufs == -14.0
        assert metrics.production_threshold == 70.0

    def test_quality_metrics_custom_params(self):
        """Test QualityMetrics with custom parameters."""
        metrics = QualityMetrics(sr=48000, target_lufs=-16.0, production_threshold=75.0)
        assert metrics.sr == 48000
        assert metrics.target_lufs == -16.0
        assert metrics.production_threshold == 75.0

    def test_assess_returns_report(self, generate_sine_wave, sr):
        """Test that assess returns QualityReport."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert isinstance(result, QualityReport)

    def test_assess_overall_score_range(self, generate_sine_wave, sr):
        """Test that overall score is in valid range."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert 0.0 <= result.overall_score <= 100.0

    def test_assess_dimension_scores(self, generate_sine_wave, sr):
        """Test that all dimension scores are returned."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert len(result.dimension_scores) >= 7

    def test_assess_production_ready(self, generate_sine_wave, sr):
        """Test production ready flag."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0, amplitude=0.5)

        result = metrics.assess(audio)

        assert isinstance(result.production_ready, bool)

    def test_assess_issues_list(self, generate_sine_wave, sr):
        """Test that issues are returned as list."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert isinstance(result.issues, list)

    def test_assess_recommendations_list(self, generate_sine_wave, sr):
        """Test that recommendations are returned as list."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert isinstance(result.recommendations, list)

    def test_assess_with_reference(self, generate_sine_wave, sr):
        """Test assessment with reference audio."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)
        reference = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio, reference_audio=reference)

        assert result.comparison_to_reference is not None
        assert isinstance(result.comparison_to_reference, float)

    def test_assess_without_reference(self, generate_sine_wave, sr):
        """Test assessment without reference audio."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        assert result.comparison_to_reference is None


class TestQualityDimensions:
    """Tests for individual quality dimensions."""

    def test_spectral_balance(self, generate_sine_wave, sr):
        """Test spectral balance assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        spectral_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.SPECTRAL_BALANCE
        )
        assert 0.0 <= spectral_score.score <= 100.0

    def test_dynamic_range(self, generate_sine_wave, sr):
        """Test dynamic range assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        dynamic_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.DYNAMIC_RANGE
        )
        assert 0.0 <= dynamic_score.score <= 100.0

    def test_loudness_compliance(self, generate_sine_wave, sr):
        """Test loudness compliance assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        loudness_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.LOUDNESS_COMPLIANCE
        )
        assert 0.0 <= loudness_score.score <= 100.0

    def test_stereo_image_mono(self, generate_sine_wave, sr):
        """Test stereo image assessment for mono audio."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        stereo_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.STEREO_IMAGE
        )
        assert 0.0 <= stereo_score.score <= 100.0

    def test_stereo_image_stereo(self, generate_stereo_audio, sr):
        """Test stereo image assessment for stereo audio."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_stereo_audio(left_freq=440.0, right_freq=460.0)

        result = metrics.assess(audio)

        stereo_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.STEREO_IMAGE
        )
        assert 0.0 <= stereo_score.score <= 100.0

    def test_harmonic_coherence(self, generate_sine_with_harmonics, sr):
        """Test harmonic coherence assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_with_harmonics(fundamental=440.0)

        result = metrics.assess(audio)

        harmonic_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.HARMONIC_COHERENCE
        )
        assert 0.0 <= harmonic_score.score <= 100.0

    def test_temporal_consistency(self, generate_sine_wave, sr):
        """Test temporal consistency assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        temporal_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.TEMPORAL_CONSISTENCY
        )
        assert 0.0 <= temporal_score.score <= 100.0

    def test_artifact_detection(self, generate_sine_wave, sr):
        """Test artifact detection assessment."""
        metrics = QualityMetrics(sr=sr)
        audio = generate_sine_wave(freq=440.0)

        result = metrics.assess(audio)

        artifact_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.ARTIFACT_PRESENCE
        )
        assert 0.0 <= artifact_score.score <= 100.0


class TestQualityScores:
    """Tests for quality score data structures."""

    def test_quality_score_creation(self):
        """Test creating a QualityScore."""
        score = QualityScore(
            dimension=QualityDimension.SPECTRAL_BALANCE,
            score=85.0,
            weight=0.15,
            details={"centroid_hz": 2000.0},
        )

        assert score.dimension == QualityDimension.SPECTRAL_BALANCE
        assert score.score == 85.0
        assert score.weight == 0.15
        assert "centroid_hz" in score.details

    def test_quality_report_creation(self):
        """Test creating a QualityReport."""
        report = QualityReport(
            overall_score=80.0,
            dimension_scores=[],
            production_ready=True,
            issues=[],
            recommendations=[],
            comparison_to_reference=None,
        )

        assert report.overall_score == 80.0
        assert report.production_ready is True


class TestQualityMetricsEdgeCases:
    """Edge case tests for quality metrics."""

    def test_noisy_audio(self, noisy_audio, sr):
        """Test assessment of noisy audio."""
        metrics = QualityMetrics(sr=sr)

        result = metrics.assess(noisy_audio)

        assert isinstance(result, QualityReport)
        assert result.overall_score < 100

    def test_clipped_audio(self, clipped_audio, sr):
        """Test assessment of clipped audio."""
        metrics = QualityMetrics(sr=sr)

        result = metrics.assess(clipped_audio)

        assert isinstance(result, QualityReport)
        artifact_score = next(
            s
            for s in result.dimension_scores
            if s.dimension == QualityDimension.ARTIFACT_PRESENCE
        )
        assert artifact_score.score < 100

    def test_very_quiet_audio(self, sr):
        """Test assessment of very quiet audio."""
        metrics = QualityMetrics(sr=sr)
        t = np.linspace(0, 5, int(sr * 5))
        audio = (0.01 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)

        result = metrics.assess(audio)

        assert isinstance(result, QualityReport)

    def test_constant_audio(self, sr):
        """Test assessment of constant amplitude audio."""
        metrics = QualityMetrics(sr=sr)
        audio = np.full(int(sr * 5), 0.5, dtype=np.float32)

        result = metrics.assess(audio)

        assert isinstance(result, QualityReport)

    def test_stereo_phase_inverted(self, sr):
        """Test assessment of phase-inverted stereo."""
        metrics = QualityMetrics(sr=sr)
        t = np.linspace(0, 5, int(sr * 5))
        left = 0.5 * np.sin(2 * np.pi * 440 * t)
        right = -left
        audio = np.stack([left, right]).astype(np.float32)

        result = metrics.assess(audio)

        assert isinstance(result, QualityReport)
