"""
Main Pipeline Integration
Connects orchestration, HAM v2, and quality metrics into a unified workflow.

This module provides the complete music-lab pipeline for:
1. Planning song structure
2. Assigning sections to optimal models
3. Generating audio sections
4. Harmonic alignment between sections
5. Quality assessment
6. Final mastering
"""

import numpy as np
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field
from enum import Enum
import time

from alignment import (
    RobustKeyDetector,
    RobustBPMDetector,
    ChordDetector,
    AdvancedStitcher,
    CrossfadeConfig,
    HarmonicAlignmentEngine,
    create_alignment_engine,
)
from orchestration.engine import OrchestrationEngine, SectionType, SectionAssignment
from optimization.cost_optimizer import CostOptimizer
from metrics import QualityMetrics, QualityReport


class PipelineStage(Enum):
    """Stages in the generation pipeline."""

    PLANNING = "planning"
    ORCHESTRATION = "orchestration"
    GENERATION = "generation"
    ALIGNMENT = "alignment"
    STITCHING = "stitching"
    QUALITY_CHECK = "quality_check"
    MASTERING = "mastering"
    COMPLETE = "complete"


@dataclass
class SectionResult:
    """Result of processing a single section."""

    section_type: SectionType
    audio: Optional[np.ndarray] = None
    key: str = ""
    key_confidence: float = 0.0
    bpm: float = 120.0
    bpm_stability: float = 0.0
    chords: List[str] = field(default_factory=list)
    assigned_model: str = ""
    generation_time: float = 0.0


@dataclass
class PipelineResult:
    """Complete result of the generation pipeline."""

    audio: np.ndarray
    duration: float
    key: str
    bpm: float
    quality_report: QualityReport
    sections: List[SectionResult]
    total_cost: float
    total_time: float
    stages_completed: List[PipelineStage]


@dataclass
class PipelineConfig:
    """Configuration for the generation pipeline."""

    target_duration: float = 180.0
    target_lufs: float = -14.0
    target_bpm: Optional[float] = None
    target_key: Optional[str] = None
    crossfade_duration: float = 2.0
    quality_threshold: float = 70.0
    max_retries: int = 2
    verbose: bool = True


