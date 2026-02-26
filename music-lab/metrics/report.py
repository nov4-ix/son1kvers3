"""
Metrics Report Generator
Comprehensive report generation for music generation experiments
"""

import json
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import numpy as np

from config import MetricsReport, SongParams, GenerationResult, PATHS
from metrics.loudness import LoudnessAnalyzer
from metrics.spectral import SpectralAnalyzer
from utils.audio_io import load_audio, get_audio_duration
from utils.logging import setup_logger, save_experiment_log

logger = setup_logger("MetricsReport")


class ReportGenerator:
    def __init__(self, sample_rate: int = None):
        self.sample_rate = sample_rate or 44100
        self.loudness_analyzer = LoudnessAnalyzer(sample_rate)
        self.spectral_analyzer = SpectralAnalyzer(sample_rate)

    def generate_report(
        self,
        song_params: SongParams,
        generation_result: GenerationResult,
        audio_path: Path,
        processing_metrics: Optional[Dict] = None,
        output_path: Optional[Path] = None,
    ) -> MetricsReport:
        logger.info(f"Generating metrics report for: {audio_path}")

        generation_id = (
            f"{song_params.title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        )

        audio, sr = load_audio(audio_path, self.sample_rate)
        actual_duration = get_audio_duration(audio, sr)

        loudness_metrics = self.loudness_analyzer.analyze(audio)
        spectral_metrics = self.spectral_analyzer.analyze(audio)

        generation_metrics = {
            "total_time_seconds": generation_result.generation_time,
            "vram_used_mb": generation_result.vram_used_mb,
            "target_duration_seconds": song_params.duration_seconds,
            "actual_duration_seconds": actual_duration,
            "duration_accuracy": 1.0
            - abs(actual_duration - song_params.duration_seconds)
            / song_params.duration_seconds,
            "sections_generated": len(generation_result.sections),
            "section_details": [
                {"name": s.name, "duration": s.duration, "energy": s.energy}
                for s in generation_result.sections
            ],
        }

        audio_metrics = {
            "loudness": loudness_metrics,
            "spectral": spectral_metrics,
            "file_info": {
                "sample_rate": sr,
                "channels": 2 if audio.ndim == 2 else 1,
                "duration_seconds": actual_duration,
                "file_path": str(audio_path),
            },
        }

        performance_metrics = {
            "generation_time_per_second": generation_result.generation_time
            / max(actual_duration, 1),
            "timestamp": datetime.now().isoformat(),
        }

        if processing_metrics:
            performance_metrics["processing"] = processing_metrics

        if generation_result.metadata.get("section_times"):
            section_times = generation_result.metadata["section_times"]
            performance_metrics["average_section_time"] = np.mean(
                [s["time"] for s in section_times]
            )
            performance_metrics["slowest_section"] = max(
                section_times, key=lambda x: x["time"]
            )

        report = MetricsReport(
            generation_id=generation_id,
            song_params={
                "genre": song_params.genre,
                "mood": song_params.mood,
                "language": song_params.language,
                "duration_target": song_params.duration_seconds,
                "bpm": song_params.bpm,
                "title": song_params.title,
                "structure": song_params.structure,
            },
            generation_metrics=generation_metrics,
            audio_metrics=audio_metrics,
            performance_metrics=performance_metrics,
            timestamp=datetime.now().isoformat(),
        )

        if output_path is None:
            output_path = PATHS["reports_output"] / f"{generation_id}_report.json"

        self._save_report(report, output_path)

        logger.info(f"Report saved to: {output_path}")

        return report

    def _save_report(self, report: MetricsReport, output_path: Path):
        report_dict = {
            "generation_id": report.generation_id,
            "timestamp": report.timestamp,
            "song_params": report.song_params,
            "generation_metrics": report.generation_metrics,
            "audio_metrics": report.audio_metrics,
            "performance_metrics": report.performance_metrics,
        }

        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(report_dict, f, indent=2, default=str)

    def print_summary(self, report: MetricsReport):
        print("\n" + "=" * 60)
        print("  MUSIC LAB - GENERATION REPORT")
        print("=" * 60)

        print(f"\n📋 Generation ID: {report.generation_id}")
        print(f"   Timestamp: {report.timestamp}")

        print(f"\n🎵 Song Parameters:")
        params = report.song_params
        print(f"   Genre: {params.get('genre', 'N/A')}")
        print(f"   Mood: {params.get('mood', 'N/A')}")
        print(f"   Language: {params.get('language', 'N/A')}")
        print(f"   BPM: {params.get('bpm', 'N/A')}")
        print(f"   Target Duration: {params.get('duration_target', 'N/A')}s")

        print(f"\n⏱️ Generation Metrics:")
        gen = report.generation_metrics
        print(f"   Total Time: {gen.get('total_time_seconds', 0):.2f}s")
        print(f"   VRAM Used: {gen.get('vram_used_mb', 0):.1f} MB")
        print(f"   Actual Duration: {gen.get('actual_duration_seconds', 0):.2f}s")
        print(f"   Duration Accuracy: {gen.get('duration_accuracy', 0) * 100:.1f}%")
        print(f"   Sections: {gen.get('sections_generated', 0)}")

        print(f"\n🔊 Loudness Metrics:")
        loudness = report.audio_metrics.get("loudness", {})
        print(f"   Integrated LUFS: {loudness.get('integrated_lufs', 0):.1f} LUFS")
        print(f"   RMS: {loudness.get('rms_db', 0):.1f} dB")
        print(f"   Peak: {loudness.get('peak_db', 0):.1f} dB")
        print(f"   Crest Factor: {loudness.get('crest_factor_db', 0):.1f} dB")
        print(f"   Loudness Range: {loudness.get('lufs_range', 0):.1f} dB")

        print(f"\n📊 Spectral Metrics:")
        spectral = report.audio_metrics.get("spectral", {})
        print(f"   Centroid: {spectral.get('spectral_centroid_hz', 0):.0f} Hz")
        print(f"   Bandwidth: {spectral.get('spectral_bandwidth_hz', 0):.0f} Hz")
        print(f"   Rolloff (85%): {spectral.get('spectral_rolloff_hz', 0):.0f} Hz")
        print(f"   Flatness: {spectral.get('spectral_flatness', 0):.3f}")
        print(f"   Dynamic Range: {spectral.get('dynamic_range_db', 0):.1f} dB")

        print(f"\n📈 Performance:")
        perf = report.performance_metrics
        print(f"   Time per second: {perf.get('generation_time_per_second', 0):.2f}s")
        if perf.get("average_section_time"):
            print(f"   Avg section time: {perf['average_section_time']:.2f}s")

        print("\n" + "=" * 60)


def generate_report(
    song_params: SongParams,
    generation_result: GenerationResult,
    audio_path: Path,
    output_path: Optional[Path] = None,
) -> MetricsReport:
    generator = ReportGenerator()
    return generator.generate_report(
        song_params, generation_result, audio_path, output_path=output_path
    )
