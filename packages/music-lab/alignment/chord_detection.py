"""
Chord Detection Module
Detects chord progressions for precise harmonic alignment

This module provides chord-level analysis for aligning sections
at the harmonic progression level, enabling more precise alignment
than key detection alone.

Features:
- Major, minor, and dominant 7th chord detection
- Chord progression analysis
- Beat-synchronized chord detection
- Chord similarity scoring
"""

import numpy as np
import librosa
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from scipy.ndimage import maximum_filter1d


@dataclass
class ChordDetectionResult:
    """Result of chord detection for a single frame."""

    time: float
    chord: str
    confidence: float
    chroma_vector: np.ndarray


@dataclass
class ChordProgression:
    """Complete chord progression analysis."""

    chords: List[ChordDetectionResult]
    unique_chords: List[str]
    key_estimate: str
    progression_pattern: str
    complexity_score: float


# Standard chord templates (12 semitones)
CHORD_TEMPLATES = {}

_notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

for i, root in enumerate(_notes):
    # Major triad: root, major 3rd, perfect 5th
    major = np.zeros(12, dtype=np.float32)
    major[i] = 1.0
    major[(i + 4) % 12] = 0.8
    major[(i + 7) % 12] = 0.6
    CHORD_TEMPLATES[root] = major

    # Minor triad: root, minor 3rd, perfect 5th
    minor = np.zeros(12, dtype=np.float32)
    minor[i] = 1.0
    minor[(i + 3) % 12] = 0.8
    minor[(i + 7) % 12] = 0.6
    CHORD_TEMPLATES[f"{root}m"] = minor

    # Dominant 7th: root, major 3rd, perfect 5th, minor 7th
    dom7 = np.zeros(12, dtype=np.float32)
    dom7[i] = 1.0
    dom7[(i + 4) % 12] = 0.8
    dom7[(i + 7) % 12] = 0.6
    dom7[(i + 10) % 12] = 0.5
    CHORD_TEMPLATES[f"{root}7"] = dom7

    # Minor 7th: root, minor 3rd, perfect 5th, minor 7th
    min7 = np.zeros(12, dtype=np.float32)
    min7[i] = 1.0
    min7[(i + 3) % 12] = 0.8
    min7[(i + 7) % 12] = 0.6
    min7[(i + 10) % 12] = 0.5
    CHORD_TEMPLATES[f"{root}m7"] = min7

    # Major 7th: root, major 3rd, perfect 5th, major 7th
    maj7 = np.zeros(12, dtype=np.float32)
    maj7[i] = 1.0
    maj7[(i + 4) % 12] = 0.8
    maj7[(i + 7) % 12] = 0.6
    maj7[(i + 11) % 12] = 0.5
    CHORD_TEMPLATES[f"{root}maj7"] = maj7

    # Diminished: root, minor 3rd, diminished 5th
    dim = np.zeros(12, dtype=np.float32)
    dim[i] = 1.0
    dim[(i + 3) % 12] = 0.8
    dim[(i + 6) % 12] = 0.6
    CHORD_TEMPLATES[f"{root}dim"] = dim

    # Suspended 4th
    sus4 = np.zeros(12, dtype=np.float32)
    sus4[i] = 1.0
    sus4[(i + 5) % 12] = 0.8
    sus4[(i + 7) % 12] = 0.6
    CHORD_TEMPLATES[f"{root}sus4"] = sus4

NO_CHORD = "N"