class MusicLabPipeline:
    """
    Complete music generation pipeline.

    Orchestrates the entire workflow from song planning to final output,
    integrating all music-lab components.

    Example:
        >>> pipeline = MusicLabPipeline(sr=44100)
        >>> result = pipeline.generate(
        ...     prompt="upbeat electronic dance track",
        ...     duration=180.0,
        ... )
        >>> print(f"Generated {result.duration}s audio")
        >>> print(f"Quality score: {result.quality_report.overall_score:.1f}")
    """

    def __init__(self, sr: int = 44100, config: Optional[PipelineConfig] = None):
        self.sr = sr
        self.config = config or PipelineConfig()

        self.key_detector = RobustKeyDetector(sr=sr)
        self.bpm_detector = RobustBPMDetector(sr=sr)
        self.chord_detector = ChordDetector(sr=sr)
        self.stitcher = AdvancedStitcher(
            sr=sr,
            config=CrossfadeConfig(duration=self.config.crossfade_duration),
        )
        self.alignment_engine = create_alignment_engine(sr=sr)
        self.orchestrator = OrchestrationEngine()
        self.cost_optimizer = CostOptimizer()
        self.quality_metrics = QualityMetrics(
            sr=sr, target_lufs=self.config.target_lufs
        )

        self._stages_completed: List[PipelineStage] = []
        self._section_results: List[SectionResult] = []

    def plan_sections(self, duration: float, style: str = "pop") -> List[Dict]:
        """
        Plan song structure based on duration and style.

        Args:
            duration: Target duration in seconds
            style: Musical style (affects section distribution)

        Returns:
            List of section definitions
        """
        if duration <= 60:
            sections = [
                {"type": SectionType.INTRO, "duration": duration * 0.15},
                {"type": SectionType.VERSE, "duration": duration * 0.35},
                {"type": SectionType.CHORUS, "duration": duration * 0.35},
                {"type": SectionType.OUTRO, "duration": duration * 0.15},
            ]
        elif duration <= 120:
            sections = [
                {"type": SectionType.INTRO, "duration": 10.0},
                {"type": SectionType.VERSE, "duration": 20.0},
                {"type": SectionType.CHORUS, "duration": 20.0},
                {"type": SectionType.VERSE, "duration": 20.0},
                {"type": SectionType.CHORUS, "duration": 20.0},
                {"type": SectionType.OUTRO, "duration": 10.0},
            ]
        else:
            sections = [
                {"type": SectionType.INTRO, "duration": 15.0},
                {"type": SectionType.VERSE, "duration": 25.0},
                {"type": SectionType.CHORUS, "duration": 25.0},
                {"type": SectionType.VERSE, "duration": 25.0},
                {"type": SectionType.CHORUS, "duration": 25.0},
                {"type": SectionType.BRIDGE, "duration": 20.0},
                {"type": SectionType.CHORUS, "duration": 25.0},
                {"type": SectionType.OUTRO, "duration": 15.0},
            ]

        total_planned = sum(s["duration"] for s in sections)
        if total_planned < duration:
            sections[-1]["duration"] += duration - total_planned

        self._stages_completed.append(PipelineStage.PLANNING)
        return sections

    def assign_models(self, sections: List[Dict]) -> List[SectionAssignment]:
        """
        Assign optimal models to each section.

        Args:
            sections: List of section definitions

        Returns:
            List of model assignments
        """
        assignments = self.orchestrator.assign_sections(sections)

        self._stages_completed.append(PipelineStage.ORCHESTRATION)
        return assignments

    def generate_section(
        self,
        section: Dict,
        assignment: SectionAssignment,
        target_key: str,
        target_bpm: float,
    ) -> SectionResult:
        """
        Generate a single audio section.

        This is a placeholder that generates synthetic audio.
        In production, this would call the actual AI models.

        Args:
            section: Section definition
            assignment: Model assignment
            target_key: Target musical key
            target_bpm: Target BPM

        Returns:
            SectionResult with generated audio and analysis
        """
        start_time = time.time()

        duration = section["duration"]
        samples = int(self.sr * duration)

        t = np.linspace(0, duration, samples)
        freq = self._key_to_freq(target_key)

        audio = np.zeros(samples, dtype=np.float32)

        for harmonic in range(1, 6):
            amplitude = 0.5 / harmonic
            phase = np.random.uniform(0, 0.1)
            audio += amplitude * np.sin(2 * np.pi * freq * harmonic * t + phase)

        noise = np.random.randn(samples).astype(np.float32) * 0.02
        audio = audio + noise

        envelope = np.ones(samples)
        fade_samples = int(0.1 * self.sr)
        envelope[:fade_samples] = np.linspace(0, 1, fade_samples)
        envelope[-fade_samples:] = np.linspace(1, 0, fade_samples)
        audio = audio * envelope

        audio = audio / np.max(np.abs(audio)) * 0.8

        key_result = self.key_detector.detect_key(audio, self.sr)
        bpm_result = self.bpm_detector.detect_bpm(audio, self.sr)
        chord_result = self.chord_detector.detect_progression(audio, self.sr)

        result = SectionResult(
            section_type=section["type"],
            audio=audio,
            key=key_result.key_name,
            key_confidence=key_result.confidence,
            bpm=bpm_result.bpm,
            bpm_stability=bpm_result.tempo_stability,
            chords=[c.chord for c in chord_result.chords[:4]],
            assigned_model=assignment.model_name,
            generation_time=time.time() - start_time,
        )

        return result

    def align_sections(self, sections: List[SectionResult]) -> List[SectionResult]:
        """
        Align all sections to reference key and BPM.

        Args:
            sections: List of section results

        Returns:
            Aligned section results
        """
        if not sections:
            return sections

        audio_arrays = [s.audio for s in sections if s.audio is not None]

        if not audio_arrays:
            return sections

        aligned_audio = self.alignment_engine.align_sections(
            audio_arrays, reference_index=0, sr=self.sr
        )

        audio_idx = 0
        for section in sections:
            if section.audio is not None:
                section.audio = aligned_audio[audio_idx]
                audio_idx += 1

        self._stages_completed.append(PipelineStage.ALIGNMENT)
        return sections

    def stitch_sections(self, sections: List[SectionResult]) -> np.ndarray:
        """
        Stitch aligned sections together.

        Args:
            sections: List of aligned section results

        Returns:
            Combined audio array
        """
        audio_sections = [s.audio for s in sections if s.audio is not None]

        if not audio_sections:
            return np.array([], dtype=np.float32)

        combined = audio_sections[0]
        for i, section in enumerate(audio_sections[1:], 1):
            bpm = sections[i].bpm if i < len(sections) else 120.0
            combined = self.stitcher.crossfade_smart(combined, section, bpm=bpm)

        self._stages_completed.append(PipelineStage.STITCHING)
        return combined

    def assess_quality(self, audio: np.ndarray) -> QualityReport:
        """
        Assess quality of generated audio.

        Args:
            audio: Audio to assess

        Returns:
            QualityReport with detailed assessment
        """
        report = self.quality_metrics.assess(audio)

        self._stages_completed.append(PipelineStage.QUALITY_CHECK)
        return report

    def master_audio(self, audio: np.ndarray, target_lufs: float = -14.0) -> np.ndarray:
        """
        Apply final mastering to audio.

        Args:
            audio: Audio to master
            target_lufs: Target loudness in LUFS

        Returns:
            Mastered audio
        """
        peak = np.max(np.abs(audio))
        if peak > 0:
            audio = audio / peak * 0.95

        rms = np.sqrt(np.mean(audio**2))
        if rms > 0:
            target_rms = 10 ** (target_lufs / 20) * 0.5
            audio = audio * (target_rms / rms)

        audio = np.clip(audio, -0.99, 0.99)

        self._stages_completed.append(PipelineStage.MASTERING)
        return audio

    def generate(
        self,
        prompt: str = "",
        duration: Optional[float] = None,
        style: str = "pop",
        target_key: Optional[str] = None,
        target_bpm: Optional[float] = None,
    ) -> PipelineResult:
        """
        Execute the complete generation pipeline.

        Args:
            prompt: Text description for generation
            duration: Target duration in seconds
            style: Musical style
            target_key: Target musical key
            target_bpm: Target BPM

        Returns:
            PipelineResult with final audio and metadata
        """
        start_time = time.time()
        self._stages_completed = []
        self._section_results = []

        duration = duration or self.config.target_duration
        target_key = target_key or self.config.target_key or "C"
        target_bpm = target_bpm or self.config.target_bpm or 120.0

        if self.config.verbose:
            print(f"[Pipeline] Planning {duration}s {style} track...")

        sections = self.plan_sections(duration, style)

        if self.config.verbose:
            print(f"[Pipeline] Assigning models to {len(sections)} sections...")

        assignments = self.assign_models(sections)

        if self.config.verbose:
            print(f"[Pipeline] Generating {len(sections)} sections...")

        self._stages_completed.append(PipelineStage.GENERATION)

        for section, assignment in zip(sections, assignments):
            result = self.generate_section(section, assignment, target_key, target_bpm)
            self._section_results.append(result)

            if self.config.verbose:
                print(
                    f"  - {section['type'].value}: {result.assigned_model} "
                    f"(key={result.key}, bpm={result.bpm:.0f})"
                )

        if self.config.verbose:
            print("[Pipeline] Aligning sections...")

        aligned_sections = self.align_sections(self._section_results)

        if self.config.verbose:
            print("[Pipeline] Stitching sections...")

        combined = self.stitch_sections(aligned_sections)

        if self.config.verbose:
            print("[Pipeline] Assessing quality...")

        quality_report = self.assess_quality(combined)

        if quality_report.overall_score < self.config.quality_threshold:
            if self.config.verbose:
                print(
                    f"[Pipeline] Quality below threshold ({quality_report.overall_score:.1f} < {self.config.quality_threshold})"
                )

        if self.config.verbose:
            print("[Pipeline] Applying final mastering...")

        mastered = self.master_audio(combined, self.config.target_lufs)

        self._stages_completed.append(PipelineStage.COMPLETE)

        total_cost = self.cost_optimizer.estimate_generation_cost(
            duration_seconds=duration,
            model="hybrid",
            gpu_type="rtx4090",
        ).total_cost

        result = PipelineResult(
            audio=mastered,
            duration=len(mastered) / self.sr,
            key=target_key,
            bpm=target_bpm,
            quality_report=quality_report,
            sections=self._section_results,
            total_cost=total_cost,
            total_time=time.time() - start_time,
            stages_completed=self._stages_completed,
        )

        if self.config.verbose:
            print(f"\n[Pipeline] Complete!")
            print(f"  Duration: {result.duration:.1f}s")
            print(f"  Quality: {quality_report.overall_score:.1f}/100")
            print(f"  Est. Cost: ${total_cost:.4f}")
            print(f"  Total Time: {result.total_time:.2f}s")

        return result

    def _key_to_freq(self, key: str) -> float:
        """Convert key name to fundamental frequency."""
        key_map = {
            "C": 261.63,
            "C#": 277.18,
            "D": 293.66,
            "D#": 311.13,
            "E": 329.63,
            "F": 349.23,
            "F#": 369.99,
            "G": 392.00,
            "G#": 415.30,
            "A": 440.00,
            "A#": 466.16,
            "B": 493.88,
        }

        clean_key = (
            key.replace("m", "").replace("major", "").replace("minor", "").strip()
        )
        return key_map.get(clean_key, 440.0)


