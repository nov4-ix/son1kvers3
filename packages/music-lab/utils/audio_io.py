"""
Audio I/O Utilities
Handles reading, writing, and conversion of audio files
"""

import numpy as np
import soundfile as sf
import librosa
from pathlib import Path
from typing import Tuple, Optional, Union
import warnings

warnings.filterwarnings("ignore")

from config import AUDIO_CONFIG, PATHS


def load_audio(
    path: Union[str, Path], target_sr: Optional[int] = None
) -> Tuple[np.ndarray, int]:
    if target_sr is None:
        target_sr = AUDIO_CONFIG["sample_rate"]

    audio, sr = librosa.load(str(path), sr=target_sr, mono=False)

    if audio.ndim == 1:
        audio = np.stack([audio, audio])

    return audio, sr


def save_audio(
    audio: np.ndarray,
    path: Union[str, Path],
    sample_rate: Optional[int] = None,
    normalize: bool = False,
) -> Path:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)

    if sample_rate is None:
        sample_rate = AUDIO_CONFIG["sample_rate"]

    if audio.ndim == 2:
        if audio.shape[0] == 2:
            audio = audio.T
        elif audio.shape[0] > 2:
            audio = audio[:2].T

    if normalize:
        max_val = np.max(np.abs(audio))
        if max_val > 0:
            audio = audio / max_val * 0.95

    if audio.dtype != np.float32:
        audio = audio.astype(np.float32)

    subtype = "PCM_24" if AUDIO_CONFIG["bit_depth"] == 24 else "PCM_16"
    sf.write(str(path), audio, sample_rate, subtype=subtype)

    return path


def ensure_stereo(audio: np.ndarray) -> np.ndarray:
    if audio.ndim == 1:
        return np.stack([audio, audio])
    elif audio.shape[0] > 2:
        return audio[:2]
    elif audio.shape[0] == 1:
        return np.tile(audio, (2, 1))
    return audio


def resample_audio(audio: np.ndarray, orig_sr: int, target_sr: int) -> np.ndarray:
    if orig_sr == target_sr:
        return audio

    if audio.ndim == 2:
        return np.array(
            [
                librosa.resample(audio[0], orig_sr=orig_sr, target_sr=target_sr),
                librosa.resample(audio[1], orig_sr=orig_sr, target_sr=target_sr),
            ]
        )
    return librosa.resample(audio, orig_sr=orig_sr, target_sr=target_sr)


def get_audio_duration(audio: np.ndarray, sample_rate: int) -> float:
    if audio.ndim == 2:
        return audio.shape[1] / sample_rate
    return len(audio) / sample_rate


def concatenate_sections(sections: list, crossfade_samples: int = 4410) -> np.ndarray:
    if not sections:
        raise ValueError("No sections to concatenate")

    if crossfade_samples > 0 and len(sections) > 1:
        result = sections[0].copy()
        for i, section in enumerate(sections[1:], 1):
            if (
                result.shape[-1] >= crossfade_samples
                and section.shape[-1] >= crossfade_samples
            ):
                if result.ndim == 2:
                    fade_out = np.linspace(1, 0, crossfade_samples)
                    fade_in = np.linspace(0, 1, crossfade_samples)
                    result[:, -crossfade_samples:] *= fade_out
                    section_front = section[:, :crossfade_samples] * fade_in
                    result[:, -crossfade_samples:] += section_front
                    result = np.concatenate(
                        [result, section[:, crossfade_samples:]], axis=1
                    )
                else:
                    fade_out = np.linspace(1, 0, crossfade_samples)
                    fade_in = np.linspace(0, 1, crossfade_samples)
                    result[-crossfade_samples:] *= fade_out
                    section_front = section[:crossfade_samples] * fade_in
                    result[-crossfade_samples:] += section_front
                    result = np.concatenate([result, section[crossfade_samples:]])
            else:
                if result.ndim == 2:
                    result = np.concatenate([result, section], axis=1)
                else:
                    result = np.concatenate([result, section])
        return result
    else:
        if sections[0].ndim == 2:
            return np.concatenate(sections, axis=1)
        return np.concatenate(sections)


def generate_output_path(
    prefix: str, suffix: str = "", extension: str = "wav", output_type: str = "raw"
) -> Path:
    from datetime import datetime

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}"
    if suffix:
        filename += f"_{suffix}"
    filename += f".{extension}"

    base_path = PATHS.get(f"{output_type}_output", PATHS["raw_output"])
    return base_path / filename
