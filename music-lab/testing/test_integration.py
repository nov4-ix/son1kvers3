"""
Integration Tests for Full Pipeline
Tests the complete music-lab workflow
"""

import pytest
import numpy as np
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


class TestHarmonicAlignmentEngine:
    """Integration tests for the main HAM engine."""

    def test_engine_initialization(self):
        """Test engine can be initialized."""
        from alignment import create_alignment_engine

        engine = create_alignment_engine(sr=44100)
        assert engine is not None

    def test_analyze_section(self, sr):
        """Test analyzing a single section."""
        from alignment import create_alignment_engine

        engine = create_alignment_engine(sr=sr)

        t = np.linspace(0, 5, int(sr * 5))
        audio = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)

        analysis = engine.analyze_section(audio, sr)

        assert "key" in analysis
        assert "bpm" in analysis
        assert "energy" in analysis

    def test_align_section(self, sr):
        """Test aligning a section to a reference."""
        from alignment import create_alignment_engine

        engine = create_alignment_engine(sr=sr)

        t = np.linspace(0, 5, int(sr * 5))
        reference = 0.5 * np.sin(2 * np.pi * 440 * t).astype(np.float32)
        section = 0.5 * np.sin(2 * np.pi * 523.25 * t).astype(np.float32)

        aligned = engine.align_section(reference, section, sr)

        assert isinstance(aligned, np.ndarray)
        assert len(aligned) > 0


class TestFullPipeline:
    """Integration tests for the complete generation pipeline."""

    def test_key_bpm_alignment(self, sr):
        """Test key and BPM alignment together."""
        from alignment import RobustKeyDetector, RobustBPMDetector

        t = np.linspace(0, 10, int(sr * 10))

        beat_interval = int(60.0 / 120.0 * sr)
        audio = np.zeros(len(t), dtype=np.float32)
        for i in range(0, len(t) - 1000, beat_interval):
            beat_t = np.linspace(0, 0.1, int(0.1 * sr))
            beat = 0.5 * np.sin(2 * np.pi * 100 * beat_t) * np.exp(-beat_t * 20)
            audio[i : i + len(beat)] = beat

        harmonic = 0.3 * np.sin(2 * np.pi * 440 * t)
        audio = audio + harmonic

        key_detector = RobustKeyDetector(sr=sr)
        bpm_detector = RobustBPMDetector(sr=sr)

        key_result = key_detector.detect_key(audio, sr)
        bpm_result = bpm_detector.detect_bpm(audio, sr)

        assert key_result.key_name is not None
        assert 60 <= bpm_result.bpm <= 200

    def test_stitch_multiple_sections(self, sr):
        """Test stitching multiple aligned sections."""
        from alignment import concatenate_with_crossfade

        sections = []
        for freq in [261.63, 329.63, 392.00, 329.63, 261.63]:
            t = np.linspace(0, 2, int(sr * 2))
            audio = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)
            sections.append(audio)

        result = concatenate_with_crossfade(sections, crossfade_duration=0.5, sr=sr)

        assert isinstance(result, np.ndarray)
        assert len(result) > 0
        assert not np.any(np.isnan(result))

    def test_quality_assessment_pipeline(self, sr):
        """Test quality assessment on generated audio."""
        from metrics.quality_metrics import QualityMetrics

        t = np.linspace(0, 10, int(sr * 10))
        audio = np.zeros(len(t), dtype=np.float32)

        for i, freq in enumerate([261.63, 329.63, 392.00, 440.00]):
            start = i * int(sr * 2.5)
            end = start + int(sr * 2.5)
            audio[start:end] = 0.4 * np.sin(2 * np.pi * freq * t[: end - start])

        metrics = QualityMetrics(sr=sr)
        report = metrics.assess(audio)

        assert report.overall_score >= 0
        assert len(report.dimension_scores) >= 7


class TestOrchestrationIntegration:
    """Integration tests for model orchestration."""

    def test_orchestration_engine_initialization(self):
        """Test orchestration engine can be initialized."""
        from orchestration.engine import OrchestrationEngine

        engine = OrchestrationEngine()
        assert engine is not None

    def test_section_assignment(self, sr):
        """Test section assignment to models."""
        from orchestration.engine import OrchestrationEngine, SectionType

        engine = OrchestrationEngine()

        sections = [
            {
                "type": SectionType.INTRO,
                "duration": 10.0,
                "requirements": {"melody": 0.8},
            },
            {
                "type": SectionType.VERSE,
                "duration": 20.0,
                "requirements": {"melody": 0.9},
            },
            {
                "type": SectionType.CHORUS,
                "duration": 20.0,
                "requirements": {"emotion": 0.9},
            },
        ]

        assignments = engine.assign_sections(sections)

        assert len(assignments) == 3


class TestCostOptimizationIntegration:
    """Integration tests for cost optimization."""

    def test_cost_optimizer_initialization(self):
        """Test cost optimizer can be initialized."""
        from optimization.cost_optimizer import CostOptimizer

        optimizer = CostOptimizer()
        assert optimizer is not None

    def test_estimate_generation_cost(self):
        """Test cost estimation for generation."""
        from optimization.cost_optimizer import CostOptimizer

        optimizer = CostOptimizer()

        cost = optimizer.estimate_generation_cost(
            duration_seconds=180.0,
            model="musicgen_large",
            gpu_type="rtx4090",
        )

        assert cost.total_cost >= 0
        assert cost.generation_time_seconds > 0


class TestEndToEndPipeline:
    """End-to-end integration tests."""

    @pytest.mark.slow
    def test_full_generation_workflow(self, sr):
        """Test complete workflow from analysis to output."""
        from alignment import (
            RobustKeyDetector,
            RobustBPMDetector,
            ChordDetector,
            AdvancedStitcher,
        )
        from metrics.quality_metrics import QualityMetrics

        sections = []
        for freq in [261.63, 293.66, 329.63, 349.23]:
            t = np.linspace(0, 3, int(sr * 3))
            audio = 0.5 * np.sin(2 * np.pi * freq * t).astype(np.float32)

            for h in range(2, 5):
                audio += 0.3 / h * np.sin(2 * np.pi * freq * h * t)

            audio = audio / np.max(np.abs(audio)) * 0.7
            sections.append(audio)

        key_detector = RobustKeyDetector(sr=sr)
        bpm_detector = RobustBPMDetector(sr=sr)
        chord_detector = ChordDetector(sr=sr)

        analysis_results = []
        for section in sections:
            key = key_detector.detect_key(section, sr)
            bpm = bpm_detector.detect_bpm(section, sr)
            chords = chord_detector.detect_progression(section, sr)

            analysis_results.append(
                {
                    "key": key.key_name,
                    "key_confidence": key.confidence,
                    "bpm": bpm.bpm,
                    "bpm_stability": bpm.tempo_stability,
                    "chord_count": len(chords.chords),
                }
            )

        stitcher = AdvancedStitcher(sr=sr)
        combined = sections[0]
        for section in sections[1:]:
            combined = stitcher.crossfade_smart(combined, section, bpm=120.0)

        metrics = QualityMetrics(sr=sr)
        quality_report = metrics.assess(combined)

        assert len(analysis_results) == 4
        assert isinstance(combined, np.ndarray)
        assert not np.any(np.isnan(combined))
        assert quality_report.overall_score >= 0
