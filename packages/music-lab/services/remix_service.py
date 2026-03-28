"""
Remix/Cover/Upgrade Service
Sistema de remezcla de maquetas con slider de fidelidad
"""

import os
import asyncio
import uuid
import hashlib
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RemixMode(Enum):
    """Modos de remezcla según fidelidad"""
    REMIX = "remix"          # 0-33% fidelidad - reimaginación
    COVER = "cover"          # 34-66% fidelidad - mantener melodía
    UPGRADE = "upgrade"     # 67-100% fidelidad - solo mejorar calidad


class TierLevel(Enum):
    """Niveles de suscripción"""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    "enterprise"


@dat ENTERPRISE =aclass
class RemixRequest:
    """Solicitud de remix"""
    user_id: str
    audio_path: str
    fidelity: float          # 0-100
    tier: TierLevel
    language: str = "es"
    
    @property
    def mode(self) -> RemixMode:
        if self.fidelity <= 33:
            return RemixMode.REMIX
        elif self.fidelity <= 66:
            return RemixMode.COVER
        else:
            return RemixMode.UPGRADE
    
    @property
    def mode_label(self) -> str:
        labels = {
            RemixMode.REMIX: "Remix",
            RemixMode.COVER: "Cover",
            RemixMode.UPGRADE: "Upgrade"
        }
        return labels[self.mode]


@dataclass
class RemixJob:
    """Trabajo de remix"""
    job_id: str
    user_id: str
    status: str          # pending, processing, completed, failed
    progress: float      # 0-1
    mode: RemixMode
    fidelity: float
    output_path: Optional[str] = None
    stems_path: Optional[Dict[str, str]] = None
    error: Optional[str] = None
    created_at: str = ""
    completed_at: Optional[str] = None


@dataclass
class RemixResult:
    """Resultado del remix"""
    job_id: str
    status: str
    output_path: Optional[str]
    stems: Optional[Dict[str, str]]
    fidelity: float
    mode: str
    duration: float


