"""
SON1K Music Lab API
Hybrid Music Generation Engine with Voice Cloning, Analysis & Remix
Version 3.0.0
"""

import uvicorn
import logging
import time
import torch
import uuid
import os
import asyncio
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SON1K Music Lab API",
    description="""Hybrid Music Generation Engine with:
    - HeartMuLa + HAM for music generation
    - Voice Cloning (Coqui TTS, Bark, XTTS)
    - Music Analysis (BPM, Key, Genre, Structure)
    - Remix/Cover/Upgrade with fidelity slider
    """,
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("MusicLab API v3.0 initialized")

OUTPUT_DIR = "/outputs"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================
# MODELOS DE REQUEST/RESPONSE
# ============================================


class GenerateRequest(BaseModel):
    prompt: str
    genre: Optional[str] = "electronic"
    mood: Optional[str] = "energetic"
    duration: Optional[int] = 60
    language: Optional[str] = "en"
    quality: Optional[str] = "standard"
    title: Optional[str] = None
    lyrics: Optional[str] = None


class GenerateResponse(BaseModel):
    id: str
    status: str
    audio_path: Optional[str] = None
    audio_url: Optional[str] = None
    provider: str = "music-lab"
    metrics: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class AnalyzeRequest(BaseModel):
    audio_url: str
    detect_lyrics: bool = True
    separate_stems: bool = False
    language: str = "es"


class AnalyzeResponse(BaseModel):
    analysis_id: str
    status: str
    results: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class VoiceCloneRequest(BaseModel):
    text: str
    voice_sample_url: Optional[str] = None
    engine: str = "coqui"
    language: str = "es"
    speed: float = 1.0


class VoiceCloneResponse(BaseModel):
    voice_id: str
    status: str
    audio_url: Optional[str] = None
    duration: Optional[float] = None
    error: Optional[str] = None


class FineTuneRequest(BaseModel):
    user_id: str
    voice_samples: List[str]
    language: str = "es"


class FineTuneResponse(BaseModel):
    job_id: str
    status: str
    progress: float
    error: Optional[str] = None


class RemixRequest(BaseModel):
    audio_url: str
    fidelity: float
    tier: str = "free"
    language: str = "es"


class RemixResponse(BaseModel):
    job_id: str
    status: str
    mode: str
    progress: float
    output_url: Optional[str] = None
    error: Optional[str] = None


class FidelityOptionsResponse(BaseModel):
    modes: List[Dict[str, Any]]
    max_fidelity: int
    stems_available: bool
    voice_cloning: bool
    fine_tuning: bool = False


class HealthResponse(BaseModel):
    status: str
    cuda_available: bool
    device: str
    vram_gb: Optional[float] = None
    models_loaded: Dict[str, bool]


# ============================================
# ENDPOINTS - HEALTH
# ============================================


@app.get("/health", response_model=HealthResponse)
async def health_check():
    cuda_available = torch.cuda.is_available()
    device = (
        "cuda"
        if cuda_available
        else "mps"
        if torch.backends.mps.is_available()
        else "cpu"
    )

    vram_gb = None
    if cuda_available:
        try:
            vram_gb = torch.cuda.get_device_properties(0).total_memory / 1e9
        except:
            pass

    return HealthResponse(
        status="healthy",
        cuda_available=cuda_available,
        device=device,
        vram_gb=vram_gb,
        models_loaded={
            "musicgen": False,
            "coqui": False,
            "bark": False,
            "whisper": False,
            "demucs": False,
        },
    )


# ============================================
# ENDPOINTS - MUSIC GENERATION
# ============================================


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    """Genera música usando HeartMuLa + HAM"""
    start_time = time.time()
    generation_id = f"gen_{uuid.uuid4().hex[:8]}"

    logger.info(f"[API] Generation request: {request.prompt[:50]}...")

    try:
        # Simular generación (en producción usar MusicGen)
        await asyncio.sleep(2)

        processing_time = time.time() - start_time

        audio_path = f"{OUTPUT_DIR}/{generation_id}.wav"

        logger.info(f"[API] Generation completed in {processing_time:.1f}s")

        return GenerateResponse(
            id=generation_id,
            status="completed",
            audio_path=audio_path,
            audio_url=f"/audio/{generation_id}.wav",
            provider="music-lab",
            metrics={
                "processing_time": processing_time,
                "lufs": -14.0,
                "quality_score": 0.85,
                "duration": request.duration,
            },
        )

    except Exception as e:
        logger.error(f"[API] Generation failed: {e}")
        return GenerateResponse(
            id=generation_id, status="failed", provider="music-lab", error=str(e)
        )


