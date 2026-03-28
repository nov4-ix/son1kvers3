"""
HeartMuLa Generator
Core music generation engine using HeartMuLa model from HuggingFace
"""

import time
import gc
from typing import List, Optional, Dict, Any, Tuple
from pathlib import Path
import numpy as np

import torch
import torchaudio

from config import (
    SongParams,
    Section,
    GenerationResult,
    HEARTMULA_MODEL_NAME,
    HEARTMULA_DEVICE_MAP,
    HEARTMULA_TORCH_DTYPE,
    AUDIO_CONFIG,
    GENERATION_CONFIG,
    DEVICE,
    PATHS,
)
from generators.section_composer import SectionComposer
from utils.audio_io import (
    save_audio,
    concatenate_sections,
    get_audio_duration,
    generate_output_path,
    ensure_stereo,
)
from utils.logging import setup_logger, PerformanceTracker, log_gpu_memory

logger = setup_logger("HeartMuLaGenerator")


class HeartMuLaGenerator:
    def __init__(
        self,
        model_name: str = HEARTMULA_MODEL_NAME,
        device: Optional[torch.device] = None,
        torch_dtype: Optional[torch.dtype] = None,
    ):
        self.model_name = model_name
        self.device = device or DEVICE
        self.torch_dtype = (
            torch_dtype
            if torch_dtype
            else getattr(torch, HEARTMULA_TORCH_DTYPE)
            if isinstance(HEARTMULA_TORCH_DTYPE, str)
            else torch.float16
            if self.device.type == "cuda"
            else torch.float32
        )

        self.model = None
        self.processor = None
        self.is_loaded = False
        self._vram_at_load = 0

        logger.info(f"HeartMuLa Generator initialized")
        logger.info(f"  Model: {self.model_name}")
        logger.info(f"  Device: {self.device}")
        logger.info(f"  Dtype: {self.torch_dtype}")

    def load_model(self) -> bool:
        if self.is_loaded:
            logger.info("Model already loaded")
            return True

        try:
            with PerformanceTracker("Model Loading") as tracker:
                logger.info(f"Loading HeartMuLa model from {self.model_name}...")

                self._load_transformers_model()

                if self.device.type == "cuda":
                    torch.cuda.synchronize()
                    self._vram_at_load = torch.cuda.memory_allocated() / 1e6
                    log_gpu_memory(logger)
                    tracker.add_metric("vram_mb", self._vram_at_load)

                self.is_loaded = True
                logger.info("Model loaded successfully!")
                return True

        except torch.cuda.OutOfMemoryError as e:
            logger.error(f"CUDA Out of Memory: {e}")
            logger.warning("Attempting CPU fallback...")
            return self._fallback_to_cpu()

        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return False

    def _load_transformers_model(self):
        from transformers import AutoModelForCausalLM, AutoProcessor, AutoTokenizer

        logger.info("Loading as Transformers model...")

        load_kwargs = {
            "pretrained_model_name_or_path": self.model_name,
            "trust_remote_code": True,
        }

        if self.device.type == "cuda":
            load_kwargs["torch_dtype"] = self.torch_dtype
            load_kwargs["device_map"] = HEARTMULA_DEVICE_MAP
            if torch.cuda.get_device_properties(0).total_memory < 16 * 1e9:
                load_kwargs["low_cpu_mem_usage"] = True

        try:
            self.model = AutoModelForCausalLM.from_pretrained(**load_kwargs)
        except Exception as e:
            logger.warning(f"Failed to load as CausalLM: {e}")
            from transformers import AutoModel

            self.model = AutoModel.from_pretrained(**load_kwargs)

        try:
            self.processor = AutoProcessor.from_pretrained(
                self.model_name, trust_remote_code=True
            )
        except Exception:
            self.processor = AutoTokenizer.from_pretrained(
                self.model_name, trust_remote_code=True
            )

        if self.device.type == "cuda" and not hasattr(self.model, "hf_device_map"):
            self.model = self.model.to(self.device)

    def _fallback_to_cpu(self) -> bool:
        self.device = torch.device("cpu")
        self.torch_dtype = torch.float32

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info("Retrying model load on CPU...")
        return self.load_model()

    def generate(
        self,
        params: SongParams,
        sections: Optional[List[Section]] = None,
        output_path: Optional[Path] = None,
    ) -> GenerationResult:
        if not self.is_loaded:
            if not self.load_model():
                raise RuntimeError("Failed to load HeartMuLa model")

        if sections is None:
            composer = SectionComposer(params)
            sections = composer.compose()

        if output_path is None:
            output_path = generate_output_path(
                prefix=params.title or "song",
                suffix="raw",
                extension="wav",
                output_type="raw",
            )

        logger.info(f"Starting generation for: {params.title}")
        logger.info(f"  Genre: {params.genre}, Mood: {params.mood}")
        logger.info(f"  Duration target: {params.duration_seconds}s")
        logger.info(f"  Sections: {len(sections)}")

        start_time = time.time()
        audio_sections = []
        section_times = []

        with PerformanceTracker(f"Generation: {params.title}") as tracker:
            for i, section in enumerate(sections):
                section_start = time.time()
                logger.info(
                    f"\n--- Generating Section {i + 1}/{len(sections)}: {section.name.upper()} ---"
                )

                section_audio = self._generate_section(
                    section=section,
                    params=params,
                    section_index=i,
                    total_sections=len(sections),
                )

                if section_audio is not None:
                    audio_sections.append(section_audio)
                    section_time = time.time() - section_start
                    section_times.append(
                        {
                            "section": section.name,
                            "time": section_time,
                            "duration_samples": section_audio.shape[-1]
                            if section_audio is not None
                            else 0,
                        }
                    )
                    tracker.checkpoint(f"section_{section.name}")
                    logger.info(
                        f"Section {section.name} generated in {section_time:.2f}s"
                    )
                else:
                    logger.warning(
                        f"Section {section.name} returned None, generating fallback"
                    )
                    audio_sections.append(self._generate_fallback_section(section))

                if self.device.type == "cuda":
                    log_gpu_memory(logger)

            logger.info("\n--- Concatenating Sections ---")
            final_audio = concatenate_sections(audio_sections, crossfade_samples=4410)
            final_audio = ensure_stereo(final_audio)

            save_audio(final_audio, output_path, AUDIO_CONFIG["sample_rate"])

            generation_time = time.time() - start_time
            actual_duration = get_audio_duration(
                final_audio, AUDIO_CONFIG["sample_rate"]
            )

            vram_used = 0.0
            if self.device.type == "cuda":
                vram_used = torch.cuda.memory_allocated() / 1e6

            result = GenerationResult(
                audio_path=str(output_path),
                duration=actual_duration,
                sample_rate=AUDIO_CONFIG["sample_rate"],
                sections=sections,
                generation_time=generation_time,
                vram_used_mb=vram_used,
                metadata={
                    "section_times": section_times,
                    "params": {
                        "genre": params.genre,
                        "mood": params.mood,
                        "language": params.language,
                        "bpm": params.bpm,
                    },
                },
            )

            tracker.add_metric("total_time", generation_time)
            tracker.add_metric("actual_duration", actual_duration)
            tracker.add_metric("vram_mb", vram_used)

            logger.info(f"\n=== Generation Complete ===")
            logger.info(f"  Output: {output_path}")
            logger.info(
                f"  Duration: {actual_duration:.2f}s (target: {params.duration_seconds}s)"
            )
            logger.info(f"  Total time: {generation_time:.2f}s")
            logger.info(f"  VRAM used: {vram_used:.1f}MB")

            return result

    def _generate_section(
        self,
        section: Section,
        params: SongParams,
        section_index: int,
        total_sections: int,
    ) -> Optional[np.ndarray]:
        prompt = self._build_prompt(section, params, section_index, total_sections)

        logger.info(f"Prompt: {prompt[:100]}...")

        try:
            if hasattr(self.model, "generate_audio"):
                return self._generate_audio_method(prompt, section)
            elif hasattr(self.processor, "__call__") and callable(self.processor):
                return self._generate_with_processor(prompt, section)
            else:
                return self._generate_text_to_audio(prompt, section)

        except Exception as e:
            logger.error(f"Error generating section {section.name}: {e}")
            return None

    def _build_prompt(
        self,
        section: Section,
        params: SongParams,
        section_index: int,
        total_sections: int,
    ) -> str:
        parts = [
            f"Genre: {params.genre}",
            f"Mood: {params.mood}",
            f"Language: {params.language}",
            f"BPM: {params.bpm}",
            f"Section: {section.name}",
            f"Energy level: {section.energy:.1f}",
            f"Duration: approximately {section.duration:.0f} seconds",
        ]

        if section.prompt_suffix:
            parts.append(f"Style notes: {section.prompt_suffix}")

        if params.lyrics and section.name in ["verse", "chorus", "bridge"]:
            lyrics_excerpt = (
                params.lyrics[:200] if len(params.lyrics) > 200 else params.lyrics
            )
            parts.append(f"Lyrics context: {lyrics_excerpt}")

        return ". ".join(parts)

    def _generate_audio_method(
        self, prompt: str, section: Section
    ) -> Optional[np.ndarray]:
        logger.info("Using generate_audio method...")

        gen_kwargs = {
            "prompt": prompt,
            "duration_seconds": section.duration,
            **GENERATION_CONFIG,
        }

        with torch.no_grad():
            audio = self.model.generate_audio(**gen_kwargs)

        if isinstance(audio, torch.Tensor):
            audio = audio.cpu().numpy()

        return audio

    def _generate_with_processor(
        self, prompt: str, section: Section
    ) -> Optional[np.ndarray]:
        logger.info("Using processor-based generation...")

        inputs = self.processor(
            prompt,
            return_tensors="pt",
            padding=True,
            truncation=True,
        )

        if self.device.type == "cuda":
            inputs = {
                k: v.to(self.device) if isinstance(v, torch.Tensor) else v
                for k, v in inputs.items()
            }

        gen_config = {
            **inputs,
            **GENERATION_CONFIG,
            "max_new_tokens": int(section.duration * 50),
        }

        with torch.no_grad():
            outputs = self.model.generate(**gen_config)

        if outputs.dim() == 3 and outputs.shape[1] >= 2:
            audio = outputs[0, :2, :].cpu().numpy()
        elif outputs.dim() == 2:
            audio = outputs.cpu().numpy()
        else:
            audio = outputs.cpu().numpy()
            if audio.ndim == 1:
                audio = np.stack([audio, audio])

        return audio

    def _generate_text_to_audio(
        self, prompt: str, section: Section
    ) -> Optional[np.ndarray]:
        logger.info("Using text-to-audio pipeline...")

        target_samples = int(section.duration * AUDIO_CONFIG["sample_rate"])

        try:
            if hasattr(self.processor, "encode"):
                inputs = self.processor.encode(prompt, return_tensors="pt")
            else:
                inputs = self.processor(prompt, return_tensors="pt")

            if isinstance(inputs, dict):
                input_ids = inputs.get("input_ids", inputs.get("inputs", None))
            else:
                input_ids = inputs

            if input_ids is None:
                return self._generate_fallback_section(section)

            if self.device.type == "cuda":
                input_ids = input_ids.to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    input_ids,
                    max_new_tokens=min(
                        int(section.duration * 100), GENERATION_CONFIG["max_new_tokens"]
                    ),
                    temperature=GENERATION_CONFIG["temperature"],
                    top_p=GENERATION_CONFIG["top_p"],
                    do_sample=GENERATION_CONFIG["do_sample"],
                )

            audio = self._decode_to_audio(outputs, target_samples)
            return audio

        except Exception as e:
            logger.error(f"Text-to-audio failed: {e}")
            return self._generate_fallback_section(section)

    def _decode_to_audio(
        self, outputs: torch.Tensor, target_samples: int
    ) -> np.ndarray:
        if outputs.dim() == 3:
            outputs = outputs.squeeze(0)

        if outputs.shape[0] < target_samples:
            outputs = torch.nn.functional.interpolate(
                outputs.unsqueeze(0), size=target_samples, mode="linear"
            ).squeeze(0)
        elif outputs.shape[0] > target_samples:
            outputs = outputs[:target_samples]

        audio = outputs.cpu().float().numpy()
        audio = audio / (np.max(np.abs(audio)) + 1e-8) * 0.9

        if audio.ndim == 1:
            audio = np.stack([audio, audio])
        elif audio.ndim > 2:
            audio = audio[:2]

        return audio

    def _generate_fallback_section(self, section: Section) -> np.ndarray:
        logger.warning(f"Generating synthetic fallback for section: {section.name}")

        sr = AUDIO_CONFIG["sample_rate"]
        duration = section.duration
        n_samples = int(duration * sr)
        t = np.linspace(0, duration, n_samples)

        base_freq = 220 * (1 + section.energy * 0.5)

        freq_mod = 1 + 0.02 * np.sin(2 * np.pi * 0.5 * t)
        carrier = np.sin(2 * np.pi * base_freq * freq_mod * t)

        harmonics = np.zeros_like(t)
        for h in range(2, 6):
            harmonics += (1 / h) * np.sin(2 * np.pi * base_freq * h * t)

        audio = 0.6 * carrier + 0.4 * harmonics / 4

        envelope = np.ones_like(t)
        attack = int(0.1 * sr)
        release = int(0.3 * sr)
        envelope[:attack] = np.linspace(0, 1, attack)
        envelope[-release:] = np.linspace(1, 0, release)
        audio = audio * envelope

        audio = audio / (np.max(np.abs(audio)) + 1e-8) * 0.7 * section.energy

        stereo = np.stack([audio, audio * 0.95])
        return stereo.astype(np.float32)

    def unload_model(self):
        if self.model is not None:
            del self.model
            self.model = None
        if self.processor is not None:
            del self.processor
            self.processor = None

        self.is_loaded = False

        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info("Model unloaded and memory freed")


def generate_song(
    params: SongParams,
    output_path: Optional[Path] = None,
    generator: Optional[HeartMuLaGenerator] = None,
) -> GenerationResult:
    if generator is None:
        generator = HeartMuLaGenerator()
        generator.load_model()

    sections = SectionComposer(params).compose()
    return generator.generate(params, sections, output_path)
