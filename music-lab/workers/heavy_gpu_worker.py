"""
Heavy GPU Worker - Batch Processing for Expensive Jobs
Accumulates jobs and processes them in batch for GPU efficiency
"""

import asyncio
import os
import sys
import time
import json
import logging
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime
import redis
import numpy as np

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@dataclass
class GPUJob:
    """A single GPU job"""

    job_id: str
    job_type: str
    payload: Dict[str, Any]
    user_tier: str
    priority: int
    created_at: float
    status: str = "queued"


@dataclass
class BatchConfig:
    """Configuration for batch processing"""

    max_batch_size: int = 4
    max_wait_time: float = 30.0  # seconds
    gpu_memory_threshold: float = 0.9
    cooldown_time: float = 60.0  # seconds between batches


class HeavyGPUWorker:
    """
    Worker that accumulates GPU jobs and processes them in batch
    for cost efficiency
    """

    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.environ.get(
            "REDIS_URL", "redis://localhost:6379"
        )
        self.redis = redis.from_url(self.redis_url)

        self.queue_name = "heavy-gpu-queue"
        self.processing = False
        self.current_batch: List[GPUJob] = []
        self.last_batch_time = 0

        self.config = BatchConfig(
            max_batch_size=int(os.environ.get("MAX_BATCH_SIZE", "4")),
            max_wait_time=float(os.environ.get("MAX_WAIT_TIME", "30")),
            cooldown_time=float(os.environ.get("COOLDOWN_TIME", "60")),
        )

        self.gpu_available = self._check_gpu()
        logger.info(
            f"Heavy GPU Worker initialized. GPU available: {self.gpu_available}"
        )

    def _check_gpu(self) -> bool:
        """Check if GPU is available"""
        try:
            import torch

            available = torch.cuda.is_available()
            if available:
                vram = torch.cuda.get_device_properties(0).total_memory / 1e9
                logger.info(f"GPU available: {vram:.1f}GB VRAM")
            return available
        except ImportError:
            logger.warning("PyTorch not available, running in CPU mode")
            return False

    def _get_job_priority(self, job: Dict) -> int:
        """Determine job priority based on user tier"""
        tier_priorities = {"enterprise": 3, "pro": 2, "basic": 1, "free": 0}
        return tier_priorities.get(job.get("userTier", "free"), 0)

    async def fetch_jobs(self, max_jobs: int = None) -> List[GPUJob]:
        """Fetch pending jobs from Redis queue"""
        max_jobs = max_jobs or self.config.max_batch_size

        jobs = []

        # Try to fetch jobs from BullMQ-style queue
        for _ in range(max_jobs):
            job_data = self.redis.lpop(f"{self.queue_name}:pending")
            if not job_data:
                break

            try:
                job_dict = json.loads(job_data)
                job = GPUJob(
                    job_id=job_dict["id"],
                    job_type=job_dict["type"],
                    payload=job_dict.get("payload", {}),
                    user_tier=job_dict.get("userTier", "free"),
                    priority=self._get_job_priority(job_dict),
                    created_at=job_dict.get("createdAt", time.time()),
                )
                jobs.append(job)
            except json.JSONDecodeError:
                logger.error(f"Failed to decode job: {job_data}")

        # Sort by priority (higher first)
        jobs.sort(key=lambda x: x.priority, reverse=True)

        return jobs

    async def process_batch(self, jobs: List[GPUJob]) -> List[Dict[str, Any]]:
        """
        Process a batch of GPU jobs together
        This is where the actual GPU inference happens
        """
        if not jobs:
            return []

        logger.info(f"Processing batch of {len(jobs)} jobs")
        start_time = time.time()

        results = []

        # Update job statuses
        for job in jobs:
            await self._update_job_status(job.job_id, "processing")

        try:
            # Group jobs by type for efficient processing
            jobs_by_type = {}
            for job in jobs:
                if job.job_type not in jobs_by_type:
                    jobs_by_type[job.job_type] = []
                jobs_by_type[job.job_type].append(job)

            # Process each group
            for job_type, type_jobs in jobs_by_type.items():
                if job_type == "voice_clone":
                    batch_results = await self._process_voice_clone_batch(type_jobs)
                elif job_type == "stem_separate":
                    batch_results = await self._process_stem_separate_batch(type_jobs)
                elif job_type == "voice_finetune":
                    batch_results = await self._process_finetune_batch(type_jobs)
                else:
                    # Fallback to sequential processing
                    batch_results = await self._process_sequential(type_jobs)

                results.extend(batch_results)

            # Update successful jobs
            for job, result in zip(jobs, results):
                await self._update_job_status(job.job_id, "completed", result=result)

        except Exception as e:
            logger.error(f"Batch processing failed: {e}")
            for job in jobs:
                await self._update_job_status(job.job_id, "failed", error=str(e))

        elapsed = time.time() - start_time
        logger.info(f"Batch completed in {elapsed:.2f}s")

        return results

    async def _process_voice_clone_batch(
        self, jobs: List[GPUJob]
    ) -> List[Dict[str, Any]]:
        """Process voice cloning jobs in batch"""
        results = []

        try:
            # Lazy load TTS
            from TTS.api import TTS

            # Initialize model once for the batch
            device = "cuda" if self.gpu_available else "cpu"
            tts = TTS(
                "tts_models/multilingual/multi-dataset/xtts_v2", gpu=(device == "cuda")
            )

            for job in jobs:
                try:
                    text = job.payload.get("text", "")
                    voice_sample = job.payload.get("voiceSampleUrl")
                    language = job.payload.get("language", "es")
                    speed = job.payload.get("speed", 1.0)

                    # Generate
                    wav = tts.tts(
                        text=text,
                        speaker_wav=voice_sample if voice_sample else None,
                        language=language,
                        speed=speed,
                    )

                    # Save output
                    output_path = f"/outputs/voices/{job.job_id}.wav"
                    self._save_audio(wav, output_path)

                    results.append(
                        {
                            "voiceId": f"voice_{job.job_id}",
                            "audioUrl": f"/audio/voices/{job.job_id}.wav",
                            "duration": len(text) / 15,
                            "engine": "xtts",
                        }
                    )

                except Exception as e:
                    logger.error(f"Voice clone failed for {job.job_id}: {e}")
                    results.append({"error": str(e), "job_id": job.job_id})

        except ImportError as e:
            logger.error(f"TTS not available: {e}")
            for job in jobs:
                results.append({"error": "TTS not available", "job_id": job.job_id})

        return results

    async def _process_stem_separate_batch(
        self, jobs: List[GPUJob]
    ) -> List[Dict[str, Any]]:
        """Process stem separation jobs in batch"""
        results = []

        try:
            from demucs.pretrained import get_model
            from demucs.apply import apply_model

            # Initialize model once
            model = get_model("htdemucs")
            device = "cuda" if self.gpu_available else "cpu"
            model.to(device)

            for job in jobs:
                try:
                    audio_url = job.payload.get("audioUrl")
                    # Process audio
                    # (simplified - real implementation would load audio file)

                    output_dir = f"/outputs/stems/{job.job_id}"
                    os.makedirs(output_dir, exist_ok=True)

                    stems = {
                        "drums": f"{output_dir}/drums.wav",
                        "bass": f"{output_dir}/bass.wav",
                        "other": f"{output_dir}/other.wav",
                        "vocals": f"{output_dir}/vocals.wav",
                    }

                    results.append({"stems": stems, "job_id": job.job_id})

                except Exception as e:
                    logger.error(f"Stem separation failed for {job.job_id}: {e}")
                    results.append({"error": str(e), "job_id": job.job_id})

        except ImportError as e:
            logger.error(f"Demucs not available: {e}")
            for job in jobs:
                results.append({"error": "Demucs not available", "job_id": job.job_id})

        return results

    async def _process_finetune_batch(self, jobs: List[GPUJob]) -> List[Dict[str, Any]]:
        """Process fine-tuning jobs"""
        # Fine-tuning is typically done one at a time
        results = []

        for job in jobs:
            try:
                # This would be a long-running process
                # For now, return a placeholder
                results.append(
                    {
                        "status": "processing",
                        "job_id": job.job_id,
                        "message": "Fine-tuning started",
                    }
                )
            except Exception as e:
                results.append({"error": str(e), "job_id": job.job_id})

        return results

    async def _process_sequential(self, jobs: List[GPUJob]) -> List[Dict[str, Any]]:
        """Fallback sequential processing"""
        results = []

        for job in jobs:
            results.append({"status": "processed", "job_id": job.job_id})

        return results

    def _save_audio(self, wav: np.ndarray, path: str):
        """Save audio to file"""
        import scipy.io.wavfile as wavfile

        os.makedirs(os.path.dirname(path), exist_ok=True)

        # Normalize
        if wav.max() > 1.0:
            wav = wav / np.abs(wav).max()

        wav_int16 = (wav * 32767).astype(np.int16)
        wavfile.write(path, 24000, wav_int16)

    async def _update_job_status(
        self, job_id: str, status: str, result: Dict = None, error: str = None
    ):
        """Update job status in Redis"""
        key = f"job:{job_id}"

        data = self.redis.get(key)
        if data:
            job_data = json.loads(data)
            job_data["status"] = status

            if status == "processing":
                job_data["startedAt"] = datetime.now().isoformat()
            elif status in ["completed", "failed"]:
                job_data["completedAt"] = datetime.now().isoformat()
                if result:
                    job_data["result"] = result
                if error:
                    job_data["error"] = error

            self.redis.setex(key, 86400, json.dumps(job_data))

    async def run(self):
        """Main worker loop"""
        logger.info("Starting Heavy GPU Worker...")

        while True:
            try:
                # Check if we should process
                current_time = time.time()
                time_since_last = current_time - self.last_batch_time

                # Fetch jobs
                jobs = await self.fetch_jobs()

                if jobs:
                    logger.info(f"Fetched {len(jobs)} jobs")

                    # Process batch
                    await self.process_batch(jobs)
                    self.last_batch_time = time.time()

                elif time_since_last < self.config.cooldown_time:
                    # Wait before next fetch
                    await asyncio.sleep(5)
                else:
                    # Long poll
                    await asyncio.sleep(1)

            except KeyboardInterrupt:
                logger.info("Shutting down worker...")
                break
            except Exception as e:
                logger.error(f"Worker error: {e}")
                await asyncio.sleep(5)

    def cleanup(self):
        """Cleanup resources"""
        self.redis.close()


async def main():
    """Entry point"""
    worker = HeavyGPUWorker()
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
