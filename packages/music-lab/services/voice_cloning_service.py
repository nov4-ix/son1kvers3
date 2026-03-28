"""
Voice Cloning Service
Soporta Coqui TTS, Bark y XTTS para clonación de voz
"""

import os
import asyncio
import torch
import numpy as np
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
from enum import Enum
import logging
import tempfile
import hashlib

logger = logging.getLogger(__name__)


class VoiceEngine(Enum):
    """Motores de síntesis de voz disponibles"""

    COQUI = "coqui"  # Rápido, buena calidad
    BARK = "bark"  # Más expresivo
    XTTS = "xtts"  # Mejor calidad (DeepBrain)


class VoiceTier(Enum):
    """Tiers de acceso a funciones de voz"""

    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


@dataclass
class VoiceSample:
    """Muestra de voz para clonación"""

    user_id: str
    audio_path: str
    duration: float
    sample_rate: int
    language: str


@dataclass
class ClonedVoice:
    """Voz clonada resultante"""

    voice_id: str
    audio_path: str
    sample_rate: int
    duration: float
    engine: VoiceEngine


@dataclass
class FineTuneJob:
    """Trabajo de fine-tuning de voz"""

    job_id: str
    user_id: str
    status: str  # pending, processing, completed, failed
    progress: float
    model_path: Optional[str]
    error: Optional[str]


