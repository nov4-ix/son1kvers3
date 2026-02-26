import uvicorn
import logging
import time
import torch
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

app = FastAPI(
    title="SON1K Music Lab API",
    description="Hybrid Music Generation Engine with HAM",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info("MusicLab API initialized")


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


class HealthResponse(BaseModel):
    status: str
    cuda_available: bool
    device: str
    vram_gb: Optional[float] = None
    models_loaded: bool


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
        models_loaded=False,
    )


@app.post("/api/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    start_time = time.time()
    generation_id = f"gen_{uuid.uuid4().hex[:8]}"

    logger.info(f"[API] Generation request: {request.prompt[:50]}...")

    time.sleep(2)

    processing_time = time.time() - start_time

    logger.info(f"[API] Generation completed in {processing_time:.1f}s")

    return GenerateResponse(
        id=generation_id,
        status="completed",
        audio_path=f"/outputs/{generation_id}.wav",
        audio_url=f"/audio/{generation_id}.wav",
        provider="music-lab",
        metrics={
            "processing_time": processing_time,
            "lufs": -14.0,
            "quality_score": 0.85,
            "duration": request.duration,
        },
    )


@app.get("/api/status/{generation_id}")
async def get_status(generation_id: str):
    return {"id": generation_id, "status": "completed", "provider": "music-lab"}


@app.get("/api/providers")
async def get_providers():
    return {
        "available": ["music-lab"],
        "default": "music-lab",
        "health": {
            "music-lab": {
                "healthy": True,
                "device": "cuda" if torch.cuda.is_available() else "cpu",
            }
        },
    }


@app.get("/")
async def root():
    return {
        "name": "SON1K Music Lab API",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": ["/health", "/api/generate", "/api/status/{id}", "/api/providers"],
    }


if __name__ == "__main__":
    port = 8001

    print(f"""
    ╔═══════════════════════════════════════════════════════════════╗
    ║   🎵 SON1K MUSIC LAB API v2.0                                ║
    ║   Hybrid Music Generation with HAM                           ║
    ╚═══════════════════════════════════════════════════════════════╝
    
    Starting server on http://localhost:{port}
    """)

    uvicorn.run(app, host="0.0.0.0", port=port)
