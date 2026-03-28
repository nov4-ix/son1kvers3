"""
Music Analyzer Service
Análisis completo de maquetas musicales
"""

import os
import asyncio
import numpy as np
import torch
import librosa
import librosa.display
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass, field
from enum import Enum
import logging
import tempfile
import hashlib

logger = logging.getLogger(__name__)


class Genre(Enum):
    """Géneros musicales soportados"""

    ELECTRONIC = "electronic"
    POP = "pop"
    ROCK = "rock"
    REGGAETON = "reggaeton"
    SALSA = "salsa"
    BACHATA = "bachata"
    TRAP = "trap"
    HIPHOP = "hiphop"
    CLASSICAL = "classical"
    JAZZ = "jazz"
    METAL = "metal"
    RNB = "rnb"
    UNKNOWN = "unknown"


class MusicSection(Enum):
    """Secciones musicales"""

    INTRO = "intro"
    VERSE = "verse"
    PRECHORUS = "pre-chorus"
    CHORUS = "chorus"
    BRIDGE = "bridge"
    OUTRO = "outro"
    INTERLUDE = "interlude"


@dataclass
class StemInfo:
    """Información de un stem separado"""

    stem_type: str  # drums, bass, melody, vocals, other
    file_path: str
    duration: float
    rms_energy: float
    has_lead_melody: bool


@dataclass
class VocalInfo:
    """Información de la voz detectada"""

    has_vocals: bool
    is_solo: bool
    harmony_count: int
    voice_type: str  # male, female, group
    lyrics_segments: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class StructureInfo:
    """Información de estructura musical"""

    sections: List[Dict[str, Any]]
    total_sections: int
    confidence: float
    time_signature: str


@dataclass
class RhythmInfo:
    """Información rítmica"""

    bpm: float
    downbeats: List[float]
    time_signature: Tuple[int, int]
    has_swing: bool
    beat_strength: List[float]


@dataclass
class TonalityInfo:
    """Información tonal"""

    key: str  # C, C#, D, etc.
    mode: str  # major, minor
    chord_progression: List[str]
    harmonic_complexity: float


@dataclass
class GenreInfo:
    """Información del género detectado"""

    genre: Genre
    subgenre: Optional[str]
    confidence: float
    tags: List[str]


@dataclass
class EnergyInfo:
    """Información de energía"""

    rms_energy: float
    peak_energy: float
    dynamic_range: float
    crest_factor: float
    energy_curve: List[float]


@dataclass
class MusicAnalysis:
    """Resultado completo del análisis"""

    # Identificador
    analysis_id: str
    original_file: str

    # Métricas básicas
    duration: float
    sample_rate: int
    channels: int

    # Análisis
    rhythm: RhythmInfo
    tonality: TonalityInfo
    structure: StructureInfo
    energy: EnergyInfo
    genre: GenreInfo
    vocals: VocalInfo

    # Stems separados (si se solicitó)
    stems: Optional[Dict[str, StemInfo]] = None

    # Lyrics transcritos (si se solicitó)
    lyrics: Optional[str] = None

    # Metadatos
    analysis_timestamp: str