class ChordDetector:
    """
    Production-grade chord detection system.

    Detects chord progressions with beat synchronization for
    precise harmonic alignment between sections.

    Example:
        >>> detector = ChordDetector()
        >>> progression = detector.detect_progression('song.wav')
        >>> for chord in progression.chords:
        ...     print(f"{chord.time:.1f}s: {chord.chord}")
    """

    def __init__(
        self,
        sr: int = 44100,
        hop_length: int = 2048,
        min_confidence: float = 0.3,
        smoothing_window: int = 3,
    ):
        """
        Initialize the chord detector.

        Args:
            sr: Sample rate
            hop_length: Hop length for chroma analysis
            min_confidence: Minimum confidence for chord detection
            smoothing_window: Window size for temporal smoothing
        """
        self.sr = sr
        self.hop_length = hop_length
        self.min_confidence = min_confidence
        self.smoothing_window = smoothing_window

        self.chord_templates = CHORD_TEMPLATES
        self.template_names = list(CHORD_TEMPLATES.keys())
        self.template_matrix = np.array(
            [CHORD_TEMPLATES[name] for name in self.template_names]
        ).T

    def detect_chords(
        self, y: np.ndarray, sr: Optional[int] = None
    ) -> List[ChordDetectionResult]:
        """
        Detect chord sequence from audio.

        Args:
            y: Audio time series
            sr: Sample rate (uses self.sr if not specified)

        Returns:
            List of ChordDetectionResult for each frame
        """
        sr = sr or self.sr

        if y.ndim == 2:
            y = np.mean(y, axis=0)

        y = y.astype(np.float32)

        chroma = librosa.feature.chroma_cqt(
            y=y, sr=sr, hop_length=self.hop_length, norm=2
        )

        chroma_smoothed = self._smooth_chroma(chroma)

        chords = []

        for i in range(chroma_smoothed.shape[1]):
            frame = chroma_smoothed[:, i]
            frame = frame / (np.sum(frame) + 1e-8)

            chord_name, confidence = self._match_chord(frame)

            if confidence < self.min_confidence:
                chord_name = NO_CHORD

            chords.append(
                ChordDetectionResult(
                    time=librosa.frames_to_time(i, sr=sr, hop_length=self.hop_length),
                    chord=chord_name,
                    confidence=confidence,
                    chroma_vector=frame,
                )
            )

        return chords

    def detect_beat_synced_chords(
        self, y: np.ndarray, sr: Optional[int] = None, bpm: Optional[float] = None
    ) -> List[ChordDetectionResult]:
        """
        Detect chords synchronized to beats.

        Provides one chord per beat for precise alignment.

        Args:
            y: Audio time series
            sr: Sample rate
            bpm: Optional BPM (will detect if not provided)

        Returns:
            List of beat-synchronized chord detections
        """
        sr = sr or self.sr

        if y.ndim == 2:
            y = np.mean(y, axis=0)

        if bpm is None:
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            if isinstance(tempo, np.ndarray):
                bpm = float(tempo[0]) if len(tempo) > 0 else 120.0
            else:
                bpm = float(tempo)

        beat_duration = 60.0 / bpm
        beat_samples = int(beat_duration * sr)

        chroma = librosa.feature.chroma_cqt(
            y=y, sr=sr, hop_length=self.hop_length, norm=2
        )

        beat_frames = librosa.time_to_frames(
            np.arange(0, len(y) / sr, beat_duration), sr=sr, hop_length=self.hop_length
        )

        beat_chords = []

        for i, frame_idx in enumerate(beat_frames):
            if frame_idx >= chroma.shape[1]:
                break

            start_frame = max(0, frame_idx - 2)
            end_frame = min(chroma.shape[1], frame_idx + 3)

            frame_mean = np.mean(chroma[:, start_frame:end_frame], axis=1)
            frame_mean = frame_mean / (np.sum(frame_mean) + 1e-8)

            chord_name, confidence = self._match_chord(frame_mean)

            if confidence < self.min_confidence:
                chord_name = NO_CHORD

            beat_chords.append(
                ChordDetectionResult(
                    time=i * beat_duration,
                    chord=chord_name,
                    confidence=confidence,
                    chroma_vector=frame_mean,
                )
            )

        return beat_chords

    def detect_progression(
        self, y: np.ndarray, sr: Optional[int] = None
    ) -> ChordProgression:
        """
        Complete chord progression analysis.

        Returns chord sequence with metadata including estimated key
        and progression pattern.

        Args:
            y: Audio time series
            sr: Sample rate

        Returns:
            ChordProgression with complete analysis
        """
        sr = sr or self.sr

        chords = self.detect_chords(y, sr)

        chords = self._merge_adjacent_chords(chords)

        unique_chords = list(set(c.chord for c in chords if c.chord != NO_CHORD))

        key_estimate = self._estimate_key_from_chords(chords)

        progression_pattern = self._extract_progression_pattern(chords)

        complexity = self._calculate_complexity(chords)

        return ChordProgression(
            chords=chords,
            unique_chords=unique_chords,
            key_estimate=key_estimate,
            progression_pattern=progression_pattern,
            complexity_score=complexity,
        )

    def get_chord_similarity(self, chord1: str, chord2: str) -> float:
        """
        Calculate similarity between two chords.

        Args:
            chord1: First chord name
            chord2: Second chord name

        Returns:
            Similarity score (0-1)
        """
        if chord1 == NO_CHORD or chord2 == NO_CHORD:
            return 0.0

        if chord1 not in self.chord_templates or chord2 not in self.chord_templates:
            return 0.0

        template1 = self.chord_templates[chord1]
        template2 = self.chord_templates[chord2]

        similarity = np.dot(template1, template2) / (
            np.linalg.norm(template1) * np.linalg.norm(template2) + 1e-8
        )

        return float(similarity)

    def compare_progressions(
        self, progression1: ChordProgression, progression2: ChordProgression
    ) -> Dict[str, float]:
        """
        Compare two chord progressions for alignment.

        Args:
            progression1: First progression
            progression2: Second progression

        Returns:
            Dictionary with similarity metrics
        """
        chords1 = [c.chord for c in progression1.chords if c.chord != NO_CHORD]
        chords2 = [c.chord for c in progression2.chords if c.chord != NO_CHORD]

        set1 = set(chords1)
        set2 = set(chords2)

        if not set1 or not set2:
            chord_overlap = 0.0
        else:
            chord_overlap = len(set1 & set2) / len(set1 | set2)

        pattern1 = progression1.progression_pattern
        pattern2 = progression2.progression_pattern

        pattern_similarity = self._pattern_similarity(pattern1, pattern2)

        key_sim = 1.0 if progression1.key_estimate == progression2.key_estimate else 0.5

        return {
            "chord_overlap": chord_overlap,
            "pattern_similarity": pattern_similarity,
            "key_match": key_sim,
            "overall_similarity": (chord_overlap + pattern_similarity + key_sim) / 3,
        }

    def _smooth_chroma(self, chroma: np.ndarray) -> np.ndarray:
        """Apply temporal smoothing to chroma."""
        if self.smoothing_window <= 1:
            return chroma

        kernel = np.ones(self.smoothing_window) / self.smoothing_window
        smoothed = np.zeros_like(chroma)

        for i in range(chroma.shape[0]):
            smoothed[i] = np.convolve(chroma[i], kernel, mode="same")

        return smoothed

    def _match_chord(self, chroma_frame: np.ndarray) -> Tuple[str, float]:
        """Match chroma frame to best chord template."""
        scores = np.dot(self.template_matrix.T, chroma_frame)

        best_idx = np.argmax(scores)
        best_score = float(scores[best_idx])

        best_chord = self.template_names[best_idx]

        return best_chord, best_score

    def _merge_adjacent_chords(
        self, chords: List[ChordDetectionResult], min_duration: float = 0.5
    ) -> List[ChordDetectionResult]:
        """Merge consecutive identical chords."""
        if not chords:
            return chords

        merged = []
        current = chords[0]

        for chord in chords[1:]:
            if chord.chord == current.chord:
                current = ChordDetectionResult(
                    time=current.time,
                    chord=current.chord,
                    confidence=max(current.confidence, chord.confidence),
                    chroma_vector=(current.chroma_vector + chord.chroma_vector) / 2,
                )
            else:
                if current.time is not None:
                    merged.append(current)
                current = chord

        merged.append(current)

        return merged

    def _estimate_key_from_chords(self, chords: List[ChordDetectionResult]) -> str:
        """Estimate key from chord distribution."""
        chord_counts = {}

        for chord in chords:
            if chord.chord != NO_CHORD:
                chord_counts[chord.chord] = chord_counts.get(chord.chord, 0) + 1

        if not chord_counts:
            return "C major"

        most_common = max(chord_counts.keys(), key=lambda x: chord_counts[x])

        if most_common.endswith("m") and not most_common.endswith("m7"):
            key = most_common[:-1]
            return f"{key} minor"
        else:
            key = most_common.rstrip("7majdim")
            return f"{key} major"

    def _extract_progression_pattern(self, chords: List[ChordDetectionResult]) -> str:
        """Extract Roman numeral pattern from chords."""
        if not chords:
            return ""

        key = self._estimate_key_from_chords(chords)
        key_root = key.split()[0]

        key_idx = _notes.index(key_root) if key_root in _notes else 0

        pattern = []
        for chord in chords[:8]:
            if chord.chord == NO_CHORD:
                continue

            root = chord.chord.rstrip("m7majdimus4")

            if root not in _notes:
                continue

            chord_idx = _notes.index(root)
            interval = (chord_idx - key_idx) % 12

            numeral = self._interval_to_numeral(interval, chord.chord)
            pattern.append(numeral)

        return "-".join(pattern)

    def _interval_to_numeral(self, interval: int, chord: str) -> str:
        """Convert interval to Roman numeral."""
        numerals = [
            "I",
            "bII",
            "II",
            "bIII",
            "III",
            "IV",
            "bV",
            "V",
            "bVI",
            "VI",
            "bVII",
            "VII",
        ]
        numeral = numerals[interval]

        if "m" in chord and "maj7" not in chord:
            numeral = numeral.lower()

        return numeral

    def _calculate_complexity(self, chords: List[ChordDetectionResult]) -> float:
        """Calculate harmonic complexity score."""
        unique = set(c.chord for c in chords if c.chord != NO_CHORD)

        complexity = len(unique) / 12.0

        changes = sum(
            1 for i in range(1, len(chords)) if chords[i].chord != chords[i - 1].chord
        )

        change_rate = changes / max(len(chords) - 1, 1)

        return min(1.0, complexity * 0.7 + change_rate * 0.3)

    def _pattern_similarity(self, pattern1: str, pattern2: str) -> float:
        """Calculate similarity between progression patterns."""
        if not pattern1 or not pattern2:
            return 0.0

        numerals1 = set(pattern1.split("-"))
        numerals2 = set(pattern2.split("-"))

        if not numerals1 or not numerals2:
            return 0.0

        return len(numerals1 & numerals2) / len(numerals1 | numerals2)