@app.get("/api/generate/{generation_id}")
async def get_generation_status(generation_id: str):
    """Obtiene el estado de una generación"""
    return {"id": generation_id, "status": "completed", "provider": "music-lab"}


# ============================================
# ENDPOINTS - MUSIC ANALYSIS
# ============================================


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze_audio(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    detect_lyrics: bool = True,
    separate_stems: bool = False,
    language: str = "es",
):
    """Analiza una maqueta musical"""
    analysis_id = f"analysis_{uuid.uuid4().hex[:8]}"

    logger.info(f"[API] Analysis request: {analysis_id}")

    try:
        # Guardar archivo subido
        audio_path = f"{OUTPUT_DIR}/upload_{analysis_id}_{file.filename}"

        with open(audio_path, "wb") as f:
            content = await file.read()
            f.write(content)

        # En producción, aquí usamos analyzer_service
        # Por ahora retornamos resultado simulado

        return AnalyzeResponse(
            analysis_id=analysis_id,
            status="completed",
            results={
                "duration": 180.5,
                "bpm": 120,
                "key": "C major",
                "genre": "electronic",
                "has_vocals": True,
                "sections": 8,
                "energy": 0.75,
            },
        )

    except Exception as e:
        logger.error(f"[API] Analysis failed: {e}")
        return AnalyzeResponse(analysis_id=analysis_id, status="failed", error=str(e))


@app.get("/api/analyze/{analysis_id}")
async def get_analysis_status(analysis_id: str):
    """Obtiene el resultado de un análisis"""
    return {
        "analysis_id": analysis_id,
        "status": "completed",
        "results": {
            "duration": 180.5,
            "bpm": 120,
            "key": "C major",
            "genre": "electronic",
        },
    }


# ============================================
# ENDPOINTS - VOICE CLONING
# ============================================


@app.post("/api/voice/clone", response_model=VoiceCloneResponse)
async def clone_voice(request: VoiceCloneRequest):
    """Clona voz usando Coqui/Bark/XTTS"""
    voice_id = f"voice_{uuid.uuid4().hex[:8]}"

    logger.info(f"[API] Voice cloning request: {voice_id}")

    try:
        # Simular clonación
        await asyncio.sleep(1)

        audio_path = f"{OUTPUT_DIR}/voices/{voice_id}.wav"

        return VoiceCloneResponse(
            voice_id=voice_id,
            status="completed",
            audio_url=f"/audio/voices/{voice_id}.wav",
            duration=len(request.text) / 15,
        )

    except Exception as e:
        logger.error(f"[API] Voice cloning failed: {e}")
        return VoiceCloneResponse(voice_id=voice_id, status="failed", error=str(e))


@app.post("/api/voice/finetune", response_model=FineTuneResponse)
async def fine_tune_voice(request: FineTuneRequest):
    """Inicia fine-tuning de voz (Enterprise only)"""
    job_id = f"finetune_{uuid.uuid4().hex[:8]}"

    logger.info(f"[API] Fine-tune request: {job_id} for user {request.user_id}")

    # Verificar tier del usuario (en producción)

    return FineTuneResponse(job_id=job_id, status="processing", progress=0.0)


@app.get("/api/voice/finetune/{job_id}")
async def get_fine_tune_status(job_id: str):
    """Obtiene estado de fine-tuning"""
    return {
        "job_id": job_id,
        "status": "completed",
        "progress": 1.0,
        "model_path": f"/voice_models/user/{job_id}",
    }


@app.get("/api/voice/engines")
async def get_voice_engines():
    """Lista motores de voz disponibles"""
    return {
        "engines": [
            {
                "id": "coqui",
                "name": "Coqui TTS",
                "description": "Rápido, buena calidad",
                "languages": ["es", "en", "de", "fr", "it", "pt", "ja", "ko", "zh"],
            },
            {
                "id": "bark",
                "name": "Bark",
                "description": "Más expresivo",
                "languages": ["es", "en", "de", "fr"],
            },
            {
                "id": "xtts",
                "name": "XTTS v2",
                "description": "Mejor calidad de clonación",
                "languages": ["es", "en"],
            },
        ]
    }


# ============================================
# ENDPOINTS - REMIX/COVER/UPGRADE
# ============================================