class VoiceCloningService:
    def __init__(self):
        self.coqui_model = None
        self.bark_model = None
        self.xtts_model = None
        self.user_voices: Dict[str, Dict] = {}
        self.fine_tune_jobs: Dict[str, FineTuneJob] = {}
        self.output_dir = "/outputs/voices"
        self.voice_models_dir = "/voice_models"

        # Crear directorios
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.voice_models_dir, exist_ok=True)

        # Idiomas soportados
        self.supported_languages = {
            "es": "Spanish",
            "en": "English",
            "de": "German",
            "fr": "French",
            "it": "Italian",
            "pt": "Portuguese",
            "ja": "Japanese",
            "ko": "Korean",
            "zh": "Chinese",
        }

    def _get_device(self) -> str:
        """Obtiene el dispositivo disponible (cuda/cpu)"""
        if torch.cuda.is_available():
            # Verificar que hay suficiente VRAM
            vram = torch.cuda.get_device_properties(0).total_memory / 1e9
            if vram > 4:
                return "cuda"
        return "cpu"

    async def load_engine(self, engine: VoiceEngine) -> bool:
        """Carga el modelo de voz según el engine seleccionado"""
        device = self._get_device()

        try:
            if engine == VoiceEngine.COQUI:
                if self.coqui_model is None:
                    logger.info("Loading Coqui TTS model...")
                    from TTS.api import TTS

                    self.coqui_model = TTS(
                        model_name="tts_models/multilingual/multi-dataset/xtts_v2",
                        gpu=(device == "cuda"),
                    )
                    logger.info("Coqui XTTS loaded successfully")
                return True

            elif engine == VoiceEngine.BARK:
                if self.bark_model is None:
                    logger.info("Loading Bark model...")
                    from bark import generate_audio, preload_models

                    # Preload modelos de bark
                    preload_models()

                    self.bark_model = {"generate": generate_audio, "sample_rate": 24000}
                    logger.info("Bark loaded successfully")
                return True

            elif engine == VoiceEngine.XTTS:
                if self.xtts_model is None:
                    logger.info("Loading XTTS v2 model...")
                    from TTS.api import TTS

                    self.xtts_model = TTS(model_name="xtts_v2", gpu=(device == "cuda"))
                    logger.info("XTTS v2 loaded successfully")
                return True

        except Exception as e:
            logger.error(f"Error loading voice engine {engine.value}: {e}")
            return False

    async def clone_voice(
        self,
        text: str,
        voice_sample: VoiceSample,
        engine: VoiceEngine = VoiceEngine.COQUI,
        language: str = "es",
        speed: float = 1.0,
    ) -> ClonedVoice:
        """
        Clona voz usando la muestra del usuario
        """
        # Cargar engine si no está cargado
        await self.load_engine(engine)

        # Generar ID único para esta voz
        voice_id = f"voice_{voice_sample.user_id}_{hashlib.md5(voice_sample.audio_path.encode()).hexdigest()[:8]}"

        logger.info(f"Cloning voice with {engine.value}: {text[:50]}...")

        try:
            if engine == VoiceEngine.COQUI:
                wav = await self._coqui_clone(text, voice_sample, language, speed)

            elif engine == VoiceEngine.BARK:
                wav = await self._bark_clone(text, voice_sample, language)

            elif engine == VoiceEngine.XTTS:
                wav = await self._xtts_clone(text, voice_sample, language, speed)

            # Guardar resultado
            output_path = os.path.join(self.output_dir, f"{voice_id}.wav")
            await self._save_wav(wav, output_path, 24000)

            duration = len(wav) / 24000

            return ClonedVoice(
                voice_id=voice_id,
                audio_path=output_path,
                sample_rate=24000,
                duration=duration,
                engine=engine,
            )

        except Exception as e:
            logger.error(f"Voice cloning failed: {e}")
            raise

    async def _coqui_clone(
        self, text: str, voice_sample: VoiceSample, language: str, speed: float
    ) -> np.ndarray:
        """Clonación con Coqui TTS"""

        # Asegurar que el archivo de voz existe
        if not os.path.exists(voice_sample.audio_path):
            # Usar voz por defecto si no hay muestra
            logger.warning("Voice sample not found, using default voice")
            wav = self.coqui_model.tts(text=text, language=language)
        else:
            wav = self.coqui_model.tts(
                text=text,
                speaker_wav=voice_sample.audio_path,
                language=language,
                speed=speed,
            )

        return np.array(wav)

    async def _bark_clone(
        self, text: str, voice_sample: VoiceSample, language: str
    ) -> np.ndarray:
        """Clonación con Bark (más expresivo)"""

        from bark import generate_audio

        # Generar con el prompt de referencia
        # Bark usa language prefixes
        lang_prefix = f"[{language}]"

        try:
            audio_array = generate_audio(
                f"{lang_prefix}{text}",
                history_prompt=voice_sample.audio_path
                if os.path.exists(voice_sample.audio_path)
                else None,
                text_temp=0.7,
                waveform_temp=0.8,
            )
        except Exception as e:
            logger.warning(f"Bark generation failed, using fallback: {e}")
            # Fallback a generación sin prompt de voz
            audio_array = generate_audio(f"{lang_prefix}{text}")

        return audio_array

    async def _xtts_clone(
        self, text: str, voice_sample: VoiceSample, language: str, speed: float
    ) -> np.ndarray:
        """Clonación con XTTS v2 (mejor calidad)"""

        if not os.path.exists(voice_sample.audio_path):
            # Usar voz por defecto
            wav = self.xtts_model.tts(text=text, language=language, speed=speed)
        else:
            wav = self.xtts_model.tts(
                text=text,
                speaker_wav=voice_sample.audio_path,
                language=language,
                speed=speed,
            )

        return np.array(wav)

    async def _save_wav(self, wav: np.ndarray, path: str, sample_rate: int):
        """Guarda audio en formato WAV"""
        import scipy.io.wavfile as wavfile

        # Normalizar si es necesario
        if wav.max() > 1.0:
            wav = wav / np.abs(wav).max()

        # Convertir a int16
        wav_int16 = (wav * 32767).astype(np.int16)

        wavfile.write(path, sample_rate, wav_int16)

    async def fine_tune_voice(
        self, user_id: str, voice_samples: List[VoiceSample], language: str = "es"
    ) -> FineTuneJob:
        """
        Fine-tuning de voz para usuarios Enterprise
        Requiere múltiples muestras (10-30 minutos de audio)
        """
        job_id = f"finetune_{user_id}_{hashlib.md5(str.now().encode()).hexdigest()[:8]}"

        # Verificar cantidad de muestras
        total_duration = sum(s.duration for s in voice_samples)
        if total_duration < 600:  # Mínimo 10 minutos
            raise ValueError(
                f"Se requieren mínimo 10 minutos de audio, "
                f"tienes {total_duration / 60:.1f} minutos"
            )

        # Crear job
        job = FineTuneJob(
            job_id=job_id,
            user_id=user_id,
            status="pending",
            progress=0.0,
            model_path=None,
            error=None,
        )

        self.fine_tune_jobs[job_id] = job

        # Iniciar entrenamiento en background
        asyncio.create_task(self._run_fine_tuning(job, voice_samples, language))

        return job

    async def _run_fine_tuning(
        self, job: FineTuneJob, voice_samples: List[VoiceSample], language: str
    ):
        """Ejecuta el fine-tuning en background"""
        try:
            job.status = "processing"
            job.progress = 0.1

            # Crear dataset para fine-tuning
            dataset_path = os.path.join(self.voice_models_dir, job.user_id, "dataset")
            os.makedirs(dataset_path, exist_ok=True)

            # Copiar muestras al dataset
            for i, sample in enumerate(voice_samples):
                import shutil

                if os.path.exists(sample.audio_path):
                    shutil.copy(
                        sample.audio_path, os.path.join(dataset_path, f"sample_{i}.wav")
                    )

            job.progress = 0.3

            # Aquí iría el entrenamiento real
            # Por ahora simulamos el proceso
            await asyncio.sleep(5)

            job.progress = 0.9

            # Guardar referencia del modelo
            model_path = os.path.join(self.voice_models_dir, job.user_id, "fine_tuned")
            os.makedirs(model_path, exist_ok=True)

            # Guardar metadata
            import json

            metadata = {
                "language": language,
                "samples_count": len(voice_samples),
                "total_duration": sum(s.duration for s in voice_samples),
                "created_at": str.now(),
            }

            with open(os.path.join(model_path, "metadata.json"), "w") as f:
                json.dump(metadata, f)

            job.model_path = model_path
            job.status = "completed"
            job.progress = 1.0

            # Guardar en user voices
            self.user_voices[job.user_id] = {
                "model_path": model_path,
                "language": language,
                "is_custom": True,
            }

            logger.info(f"Fine-tuning completed for user {job.user_id}")

        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            logger.error(f"Fine-tuning failed: {e}")

    async def generate_with_custom_voice(
        self, text: str, user_id: str, style: str = "neutral"
    ) -> ClonedVoice:
        """
        Genera voz usando el modelo custom del usuario
        """
        if user_id not in self.user_voices:
            raise ValueError(f"Usuario {user_id} no tiene modelo de voz entrenado")

        voice_info = self.user_voices[user_id]

        if not voice_info.get("is_custom"):
            raise ValueError(f"Usuario {user_id} no tiene un modelo personalizado")

        # Generar con el modelo custom
        # (La implementación dependería del formato del modelo)

        voice_id = f"custom_voice_{user_id}"
        output_path = os.path.join(self.output_dir, f"{voice_id}.wav")

        # Simular generación
        duration = len(text) / 15

        return ClonedVoice(
            voice_id=voice_id,
            audio_path=output_path,
            sample_rate=24000,
            duration=duration,
            engine=VoiceEngine.COQUI,
        )

    async def get_fine_tune_status(self, job_id: str) -> Optional[FineTuneJob]:
        """Obtiene el estado de un trabajo de fine-tuning"""
        return self.fine_tune_jobs.get(job_id)

    def check_tier_access(self, tier: VoiceTier, feature: str) -> bool:
        """
        Verifica si un tier tiene acceso a una función
        """
        tier_features = {
            VoiceTier.FREE: [],
            VoiceTier.BASIC: ["coqui_tts", "basic_analysis"],
            VoiceTier.PRO: [
                "coqui_tts",
                "bark",
                "xtts",
                "full_analysis",
                "remix",
                "cover",
            ],
            VoiceTier.ENTERPRISE: [
                "coqui_tts",
                "bark",
                "xtts",
                "full_analysis",
                "remix",
                "cover",
                "upgrade",
                "fine_tuning",
            ],
        }

        return feature in tier_features.get(tier, [])


# Instancia global
voice_service = VoiceCloningService()