def detect_chords(y: np.ndarray, sr: int = 44100) -> List[ChordDetectionResult]:
    """
    Convenience function for chord detection.

    Args:
        y: Audio time series
        sr: Sample rate

    Returns:
        List of chord detections
    """
    detector = ChordDetector(sr=sr)
    return detector.detect_chords(y, sr)


if __name__ == "__main__":
    print("Chord Detection Module")
    print("=" * 50)

    sr = 44100
    duration = 8.0

    t = np.linspace(0, duration, int(sr * duration))

    def make_chord(freqs, start, end, t, sr):
        """Create chord from frequencies."""
        y = np.zeros(int(sr * (end - start)))
        chord_t = np.linspace(0, end - start, len(y))
        for freq in freqs:
            y += 0.3 * np.sin(2 * np.pi * freq * chord_t)
        return y

    c_major = [261.63, 329.63, 392.00]  # C-E-G
    g_major = [196.00, 246.94, 293.66]  # G-B-D
    a_minor = [220.00, 261.63, 329.63]  # A-C-E
    f_major = [174.61, 220.00, 261.63]  # F-A-C

    y = np.zeros(int(sr * duration))

    chords_data = [
        (c_major, 0, 2),
        (g_major, 2, 4),
        (a_minor, 4, 6),
        (f_major, 6, 8),
    ]

    for freqs, start, end in chords_data:
        segment = make_chord(freqs, start, end, t, sr)
        start_idx = int(start * sr)
        end_idx = int(end * sr)
        y[start_idx:end_idx] = segment[: end_idx - start_idx]

    detector = ChordDetector(sr=sr)

    print("\nTest: C-G-Am-F Progression")
    print("-" * 30)

    progression = detector.detect_progression(y, sr)

    print(f"Detected chords:")
    for chord in progression.chords:
        print(f"  {chord.time:.1f}s: {chord.chord} (conf: {chord.confidence:.2f})")

    print(f"\nUnique chords: {progression.unique_chords}")
    print(f"Estimated key: {progression.key_estimate}")
    print(f"Progression pattern: {progression.progression_pattern}")
    print(f"Complexity score: {progression.complexity_score:.2f}")

    print("\n" + "=" * 50)
    print("Chord detection ready.")