@app.post("/api/remix", response_model=RemixResponse)
async def create_remix(request: RemixRequest):
    """Crea remix/cover/upgrade de una maqueta"""
    job_id = f"remix_{uuid.uuid4().hex[:8]}"

    # Determinar modo
    if request.fidelity <= 33:
        mode = "remix"
    elif request.fidelity <= 66:
        mode = "cover"
    else:
        mode = "upgrade"

    logger.info(f"[API] Remix request: {job_id} - {mode} ({request.fidelity}%)")

    # Simular procesamiento
    await asyncio.sleep(1)

    return RemixResponse(job_id=job_id, status="processing", mode=mode, progress=0.1)


@app.get("/api/remix/{job_id}")
async def get_remix_status(job_id: str):
    """Obtiene estado del remix"""
    return {
        "job_id": job_id,
        "status": "completed",
        "mode": "cover",
        "progress": 1.0,
        "output_url": f"/audio/remix/{job_id}.wav",
    }


@app.get("/api/remix/options/{tier}")
async def get_fidelity_options(tier: str):
    """Obtiene opciones de fidelidad según tier"""

    tier_options = {
        "free": {
            "modes": [{"value": "remix", "label": "Remix", "range": [0, 33]}],
            "max_fidelity": 33,
            "stems_available": False,
            "voice_cloning": False,
            "fine_tuning": False,
        },
        "basic": {
            "modes": [
                {"value": "remix", "label": "Remix", "range": [0, 33]},
                {"value": "cover", "label": "Cover", "range": [34, 66]},
            ],
            "max_fidelity": 66,
            "stems_available": True,
            "voice_cloning": True,
            "fine_tuning": False,
        },
        "pro": {
            "modes": [
                {"value": "remix", "label": "Remix", "range": [0, 33]},
                {"value": "cover", "label": "Cover", "range": [34, 66]},
                {"value": "upgrade", "label": "Upgrade", "range": [67, 100]},
            ],
            "max_fidelity": 100,
            "stems_available": True,
            "voice_cloning": True,
            "fine_tuning": False,
        },
        "enterprise": {
            "modes": [
                {"value": "remix", "label": "Remix", "range": [0, 33]},
                {"value": "cover", "label": "Cover", "range": [34, 66]},
                {"value": "upgrade", "label": "Upgrade", "range": [67, 100]},
            ],
            "max_fidelity": 100,
            "stems_available": True,
            "voice_cloning": True,
            "fine_tuning": True,
        },
    }

    return tier_options.get(tier, tier_options["free"])


# ============================================
# ENDPOINTS - PROVIDERS
# ============================================


@app.get("/api/providers")
async def get_providers():
    """Lista proveedores de generación disponibles"""
    return {
        "available": ["music-lab"],
        "default": "music-lab",
        "voice_engines": ["coqui", "bark", "xtts"],
        "health": {
            "music-lab": {
                "healthy": True,
                "device": "cuda" if torch.cuda.is_available() else "cpu",
            },
            "coqui": {"healthy": True},
            "bark": {"healthy": True},
            "xtts": {"healthy": True},
        },
    }


# ============================================
# ENDPOINTS - ROOT
# ============================================


@app.get("/")
async def root():
    return {
        "name": "SON1K Music Lab API",
        "version": "3.0.0",
        "status": "operational",
        "features": [
            "Music Generation (HeartMuLa + HAM)",
            "Voice Cloning (Coqui, Bark, XTTS)",
            "Music Analysis (BPM, Key, Genre)",
            "Remix/Cover/Upgrade",
            "Fine-tuning (Enterprise)",
        ],
        "endpoints": {
            "health": "/health",
            "generate": "/api/generate",
            "analyze": "/api/analyze",
            "voice_clone": "/api/voice/clone",
            "voice_finetune": "/api/voice/finetune",
            "remix": "/api/remix",
            "providers": "/api/providers",
        },
    }


# ============================================
# MAIN
# ============================================

if __name__ == "__main__":
    port = 8001

    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║   🎵 SON1K MUSIC LAB API v3.0                                ║
    ║   Hybrid Music Generation + Voice + Analysis                ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    Starting server on http://localhost:{port}
    
    Endpoints:
    - POST /api/generate     → Generate music
    - POST /api/analyze      → Analyze audio
    - POST /api/voice/clone  → Clone voice
    - POST /api/voice/finetune → Fine-tune voice (Enterprise)
    - POST /api/remix        → Remix/Cover/Upgrade
    - GET  /api/providers    → List providers
    """)

    uvicorn.run(app, host="0.0.0.0", port=port)
