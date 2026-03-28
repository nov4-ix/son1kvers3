"""
Mastering Chain
Complete mastering pipeline combining all processing stages
"""

import time
import numpy as np
from pathlib import Path
from typing import Tuple, Dict, Optional, List

from config import ProcessingResult, AUDIO_CONFIG, MASTERING_CONFIG, PATHS
from post_processing.normalizer import Normalizer
from post_processing.compressor import MultibandCompressor
from post_processing.stereo_enhancer import StereoEnhancer
from utils.audio_io import load_audio, save_audio, generate_output_path
from utils.logging import setup_logger, PerformanceTracker

logger = setup_logger("MasteringChain")


class MasteringChain:
    def __init__(self, sample_rate: int = None, config: Dict = None):
        self.sample_rate = sample_rate or AUDIO_CONFIG["sample_rate"]
        self.config = config or MASTERING_CONFIG

        self.normalizer = Normalizer(
            target_lufs=AUDIO_CONFIG["target_lufs"],
            true_peak_db=AUDIO_CONFIG["true_peak_db"],
            sample_rate=self.sample_rate,
        )

        self.compressor = MultibandCompressor(
            sample_rate=self.sample_rate, config=self.config.get("compressor")
        )

        self.stereo_enhancer = StereoEnhancer(
            sample_rate=self.sample_rate, config=self.config.get("stereo_enhancer")
        )

        self.stages: List[str] = []

        logger.info("Mastering Chain initialized")
        logger.info(f"  Target LUFS: {AUDIO_CONFIG['target_lufs']}")
        logger.info(f"  True Peak: {AUDIO_CONFIG['true_peak_db']}dB")

    def master(
        self, input_path: Path, output_path: Optional[Path] = None
    ) -> ProcessingResult:
        start_time = time.time()

        if output_path is None:
            output_path = generate_output_path(
                prefix=input_path.stem,
                suffix="mastered",
                extension="wav",
                output_type="processed",
            )

        logger.info(f"Mastering: {input_path}")

        with PerformanceTracker("Mastering") as tracker:
            audio, sr = load_audio(input_path, self.sample_rate)
            tracker.checkpoint("loaded")

            self.stages = []
            all_metrics = {}

            logger.info("Stage 1: Normalization")
            audio, norm_metrics = self.normalizer.normalize(audio)
            self.stages.append("normalizer")
            all_metrics["normalizer"] = norm_metrics
            tracker.checkpoint("normalized")

            logger.info("Stage 2: Compression")
            audio, comp_metrics = self.compressor.compress(audio)
            self.stages.append("compressor")
            all_metrics["compression"] = comp_metrics
            tracker.checkpoint("compressed")

            logger.info("Stage 3: Stereo Enhancement")
            audio, stereo_metrics = self.stereo_enhancer.enhance(audio)
            self.stages.append("stereo_enhancer")
            all_metrics["stereo"] = stereo_metrics
            tracker.checkpoint("enhanced")

            logger.info("Stage 4: Final Limiting")
            audio, limiter_metrics = self._final_limit(audio)
            self.stages.append("limiter")
            all_metrics["limiter"] = limiter_metrics
            tracker.checkpoint("limited")

            logger.info(f"Saving to: {output_path}")
            save_audio(audio, output_path, self.sample_rate)

            processing_time = time.time() - start_time

            result = ProcessingResult(
                input_path=str(input_path),
                output_path=str(output_path),
                loudness_lufs=norm_metrics.get(
                    "output_lufs", AUDIO_CONFIG["target_lufs"]
                ),
                true_peak_db=AUDIO_CONFIG["true_peak_db"],
                processing_time=processing_time,
                stages_applied=self.stages,
            )

            logger.info(f"\n=== Mastering Complete ===")
            logger.info(f"  Output: {output_path}")
            logger.info(f"  Final LUFS: {result.loudness_lufs:.1f}")
            logger.info(f"  Processing time: {processing_time:.2f}s")
            logger.info(f"  Stages applied: {', '.join(self.stages)}")

            return result

    def _final_limit(self, audio: np.ndarray) -> Tuple[np.ndarray, Dict]:
        threshold_db = MASTERING_CONFIG["limiter"]["threshold_db"]
        release_ms = MASTERING_CONFIG["limiter"]["release_ms"]

        threshold_linear = 10 ** (threshold_db / 20)
        release_samples = int(release_ms * self.sample_rate / 1000)

        if audio.ndim == 2:
            envelope = np.max(np.abs(audio), axis=0)
        else:
            envelope = np.abs(audio)

        gain = np.ones_like(envelope)

        for i in range(1, len(envelope)):
            if envelope[i] > threshold_linear:
                gain[i] = threshold_linear / envelope[i]
            else:
                if gain[i - 1] < 1.0:
                    gain[i] = min(
                        1.0, gain[i - 1] + (1.0 - gain[i - 1]) / release_samples
                    )

        if audio.ndim == 2:
            gain = np.tile(gain, (2, 1))

        limited = audio * gain

        peak_before = 20 * np.log10(np.max(np.abs(audio)))
        peak_after = 20 * np.log10(np.max(np.abs(limited)))

        metrics = {
            "threshold_db": threshold_db,
            "peak_before_db": float(peak_before),
            "peak_after_db": float(peak_after),
            "limiting_applied": peak_before > threshold_db,
        }

        logger.info(f"  Peak: {peak_before:.1f}dB -> {peak_after:.1f}dB")

        return limited, metrics

    def process_audio(self, audio: np.ndarray) -> Tuple[np.ndarray, Dict]:
        self.stages = []
        all_metrics = {}

        audio, norm_metrics = self.normalizer.normalize(audio)
        self.stages.append("normalizer")
        all_metrics["normalizer"] = norm_metrics

        audio, comp_metrics = self.compressor.compress(audio)
        self.stages.append("compressor")
        all_metrics["compression"] = comp_metrics

        audio, stereo_metrics = self.stereo_enhancer.enhance(audio)
        self.stages.append("stereo_enhancer")
        all_metrics["stereo"] = stereo_metrics

        audio, limiter_metrics = self._final_limit(audio)
        self.stages.append("limiter")
        all_metrics["limiter"] = limiter_metrics

        return audio, all_metrics


def master_audio(
    input_path: Path, output_path: Optional[Path] = None
) -> ProcessingResult:
    chain = MasteringChain()
    return chain.master(input_path, output_path)