def create_pipeline(sr: int = 44100, **config_kwargs) -> MusicLabPipeline:
    """
    Create a configured music-lab pipeline.

    Args:
        sr: Sample rate
        **config_kwargs: Pipeline configuration options

    Returns:
        Configured MusicLabPipeline instance
    """
    config = PipelineConfig(**config_kwargs)
    return MusicLabPipeline(sr=sr, config=config)


if __name__ == "__main__":
    print("=" * 60)
    print("MUSIC-LAB PIPELINE TEST")
    print("=" * 60)

    pipeline = create_pipeline(
        sr=44100,
        target_duration=30.0,
        verbose=True,
    )

    result = pipeline.generate(
        prompt="upbeat electronic track",
        duration=30.0,
        style="electronic",
        target_key="Am",
        target_bpm=128.0,
    )

    print("\n" + "=" * 60)
    print("RESULTS")
    print("=" * 60)
    print(f"Audio shape: {result.audio.shape}")
    print(f"Duration: {result.duration:.2f}s")
    print(f"Key: {result.key}")
    print(f"BPM: {result.bpm}")
    print(f"Quality Score: {result.quality_report.overall_score:.1f}/100")
    print(f"Production Ready: {result.quality_report.production_ready}")
    print(f"Total Cost: ${result.total_cost:.4f}")
    print(f"Stages: {[s.value for s in result.stages_completed]}")

    if result.quality_report.issues:
        print("\nIssues:")
        for issue in result.quality_report.issues:
            print(f"  - {issue}")

    if result.quality_report.recommendations:
        print("\nRecommendations:")
        for rec in result.quality_report.recommendations:
            print(f"  - {rec}")
