"""
Section Composer
Converts high-level song parameters into structured sections
"""

from typing import List, Dict, Any, Optional
from dataclasses import dataclass
import random

from config import (
    SongParams,
    Section,
    SECTION_TEMPLATES,
    DEFAULT_SONG_STRUCTURE,
    AUDIO_CONFIG,
)
from utils.logging import setup_logger

logger = setup_logger("SectionComposer")

GENRE_ENERGY_MODIFIERS = {
    "electronic": 0.15,
    "edm": 0.15,
    "rock": 0.1,
    "metal": 0.2,
    "jazz": -0.1,
    "classical": -0.15,
    "ambient": -0.2,
    "hip hop": 0.05,
    "rap": 0.05,
    "latin": 0.1,
    "pop": 0.05,
    "reggae": -0.05,
    "blues": -0.05,
    "folk": -0.1,
}

MOOD_ENERGY_MODIFIERS = {
    "energetic": 0.2,
    "upbeat": 0.15,
    "happy": 0.1,
    "romantic": 0.0,
    "melancholic": -0.15,
    "sad": -0.2,
    "calm": -0.1,
    "aggressive": 0.25,
    "peaceful": -0.1,
    "dark": 0.0,
    "dreamy": -0.05,
    "epic": 0.15,
}

SECTION_PROMPT_HINTS = {
    "intro": "atmospheric opening, building tension",
    "verse": "rhythmic groove, melodic development",
    "chorus": "energetic hook, full arrangement, memorable melody",
    "bridge": "contrast section, breakdown or buildup",
    "outro": "resolution, fading out, final statement",
    "pre_chorus": "building energy, transitional, anticipation",
    "post_chorus": "celebratory, high energy, catchy",
}


class SectionComposer:
    def __init__(self, params: SongParams):
        self.params = params
        self.sections: List[Section] = []

    def compose(self) -> List[Section]:
        logger.info(f"Composing sections for: {self.params.genre} / {self.params.mood}")

        total_duration = self.params.duration_seconds
        structure = self.params.structure or DEFAULT_SONG_STRUCTURE

        durations = self._calculate_section_durations(structure, total_duration)

        current_time = 0.0
        for i, section_name in enumerate(structure):
            duration = durations[i]
            energy = self._calculate_section_energy(section_name)
            prompt_suffix = self._generate_prompt_suffix(section_name)

            section = Section(
                name=section_name,
                start_time=current_time,
                duration=duration,
                energy=energy,
                prompt_suffix=prompt_suffix,
            )
            self.sections.append(section)

            logger.info(
                f"Section {i + 1}: {section_name.upper()} - "
                f"{duration:.1f}s @ {current_time:.1f}s start, energy={energy:.2f}"
            )
            current_time += duration

        self._validate_total_duration(total_duration)
        return self.sections

    def _calculate_section_durations(
        self, structure: List[str], total_duration: float
    ) -> List[float]:
        weights = []
        for section_name in structure:
            template = SECTION_TEMPLATES.get(section_name, SECTION_TEMPLATES["verse"])
            weights.append(template["typical_duration_ratio"])

        total_weight = sum(weights)
        durations = []

        for i, weight in enumerate(weights):
            duration = (weight / total_weight) * total_duration
            if structure[i] == "intro":
                duration = min(duration, 20)
            elif structure[i] == "outro":
                duration = min(duration, 15)
            durations.append(duration)

        current_total = sum(durations)
        if abs(current_total - total_duration) > 0.1:
            diff = total_duration - current_total
            chorus_indices = [i for i, s in enumerate(structure) if s == "chorus"]
            if chorus_indices:
                per_chorus = diff / len(chorus_indices)
                for idx in chorus_indices:
                    durations[idx] += per_chorus

        return durations

    def _calculate_section_energy(self, section_name: str) -> float:
        template = SECTION_TEMPLATES.get(section_name, SECTION_TEMPLATES["verse"])
        base_energy = template["energy"]

        genre_mod = 0.0
        genre_lower = self.params.genre.lower()
        for key, mod in GENRE_ENERGY_MODIFIERS.items():
            if key in genre_lower:
                genre_mod = mod
                break

        mood_mod = 0.0
        mood_lower = self.params.mood.lower()
        for key, mod in MOOD_ENERGY_MODIFIERS.items():
            if key in mood_lower:
                mood_mod = mod
                break

        final_energy = base_energy + genre_mod + mood_mod
        return max(0.1, min(1.0, final_energy))

    def _generate_prompt_suffix(self, section_name: str) -> str:
        hints = SECTION_PROMPT_HINTS.get(section_name, "")

        section_specific = {
            "intro": f"Begin with {hints}, {self.params.mood} atmosphere",
            "verse": f"{hints}, {self.params.genre} style, {self.params.language} feel",
            "chorus": f"{hints}, {self.params.mood} and powerful, memorable hook",
            "bridge": f"{hints}, different texture, {self.params.genre} breakdown",
            "outro": f"{hints}, {self.params.mood} conclusion",
            "pre_chorus": f"{hints}, rising energy",
            "post_chorus": f"{hints}, celebration",
        }

        return section_specific.get(section_name, hints)

    def _validate_total_duration(self, target_duration: float):
        actual_duration = sum(s.duration for s in self.sections)
        if abs(actual_duration - target_duration) > 1.0:
            logger.warning(
                f"Duration mismatch: target={target_duration}s, actual={actual_duration:.1f}s"
            )

    def get_section_plan_dict(self) -> List[Dict[str, Any]]:
        return [
            {
                "section": s.name,
                "duration": round(s.duration, 1),
                "energy": round(s.energy, 2),
                "start_time": round(s.start_time, 1),
                "prompt_hint": s.prompt_suffix,
            }
            for s in self.sections
        ]


def compose_song(params: SongParams) -> List[Section]:
    composer = SectionComposer(params)
    return composer.compose()


def compose_from_dict(data: Dict[str, Any]) -> List[Section]:
    params = SongParams(
        genre=data.get("genre", "pop"),
        mood=data.get("mood", "neutral"),
        language=data.get("language", "english"),
        duration_seconds=data.get("duration", 180),
        lyrics=data.get("lyrics"),
        bpm=data.get("bpm"),
    )
    return compose_song(params)
