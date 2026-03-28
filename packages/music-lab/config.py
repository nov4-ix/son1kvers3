"""
Music Lab Configuration
Centralized configuration for the Music Generation Research Lab
"""

import os
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any
import torch

BASE_DIR = Path(__file__).parent.absolute()
OUTPUTS_DIR = BASE_DIR / "outputs"

PATHS = {
    "raw_output": OUTPUTS_DIR / "raw",
    "processed_output": OUTPUTS_DIR / "processed",
    "reports_output": OUTPUTS_DIR / "reports",
}

HEARTMULA_MODEL_NAME = "Ademola265/HeartMuLa-oss-3B"
HEARTMULA_DEVICE_MAP = "auto"
HEARTMULA_TORCH_DTYPE = "float16"

AUDIO_CONFIG = {
    "sample_rate": 44100,
    "bit_depth": 24,
    "channels": 2,
    "target_lufs": -14.0,
    "true_peak_db": -1.0,
}

GENERATION_CONFIG = {
    "max_new_tokens": 2048,
    "temperature": 0.9,
    "top_p": 0.95,
    "top_k": 50,
    "do_sample": True,
    "num_return_sequences": 1,
}

SECTION_TEMPLATES = {
    "intro": {"energy": 0.4, "typical_duration_ratio": 0.08},
    "verse": {"energy": 0.6, "typical_duration_ratio": 0.20},
    "chorus": {"energy": 0.9, "typical_duration_ratio": 0.25},
    "bridge": {"energy": 0.7, "typical_duration_ratio": 0.12},
    "outro": {"energy": 0.3, "typical_duration_ratio": 0.10},
    "pre_chorus": {"energy": 0.7, "typical_duration_ratio": 0.10},
    "post_chorus": {"energy": 0.8, "typical_duration_ratio": 0.08},
}

DEFAULT_SONG_STRUCTURE = [
    "intro",
    "verse",
    "chorus",
    "verse",
    "chorus",
    "bridge",
    "chorus",
    "outro",
]

MASTERING_CONFIG = {
    "compressor": {
        "low_threshold_db": -20,
        "low_ratio": 3.0,
        "mid_threshold_db": -18,
        "mid_ratio": 2.5,
        "high_threshold_db": -16,
        "high_ratio": 2.0,
        "attack_ms": 10.0,
        "release_ms": 100.0,
    },
    "stereo_enhancer": {
        "width_factor": 1.2,
        "harmonic_excitation": True,
        "excitation_mix": 0.15,
    },
    "limiter": {
        "threshold_db": -1.0,
        "release_ms": 50.0,
    },
}


@dataclass
class SongParams:
    genre: str
    mood: str
    language: str
    duration_seconds: int
    lyrics: Optional[str] = None
    bpm: Optional[int] = None
    title: Optional[str] = None
    structure: Optional[List[str]] = None

    def __post_init__(self):
        if self.structure is None:
            self.structure = DEFAULT_SONG_STRUCTURE.copy()
        if self.bpm is None:
            self.bpm = self._estimate_bpm()
        if self.title is None:
            self.title = f"{self.genre}_{self.mood}_{self.duration_seconds}s"

    def _estimate_bpm(self) -> int:
        genre_bpm = {
            "latin pop": 110,
            "pop": 120,
            "rock": 130,
            "hip hop": 90,
            "electronic": 128,
            "jazz": 100,
            "classical": 80,
            "r&b": 95,
            "country": 110,
            "reggae": 75,
            "edm": 128,
            "house": 125,
        }
        genre_lower = self.genre.lower()
        for key, bpm in genre_bpm.items():
            if key in genre_lower:
                return bpm
        return 120


@dataclass
class Section:
    name: str
    start_time: float
    duration: float
    energy: float
    prompt_suffix: str = ""


@dataclass
class GenerationResult:
    audio_path: str
    duration: float
    sample_rate: int
    sections: List[Section]
    generation_time: float
    vram_used_mb: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProcessingResult:
    input_path: str
    output_path: str
    loudness_lufs: float
    true_peak_db: float
    processing_time: float
    stages_applied: List[str]


@dataclass
class MetricsReport:
    generation_id: str
    song_params: Dict[str, Any]
    generation_metrics: Dict[str, Any]
    audio_metrics: Dict[str, Any]
    performance_metrics: Dict[str, Any]
    timestamp: str


def get_device() -> torch.device:
    if torch.cuda.is_available():
        device = torch.device("cuda")
        print(f"[Config] CUDA available: {torch.cuda.get_device_name(0)}")
        print(
            f"[Config] VRAM: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB"
        )
    else:
        device = torch.device("cpu")
        print("[Config] CUDA not available, using CPU")
    return device


def ensure_directories():
    for path in PATHS.values():
        path.mkdir(parents=True, exist_ok=True)
        print(f"[Config] Ensured directory: {path}")


DEVICE = get_device()