class RemixService:
    def __init__(
        self,
        analyzer_service,
        voice_service,
        musicgen_service
    ):
        self.analyzer = analyzer_service
        self.voice_service = voice_service
        self.musicgen = musicgen_service
        
        self.output_dir = "/outputs/remix"
        self.stems_dir = "/outputs/remix_stems"
        
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.stems_dir, exist_ok=True)
        
        # Jobs activos
        self.jobs: Dict[str, RemixJob] = {}
        
        # Configuración por modo
        self.mode_configs = {
            RemixMode.REMIX: {
                "keep_structure": True,
                "keep_genre": True,
                "keep_bpm": True,
                "keep_key": False,
                "regenerate_instrumental": True,
                "regenerate_vocals": True,
                "stem_separation": False
            },
            RemixMode.COVER: {
                "keep_structure": True,
                "keep_genre": True,
                "keep_bpm": True,
                "keep_key": True,
                "regenerate_instrumental": True,
                "regenerate_vocals": False,
                "stem_separation": True
            },
            RemixMode.UPGRADE: {
                "keep_structure": True,
                "keep_genre": True,
                "keep_bpm": True,
                "keep_key": True,
                "regenerate_instrumental": False,
                "regenerate_vocals": False,
                "stem_separation": True
            }
        }
    
    def check_tier_access(self, tier: TierLevel, mode: RemixMode) -> bool:
        """Verifica si el tier tiene acceso al modo"""
        tier_modes = {
            TierLevel.FREE: [RemixMode.REMIX],
            TierLevel.BASIC: [RemixMode.REMIX, RemixMode.COVER],
            TierLevel.PRO: [RemixMode.REMIX, RemixMode.COVER, RemixMode.UPGRADE],
            TierLevel.ENTERPRISE: [RemixMode.REMIX, RemixMode.COVER, RemixMode.UPGRADE]
        }
        
        return mode in tier_modes.get(tier, [])
    
    async def create_remix(
        self,
        request: RemixRequest
    ) -> RemixJob:
        """
        Crea un nuevo trabajo de remix
        """
        # Verificar acceso por tier
        if not self.check_tier_access(request.tier, request.mode):
            raise ValueError(
                f"Tier {request.tier.value} no tiene acceso al modo {request.mode.value}"
            )
        
        # Crear job
        job_id = f"remix_{hashlib.md5(str(datetime.now()).encode()).hexdigest()[:12]}"
        
        job = RemixJob(
            job_id=job_id,
            user_id=request.user_id,
            status="pending",
            progress=0.0,
            mode=request.mode,
            fidelity=request.fidelity,
            created_at=datetime.now().isoformat()
        )
        
        self.jobs[job_id] = job
        
        # Procesar en background
        asyncio.create_task(self._process_remix(job, request))
        
        logger.info(f"Created remix job {job_id}: {request.mode_label} ({request.fidelity}%)")
        
        return job
    
    async def _process_remix(self, job: RemixJob, request: RemixRequest):
        """Procesa el remix"""
        try:
            job.status = "processing"
            job.progress = 0.1
            
            # Análisis de la maqueta
            logger.info(f"Analyzing audio: {request.audio_path}")
            analysis = await self.analyzer.analyze(
                request.audio_path,
                detect_lyrics=True,
                separate_stems=(request.mode != RemixMode.REMIX)
            )
            
            job.progress = 0.3
            
            # Obtener configuración del modo
            config = self.mode_configs[request.mode]
            
            # Generar resultado según modo
            if request.mode == RemixMode.REMIX:
                result = await self._generate_remix(analysis, request, config)
            elif request.mode == RemixMode.COVER:
                result = await self._generate_cover(analysis, request, config)
            else:  # UPGRADE
                result = await self._generate_upgrade(analysis, request, config)
            
            job.progress = 0.9
            
            # Guardar resultado
            job.output_path = result["output_path"]
            job.stems_path = result.get("stems")
            job.status = "completed"
            job.progress = 1.0
            job.completed_at = datetime.now().isoformat()
            
            logger.info(f"Remix job {job.job_id} completed")
            
        except Exception as e:
            job.status = "failed"
            job.error = str(e)
            logger.error(f"Remix job {job.job_id} failed: {e}")
    
    async def _generate_remix(
        self,
        analysis,
        request: RemixRequest,
        config: Dict
    ) -> Dict:
        """
        REMIX (0-33% fidelidad)
        - Solo mantener estructura básica (A-B-A-B)
        - Regenerar todo con nuevo estilo
        """
        logger.info("Generating REMIX...")
        
        # Prompt para MusicGen
        genre = analysis.genre.genre.value
        bpm = analysis.rhythm.bpm
        
        prompt = f"{genre} music, {bpm} BPM, "
        
        if analysis.tonality.mode:
            prompt += f"{analysis.tonality.mode}, "
        
        prompt += "high energy, modern production"
        
        # Generar instrumental nuevo
        instrumental_path = await self.musicgen.generate(
            prompt=prompt,
            duration=int(analysis.duration),
            genre=genre
        )
        
        # Regenerar vocals si existen
        vocals_path = None
        if analysis.vocals.has_vocals and analysis.lyrics:
            voice_sample = type('VoiceSample', (), {
                'user_id': request.user_id,
                'audio_path': '',
                'duration': 0,
                'sample_rate': 24000,
                'language': request.language
            })()
            
            vocals = await self.voice_service.clone_voice(
                text=analysis.lyrics,
                voice_sample=voice_sample,
                engine=type('VoiceEngine', (), {'value': 'coqui'})()
            )
            vocals_path = vocals.audio_path
        
        # Mezclar
        output_path = await self._mix_audio(
            instrumental=instrumental_path,
            vocals=vocals_path,
            bpm=bpm
        )
        
        return {
            "output_path": output_path,
            "stems": {
                "instrumental": instrumental_path,
                "vocals": vocals_path
            }
        }
    
    async def _generate_cover(
        self,
        analysis,
        request: RemixRequest,
        config: Dict
    ) -> Dict:
        """
        COVER (34-66% fidelidad)
        - Mantener melodía y progresión
        - Cambiar estilo/producción
        """
        logger.info("Generating COVER...")
        
        # Obtener stems separados
        stems = analysis.stems if analysis.stems else {}
        
        # Regenerar instrumental con similar melodía
        genre = analysis.genre.genre.value
        bpm = analysis.rhythm.bpm
        
        prompt = f"{genre} music, {bpm} BPM, "
        prompt += "cover version, similar melody, modern production"
        
        instrumental_path = await self.musicgen.generate(
            prompt=prompt,
            duration=int(analysis.duration),
            genre=genre,
            reference=stems.get("melody")
        )
        
        # Usar vocals originales o clonarlos
        vocals_path = None
        if analysis.vocals.has_vocals:
            if stems.get("vocals"):
                vocals_path = stems["vocals"]
            elif analysis.lyrics:
                voice_sample = type('VoiceSample', (), {
                    'user_id': request.user_id,
                    'audio_path': '',
                    'duration': 0,
                    'sample_rate': 24000,
                    'language': request.language
                })()
                
                vocals = await self.voice_service.clone_voice(
                    text=analysis.lyrics,
                    voice_sample=voice_sample
                )
                vocals_path = vocals.audio_path
        
        # Mezclar
        output_path = await self._mix_audio(
            instrumental=instrumental_path,
            vocals=vocals_path,
            bpm=bpm
        )
        
        return {
            "output_path": output_path,
            "stems": {
                "instrumental": instrumental_path,
                "vocals": vocals_path,
                "drums": stems.get("drums"),
                "bass": stems.get("bass")
            }
        }
    
    async def _generate_upgrade(
        self,
        analysis,
        request: RemixRequest,
        config: Dict
    ) -> Dict:
        """
        UPGRADE (67-100% fidelidad)
        - Mantener todo, solo mejorar calidad
        - Usar stems + mastering
        """
        logger.info("Generating UPGRADE...")
        
        # Obtener stems separados
        stems = analysis.stems
        
        if not stems:
            # Separar si no existen
            analysis = await self.analyzer.analyze(
                request.audio_path,
                separate_stems=True
            )
            stems = analysis.stems
        
        # Mejorar cada stem
        improved_stems = {}
        
        stem_types = ["drums", "bass", "melody", "vocals", "other"]
        
        for stem_type in stem_types:
            if stem_type in stems:
                stem_path = stems[stem_type]
                improved_stems[stem_type] = await self._enhance_stem(
                    stem_path, 
                    stem_type
                )
        
        # Remasterizar
        output_path = await self._master_audio(
            stems=improved_stems,
            target_lufs=-14,
            true_peak=-1.0
        )
        
        return {
            "output_path": output_path,
            "stems": improved_stems
        }
    
    async def _mix_audio(
        self,
        instrumental: str,
        vocals: Optional[str],
        bpm: float
    ) -> str:
        """Mezcla instrumental + vocals"""
        
        output_path = os.path.join(
            self.output_dir, 
            f"mix_{uuid.uuid4().hex[:8]}.wav"
        )
        
        # Implementar mezcla real
        # Por ahora retornar path simulado
        logger.info(f"Mixing: instrumental={instrumental}, vocals={vocals}")
        
        return output_path
    
    async def _enhance_stem(
        self,
        stem_path: str,
        stem_type: str
    ) -> str:
        """Mejora un stem específico"""
        
        output_path = os.path.join(
            self.stems_dir,
            f"enhanced_{stem_type}_{uuid.uuid4().hex[:8]}.wav"
        )
        
        # Aplicar EQ, compresión, etc. según tipo de stem
        logger.info(f"Enhancing stem: {stem_type}")
        
        return output_path
    
    async def _master_audio(
        self,
        stems: Dict[str, str],
        target_lufs: float,
        true_peak: float
    ) -> str:
        """Mastering final"""
        
        output_path = os.path.join(
            self.output_dir,
            f"mastered_{uuid.uuid4().hex[:8]}.wav"
        )
        
        # Aplicar mastering
        logger.info(f"Mastering to {target_lufs} LUFS, {true_peak} dB TP")
        
        return output_path
    
    async def get_job_status(self, job_id: str) -> Optional[RemixJob]:
        """Obtiene el estado de un trabajo"""
        return self.jobs.get(job_id)
    
    def get_fidelity_options(self, tier: TierLevel) -> Dict[str, Any]:
        """Obtiene las opciones de fidelidad disponibles según tier"""
        
        options = {
            "modes": [],
            "max_fidelity": 33,
            "stems_available": False,
            "voice_cloning": False
        }
        
        tier_access = {
            TierLevel.FREE: {
                "modes": [{"value": "remix", "label": "Remix", "range": [0, 33]}],
                "max_fidelity": 33,
                "stems_available": False,
                "voice_cloning": False
            },
            TierLevel.BASIC: {
                "modes": [
                    {"value": "remix", "label": "Remix", "range": [0, 33]},
                    {"value": "cover", "label": "Cover", "range": [34, 66]}
                ],
                "max_fidelity": 66,
                "stems_available": True,
                "voice_cloning": True
            },
            TierLevel.PRO: {
                "modes": [
                    {"value": "remix", "label": "Remix", "range": [0, 33]},
                    {"value": "cover", "label": "Cover", "range": [34, 66]},
                    {"value": "upgrade", "label": "Upgrade", "range": [67, 100]}
                ],
                "max_fidelity": 100,
                "stems_available": True,
                "voice_cloning": True
            },
            TierLevel.ENTERPRISE: {
                "modes": [
                    {"value": "remix", "label": "Remix", "range": [0, 33]},
                    {"value": "cover", "label": "Cover", "range": [34, 66]},
                    {"value": "upgrade", "label": "Upgrade", "range": [67, 100]}
                ],
                "max_fidelity": 100,
                "stems_available": True,
                "voice_cloning": True,
                "fine_tuning": True
            }
        }
        
        return tier_access.get(tier, tier_access[TierLevel.FREE])


# Instancia global (se inicializa con servicios)
remix_service = None
