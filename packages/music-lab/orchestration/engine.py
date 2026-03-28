"""
Orchestration Engine
Intelligent model selection and section assignment for hybrid generation

This module provides the orchestration layer that decides which generative
model to use for each section, based on model strengths and section requirements.

Model Strengths:
- MusicGen: Strong melody, good for verses and choruses
- HeartMuLa: Strong emotion, good for bridges and emotional sections
- AudioLDM2: Strong atmosphere, good for intros and outros

The engine uses a scoring system to match sections to optimal models.
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class GenerationType(Enum):
    """Available generation models."""

    MUSICGEN = "musicgen"
    HEARTMULA = "heartmula"
    AUDIOLDM2 = "audioldm2"
    HYBRID = "hybrid"


@dataclass
class ModelCapabilities:
    """Capabilities and strengths of each model."""

    name: str
    melody_strength: float
    emotion_strength: float
    atmosphere_strength: float
    rhythm_strength: float
    lyric_coherence: float
    max_duration: int  # seconds
    recommended_bpm_range: Tuple[float, float]
    memory_requirement_gb: float


MODEL_CAPABILITIES = {
    GenerationType.MUSICGEN: ModelCapabilities(
        name="MusicGen",
        melody_strength=0.9,
        emotion_strength=0.6,
        atmosphere_strength=0.7,
        rhythm_strength=0.85,
        lyric_coherence=0.8,
        max_duration=30,
        recommended_bpm_range=(80, 160),
        memory_requirement_gb=4.0,
    ),
    GenerationType.HEARTMULA: ModelCapabilities(
        name="HeartMuLa",
        melody_strength=0.75,
        emotion_strength=0.95,
        atmosphere_strength=0.8,
        rhythm_strength=0.7,
        lyric_coherence=0.9,
        max_duration=45,
        recommended_bpm_range=(60, 140),
        memory_requirement_gb=6.0,
    ),
    GenerationType.AUDIOLDM2: ModelCapabilities(
        name="AudioLDM2",
        melody_strength=0.6,
        emotion_strength=0.7,
        atmosphere_strength=0.95,
        rhythm_strength=0.75,
        lyric_coherence=0.5,
        max_duration=60,
        recommended_bpm_range=(60, 180),
        memory_requirement_gb=3.5,
    ),
}


@dataclass
class SectionRequirements:
    """Requirements for a music section."""

    name: str
    duration: float
    energy_level: float  # 0-1
    emotional_weight: float  # 0-1
    atmospheric_weight: float  # 0-1
    lyric_importance: float  # 0-1
    bpm: Optional[float] = None
    preferred_model: Optional[GenerationType] = None


@dataclass
class OrchestrationPlan:
    """Complete orchestration plan for song generation."""

    sections: List[
        Tuple[str, GenerationType, float]
    ]  # (section_name, model, confidence)
    total_estimated_time: float
    total_memory_required: float
    model_usage: Dict[GenerationType, int]  # count per model
    confidence_score: float


class OrchestrationEngine:
    """
    Intelligent orchestration engine for hybrid music generation.

    Analyzes section requirements and selects optimal models based on
    their strengths, memory constraints, and desired characteristics.

    Example:
        >>> engine = OrchestrationEngine(available_memory_gb=16)
        >>> plan = engine.create_plan(sections, target_bpm=120)
        >>> for section, model, conf in plan.sections:
        ...     print(f"{section}: {model.value} (conf: {conf:.2f})")
    """

    def __init__(
        self,
        available_memory_gb: float = 16.0,
        preferred_models: Optional[List[GenerationType]] = None,
        balance_models: bool = True,
    ):
        """
        Initialize orchestration engine.

        Args:
            available_memory_gb: Available GPU memory
            preferred_models: Models to prioritize (None = all available)
            balance_models: Try to distribute load across models
        """
        self.available_memory = available_memory_gb
        self.preferred_models = preferred_models or list(GenerationType)
        self.balance_models = balance_models

        self.capabilities = {
            k: v for k, v in MODEL_CAPABILITIES.items() if k in self.preferred_models
        }

    def create_plan(
        self,
        sections: List[SectionRequirements],
        target_bpm: Optional[float] = None,
        optimize_for: str = "quality",  # 'quality', 'speed', 'memory'
    ) -> OrchestrationPlan:
        """
        Create orchestration plan for song generation.

        Args:
            sections: List of section requirements
            target_bpm: Target BPM for the song
            optimize_for: Optimization priority

        Returns:
            OrchestrationPlan with model assignments
        """
        assignments = []
        model_counts = {m: 0 for m in self.preferred_models}
        total_time = 0.0
        total_memory = 0.0
        confidence_scores = []

        for section in sections:
            model, confidence = self._select_model(
                section, target_bpm, model_counts, optimize_for
            )

            assignments.append((section.name, model, confidence))
            model_counts[model] += 1

            caps = self.capabilities[model]
            total_time += section.duration * 0.5  # estimate
            total_memory = max(total_memory, caps.memory_requirement_gb)
            confidence_scores.append(confidence)

        avg_confidence = np.mean(confidence_scores) if confidence_scores else 0.5

        return OrchestrationPlan(
            sections=assignments,
            total_estimated_time=total_time,
            total_memory_required=total_memory,
            model_usage=model_counts,
            confidence_score=avg_confidence,
        )

    def _select_model(
        self,
        section: SectionRequirements,
        target_bpm: Optional[float],
        current_counts: Dict[GenerationType, int],
        optimize_for: str,
    ) -> Tuple[GenerationType, float]:
        """Select best model for a section."""

        if section.preferred_model and section.preferred_model in self.capabilities:
            caps = self.capabilities[section.preferred_model]
            if self._can_use_model(caps, section, target_bpm):
                return section.preferred_model, 0.95

        scores = {}

        for model_type, caps in self.capabilities.items():
            if not self._can_use_model(caps, section, target_bpm):
                continue

            score = self._calculate_score(
                caps, section, current_counts.get(model_type, 0)
            )
            scores[model_type] = score

        if not scores:
            return self.preferred_models[0], 0.3

        best_model = max(scores.keys(), key=lambda m: scores[m])
        best_score = scores[best_model]

        return best_model, best_score

    def _can_use_model(
        self,
        caps: ModelCapabilities,
        section: SectionRequirements,
        target_bpm: Optional[float],
    ) -> bool:
        """Check if model can handle section requirements."""

        if caps.memory_requirement_gb > self.available_memory:
            return False

        if section.duration > caps.max_duration:
            return False

        if target_bpm:
            min_bpm, max_bpm = caps.recommended_bpm_range
            if not (min_bpm <= target_bpm <= max_bpm):
                penalty = 0.5
            else:
                penalty = 0.0

        return True

    def _calculate_score(
        self, caps: ModelCapabilities, section: SectionRequirements, current_usage: int
    ) -> float:
        """Calculate fitness score for model-section pairing."""

        energy_match = section.energy_level * caps.rhythm_strength

        emotion_match = section.emotional_weight * caps.emotion_strength

        atmosphere_match = section.atmospheric_weight * caps.atmosphere_strength

        lyric_match = section.lyric_importance * caps.lyric_coherence

        section_scores = {
            "intro": atmosphere_match * 0.5 + emotion_match * 0.3,
            "verse": lyric_match * 0.4 + energy_match * 0.3 + emotion_match * 0.3,
            "chorus": energy_match * 0.4 + lyric_match * 0.3 + emotion_match * 0.3,
            "bridge": emotion_match * 0.5 + atmosphere_match * 0.3,
            "outro": atmosphere_match * 0.5 + emotion_match * 0.3,
            "pre_chorus": energy_match * 0.4 + emotion_match * 0.4,
            "post_chorus": energy_match * 0.5 + lyric_match * 0.2,
        }

        base_score = section_scores.get(
            section.name.lower(),
            (energy_match + emotion_match + atmosphere_match + lyric_match) / 4,
        )

        if self.balance_models and current_usage > 0:
            balance_penalty = 0.1 * current_usage
            base_score *= 1 - balance_penalty

        return base_score

    def get_section_recommendations(
        self, section_type: str
    ) -> Dict[GenerationType, float]:
        """
        Get model recommendations for a section type.

        Args:
            section_type: Type of section (intro, verse, chorus, etc.)

        Returns:
            Dictionary of model -> recommendation score
        """
        section_type = section_type.lower()

        templates = {
            "intro": SectionRequirements(
                name="intro",
                duration=15,
                energy_level=0.4,
                emotional_weight=0.5,
                atmospheric_weight=0.9,
                lyric_importance=0.2,
            ),
            "verse": SectionRequirements(
                name="verse",
                duration=30,
                energy_level=0.6,
                emotional_weight=0.6,
                atmospheric_weight=0.4,
                lyric_importance=0.8,
            ),
            "chorus": SectionRequirements(
                name="chorus",
                duration=30,
                energy_level=0.9,
                emotional_weight=0.7,
                atmospheric_weight=0.5,
                lyric_importance=0.9,
            ),
            "bridge": SectionRequirements(
                name="bridge",
                duration=20,
                energy_level=0.7,
                emotional_weight=0.9,
                atmospheric_weight=0.6,
                lyric_importance=0.7,
            ),
            "outro": SectionRequirements(
                name="outro",
                duration=15,
                energy_level=0.3,
                emotional_weight=0.5,
                atmospheric_weight=0.8,
                lyric_importance=0.3,
            ),
        }

        section = templates.get(section_type)
        if not section:
            return {}

        recommendations = {}
        for model_type, caps in self.capabilities.items():
            score = self._calculate_score(caps, section, 0)
            recommendations[model_type] = score

        return recommendations

    def estimate_resources(
        self, sections: List[SectionRequirements]
    ) -> Dict[str, float]:
        """
        Estimate resource requirements for generation.

        Args:
            sections: List of section requirements

        Returns:
            Dictionary with resource estimates
        """
        plan = self.create_plan(sections)

        total_duration = sum(s.duration for s in sections)

        generation_time = total_duration * 2.0  # ~2x realtime

        return {
            "total_duration_seconds": total_duration,
            "estimated_generation_time": generation_time,
            "peak_memory_gb": plan.total_memory_required,
            "sections_count": len(sections),
            "avg_confidence": plan.confidence_score,
        }


def create_default_sections(
    duration: float = 180, bpm: float = 120
) -> List[SectionRequirements]:
    """
    Create default song structure.

    Args:
        duration: Total duration in seconds
        bpm: Target BPM

    Returns:
        List of section requirements
    """
    beat_duration = 60.0 / bpm
    bar_duration = beat_duration * 4

    return [
        SectionRequirements("intro", bar_duration * 4, 0.4, 0.5, 0.9, 0.2, bpm),
        SectionRequirements("verse", bar_duration * 8, 0.6, 0.6, 0.4, 0.8, bpm),
        SectionRequirements("chorus", bar_duration * 8, 0.9, 0.7, 0.5, 0.9, bpm),
        SectionRequirements("verse", bar_duration * 8, 0.6, 0.6, 0.4, 0.8, bpm),
        SectionRequirements("chorus", bar_duration * 8, 0.9, 0.7, 0.5, 0.9, bpm),
        SectionRequirements("bridge", bar_duration * 6, 0.7, 0.9, 0.6, 0.7, bpm),
        SectionRequirements("chorus", bar_duration * 8, 0.9, 0.8, 0.5, 0.9, bpm),
        SectionRequirements("outro", bar_duration * 4, 0.3, 0.5, 0.8, 0.3, bpm),
    ]


if __name__ == "__main__":
    print("Orchestration Engine")
    print("=" * 50)

    engine = OrchestrationEngine(available_memory_gb=16.0)

    print("\nModel Capabilities:")
    for model, caps in MODEL_CAPABILITIES.items():
        print(f"\n  {caps.name}:")
        print(f"    Melody: {caps.melody_strength:.1f}")
        print(f"    Emotion: {caps.emotion_strength:.1f}")
        print(f"    Atmosphere: {caps.atmosphere_strength:.1f}")
        print(f"    Memory: {caps.memory_requirement_gb:.1f} GB")

    sections = create_default_sections(duration=180, bpm=120)

    print(f"\n\nOrchestration Plan (180s, 120 BPM):")
    print("-" * 40)

    plan = engine.create_plan(sections, target_bpm=120)

    for section_name, model, confidence in plan.sections:
        print(f"  {section_name:12} -> {model.value:12} (conf: {confidence:.2f})")

    print(f"\n  Total estimated time: {plan.total_estimated_time:.1f}s")
    print(f"  Peak memory: {plan.total_memory_required:.1f} GB")
    print(f"  Model usage: {dict((k.value, v) for k, v in plan.model_usage.items())}")
    print(f"  Average confidence: {plan.confidence_score:.2f}")

    print("\n\nSection Recommendations:")
    print("-" * 40)

    for section_type in ["intro", "verse", "chorus", "bridge", "outro"]:
        recs = engine.get_section_recommendations(section_type)
        best = max(recs.keys(), key=lambda m: recs[m])
        print(f"  {section_type:10} -> Best: {best.value} ({recs[best]:.2f})")

    print("\n" + "=" * 50)
    print("Orchestration engine ready.")