class MusicAnalyzerService:
    def __init__(self):
        self.demucs_model = None
        self.whisper_model = None
        self.output_dir = "/outputs/analyzed"
        self.stems_dir = "/outputs/stems"

        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.stems_dir, exist_ok=True)

        # Perfiles de géneros para clasificación
        self.genre_profiles = self._init_genre_profiles()

    def _init_genre_profiles(self) -> Dict:
        """Inicializa perfiles para detección de género"""
        return {
            Genre.ELECTRONIC: {
                "spectral_centroid_range": (3000, 8000),
                "spectral_rolloff_range": (0.7, 0.95),
                "zero_crossing_rate_range": (0.1, 0.4),
            },
            Genre.POP: {
                "spectral_centroid_range": (2000, 4000),
                "spectral_rolloff_range": (0.5, 0.85),
                "zero_crossing_rate_range": (0.08, 0.25),
            },
            Genre.ROCK: {
                "spectral_centroid_range": (2500, 5000),
                "spectral_rolloff_range": (0.6, 0.9),
                "zero_crossing_rate_range": (0.1, 0.35),
            },
            Genre.CLASSICAL: {
                "spectral_centroid_range": (1500, 3500),
                "spectral_rolloff_range": (0.4, 0.75),
                "zero_crossing_rate_range": (0.05, 0.15),
            },
            Genre.JAZZ: {
                "spectral_centroid_range": (1800, 3800),
                "spectral_rolloff_range": (0.5, 0.8),
                "zero_crossing_rate_range": (0.08, 0.2),
            },
        }

    async def analyze(
        self,
        audio_path: str,
        detect_lyrics: bool = True,
        separate_stems: bool = False,
        language: str = "es",
    ) -> MusicAnalysis:
        """
        Análisis completo de una maqueta
        """
        logger.info(f"Starting analysis: {audio_path}")

        # Verificar archivo existe
        if not os.path.exists(audio_path):
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        # Generar ID único
        analysis_id = hashlib.md5(
            (audio_path + str(os.path.getmtime(audio_path))).encode()
        ).hexdigest()[:12]

        # Cargar audio
        y, sr = librosa.load(audio_path, sr=44100, mono=False)

        # Asegurar mono para análisis
        if len(y.shape) > 1:
            y_mono = librosa.to_mono(y)
        else:
            y_mono = y

        duration = len(y_mono) / sr

        # Análisis en paralelo
        (
            rhythm_info,
            tonality_info,
            structure_info,
            energy_info,
            genre_info,
            vocal_info,
        ) = await asyncio.gather(
            self._analyze_rhythm(y_mono, sr),
            self._analyze_tonality(y_mono, sr),
            self._analyze_structure(y_mono, sr),
            self._analyze_energy(y_mono, sr),
            self._detect_genre(y_mono, sr),
            self._analyze_vocals(y, sr),
        )

        # Transcribir lyrics si se solicita
        lyrics = None
        if detect_lyrics and vocal_info.has_vocals:
            lyrics = await self._transcribe_lyrics(audio_path, language)

        # Separar stems si se solicita
        stems = None
        if separate_stems:
            stems = await self._separate_stems(audio_path, analysis_id)

        return MusicAnalysis(
            analysis_id=analysis_id,
            original_file=audio_path,
            duration=duration,
            sample_rate=sr,
            channels=2 if len(y.shape) > 1 else 1,
            rhythm=rhythm_info,
            tonality=tonality_info,
            structure=structure_info,
            energy=energy_info,
            genre=genre_info,
            vocals=vocal_info,
            stems=stems,
            lyrics=lyrics,
            analysis_timestamp=str(asyncio.get_event_loop().time()),
        )

    async def _analyze_rhythm(self, y: np.ndarray, sr: int) -> RhythmInfo:
        """Análisis rítmico: BPM, downbeats, time signature"""

        # Detectar tempo
        tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
        bpm = float(tempo)

        # Detectar downbeats
        try:
            downbeat_frames = librosa.beat.beat_track(y=y, sr=sr, trim=False, spacing=4)
            downbeats = librosa.frames_to_time(downbeat_frames[0], sr=sr).tolist()
        except:
            downbeats = []

        # Detectar time signature (simplificado)
        # Asumir 4/4 por defecto
        time_signature = (4, 4)

        # Detectar swing
        # Comparar duraciones de beats consecutivos
        beat_times = librosa.frames_to_time(beats, sr=sr)
        if len(beat_times) > 2:
            intervals = np.diff(beat_times)
            swing = np.std(intervals) / np.mean(intervals)
            has_swing = swing > 0.15
        else:
            has_swing = False

        # Beat strength
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        beat_strength = librosa.frames_to_time(np.where(beats)[0], sr=sr)

        return RhythmInfo(
            bpm=bpm,
            downbeats=downbeats,
            time_signature=time_signature,
            has_swing=has_swing,
            beat_strength=beat_strength.tolist() if len(beat_strength) > 0 else [],
        )

    async def _analyze_tonality(self, y: np.ndarray, sr: int) -> TonalityInfo:
        """Análisis de tonalidad: key, modo, progresión"""

        # Análisis de cromas
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        chroma_mean = np.mean(chroma, axis=1)

        # Perfiles de key de Krumhansl-Schmuckler
        key_profiles_major = np.array(
            [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
        )
        key_profiles_minor = np.array(
            [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
        )

        # Notas
        notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

        # Buscar mejor correlación
        correlations = []

        # Mayor
        for i in range(12):
            shifted = np.roll(chroma_mean, i)
            corr = np.corrcoef(shifted, key_profiles_major)[0, 1]
            correlations.append((notes[i], "major", corr))

        # Menor
        for i in range(12):
            shifted = np.roll(chroma_mean, i)
            corr = np.corrcoef(shifted, key_profiles_minor)[0, 1]
            correlations.append((notes[i], "minor", corr))

        # Mejor correlación
        best = max(correlations, key=lambda x: x[2])
        key = best[0]
        mode = best[1]

        # Detectar progresión de acordes (simplificado)
        chord_progression = self._detect_chord_progression(chroma)

        # Complejidad armónica
        harmonic_complexity = float(np.std(chroma_mean))

        return TonalityInfo(
            key=key,
            mode=mode,
            chord_progression=chord_progression,
            harmonic_complexity=harmonic_complexity,
        )

    def _detect_chord_progression(self, chroma: np.ndarray) -> List[str]:
        """Detecta progresión de acordes básica"""
        # Simplificado: detectar cambios de acorde significativos
        chord_changes = []

        # Downsample para encontrar cambios
        n_chunks = min(16, chroma.shape[1])
        chunk_size = chroma.shape[1] // n_chunks

        for i in range(n_chunks):
            chunk = chroma[:, i * chunk_size : (i + 1) * chunk_size]
            root = np.argmax(np.mean(chunk, axis=1))

            notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
            chord_changes.append(notes[root])

        # Simplificar progresión
        return chord_changes

    async def _analyze_structure(self, y: np.ndarray, sr: int) -> StructureInfo:
        """Análisis de estructura musical"""

        # Usar clustering espectral para segmentación
        S = np.abs(librosa.stft(y))

        try:
            # Segmentación con clustering
            boundaries = librosa.segment.agglomerative(S, k=8)
            boundary_times = librosa.frames_to_time(boundaries, sr=sr)
        except:
            # Fallback a segmentación uniforme
            duration = len(y) / sr
            n_segments = 8
            boundary_times = np.linspace(0, duration, n_segments + 1)

        # Analizar energía por segmento
        rms = librosa.feature.rms(y=y)[0]
        rms_times = librosa.frames_to_time(range(len(rms)), sr=sr)

        sections = []
        for i in range(len(boundary_times) - 1):
            start = boundary_times[i]
            end = boundary_times[i + 1]

            # Encontrar índice de RMS correspondiente
            start_idx = np.argmin(np.abs(rms_times - start))
            end_idx = np.argmin(np.abs(rms_times - end))

            segment_rms = np.mean(rms[start_idx:end_idx]) if end_idx > start_idx else 0

            # Clasificar sección
            rms_mean = np.mean(rms)
            rms_std = np.std(rms)

            if segment_rms > rms_mean + rms_std:
                section_type = MusicSection.CHORUS.value
            elif segment_rms < rms_mean - rms_std * 0.5:
                section_type = MusicSection.VERSE.value
            elif i == 0:
                section_type = MusicSection.INTRO.value
            elif i == len(boundary_times) - 2:
                section_type = MusicSection.OUTRO.value
            else:
                section_type = MusicSection.BRIDGE.value

            sections.append(
                {
                    "type": section_type,
                    "start": float(start),
                    "end": float(end),
                    "duration": float(end - start),
                    "energy": float(segment_rms),
                }
            )

        return StructureInfo(
            sections=sections,
            total_sections=len(sections),
            confidence=0.75,
            time_signature="4/4",
        )

    async def _analyze_energy(self, y: np.ndarray, sr: int) -> EnergyInfo:
        """Análisis de energía"""

        # RMS energy
        rms = librosa.feature.rms(y=y)[0]
        rms_normalized = rms / (np.max(rms) + 1e-8)

        rms_energy = float(np.mean(rms_normalized))
        peak_energy = float(np.max(rms_normalized))

        # Dynamic range
        dynamic_range = float(
            20 * np.log10(np.max(rms) / (np.min(rms[rms > 0]) + 1e-8))
        )

        # Crest factor
        crest_factor = float(np.max(np.abs(y)) / (np.sqrt(np.mean(y**2)) + 1e-8))

        # Energy curve
        n_points = min(100, len(rms))
        indices = np.linspace(0, len(rms) - 1, n_points).astype(int)
        energy_curve = rms_normalized[indices].tolist()

        return EnergyInfo(
            rms_energy=rms_energy,
            peak_energy=peak_energy,
            dynamic_range=dynamic_range,
            crest_factor=crest_factor,
            energy_curve=energy_curve,
        )

    async def _detect_genre(self, y: np.ndarray, sr: int) -> GenreInfo:
        """Detección de género musical"""

        # Extraer features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mfcc_mean = np.mean(mfcc, axis=1)

        spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
        spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
        zero_crossing = np.mean(librosa.feature.zero_crossing_rate(y))

        # Clasificación por reglas
        confidence = 0.6
        detected_genre = Genre.UNKNOWN
        tags = []

        if spectral_centroid > 4000 and spectral_rolloff > 0.8:
            detected_genre = Genre.ELECTRONIC
            confidence = 0.75
            tags = ["electronic", "high-energy", "synth"]
        elif spectral_centroid > 2000 and spectral_centroid < 4000:
            if zero_crossing < 0.15:
                detected_genre = Genre.CLASSICAL
                confidence = 0.7
                tags = ["orchestral", "acoustic"]
            else:
                detected_genre = Genre.POP
                confidence = 0.65
                tags = ["pop", "mainstream"]
        elif spectral_centroid < 2500:
            detected_genre = Genre.ROCK
            confidence = 0.65
            tags = ["rock", "guitar", "band"]

        return GenreInfo(
            genre=detected_genre, subgenre=None, confidence=confidence, tags=tags
        )

    async def _analyze_vocals(self, y: np.ndarray, sr: int) -> VocalInfo:
        """Detección de voz en el audio"""

        # Usar detección de pitch para estimar presencia de voz
        # En producción usaríamos Demucs para separación vocal

        y_mono = librosa.to_mono(y) if len(y.shape) > 1 else y

        # Detectar si hay energía en rangos típicos de voz
        # Voz humana típicamente 85-255 Hz (fundamental)

        # Análisis simplificado
        has_vocals = False

        # 检测频谱中的低频能量
        S = np.abs(librosa.stft(y_mono))
        freqs = librosa.fft_frequencies(sr=sr)

        # Rango de voz humana
        voice_mask = (freqs >= 80) & (freqs <= 400)
        voice_energy = np.mean(S[voice_mask, :])
        total_energy = np.mean(S) + 1e-8

        if voice_energy / total_energy > 0.3:
            has_vocals = True

        return VocalInfo(
            has_vocals=has_vocals, is_solo=True, harmony_count=0, voice_type="unknown"
        )

    async def _transcribe_lyrics(
        self, audio_path: str, language: str = "es"
    ) -> Optional[str]:
        """Transcripción de lyrics con Whisper"""

        try:
            if self.whisper_model is None:
                import whisper

                logger.info("Loading Whisper model...")
                self.whisper_model = whisper.load_model("base")

            result = self.whisper_model.transcribe(audio_path, language=language)
            return result.get("text", "")

        except Exception as e:
            logger.error(f"Lyrics transcription failed: {e}")
            return None

    async def _separate_stems(
        self, audio_path: str, analysis_id: str
    ) -> Optional[Dict[str, StemInfo]]:
        """Separación de stems usando Demucs"""

        try:
            # Verificar si Demucs está disponible
            try:
                from demucs import pretrained
                from demucs.apply import apply_model
            except ImportError:
                logger.warning("Demucs not available, skipping stem separation")
                return None

            # Cargar modelo
            if self.demucs_model is None:
                self.demucs_model = pretrained.get_model("htdemucs")

            # Separar
            # (Implementación simplificada)

            output_path = os.path.join(self.stems_dir, analysis_id)
            os.makedirs(output_path, exist_ok=True)

            # En producción, aquí usarías Demucs
            # Por ahora retornamos None

            return None

        except Exception as e:
            logger.error(f"Stem separation failed: {e}")
            return None

    def get_analysis_summary(self, analysis: MusicAnalysis) -> Dict[str, Any]:
        """Obtiene un resumen del análisis"""
        return {
            "id": analysis.analysis_id,
            "duration": f"{analysis.duration:.1f}s",
            "bpm": analysis.rhythm.bpm,
            "key": f"{analysis.tonality.key} {analysis.tonality.mode}",
            "genre": analysis.genre.genre.value,
            "sections": analysis.structure.total_sections,
            "has_vocals": analysis.vocals.has_vocals,
            "energy": analysis.energy.rms_energy,
        }


# Instancia global
analyzer_service = MusicAnalyzerService()
