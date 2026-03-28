"""
Performance Benchmark Suite for Music Lab
Benchmarks for all HAM components
"""

import time
import json
import numpy as np
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@dataclass
class BenchmarkResult:
    """Result of a single benchmark."""

    name: str
    duration_seconds: float
    audio_duration: float
    real_time_factor: float
    memory_mb: float
    success: bool
    error: str = ""


class BenchmarkSuite:
    """
    Comprehensive benchmark suite for music-lab components.

    Measures:
    - Execution time
    - Real-time factor (processing time / audio duration)
    - Memory usage
    """

    def __init__(self, sr: int = 44100):
        self.sr = sr
        self.results: List[BenchmarkResult] = []

    def generate_test_audio(
        self, duration: float, freq: float = 440.0, with_harmonics: bool = True
    ) -> np.ndarray:
        """Generate test audio for benchmarking."""
        t = np.linspace(0, duration, int(self.sr * duration))
        audio = 0.5 * np.sin(2 * np.pi * freq * t)

        if with_harmonics:
            for i in range(2, 6):
                audio += 0.5 / i * np.sin(2 * np.pi * freq * i * t)

        return (audio / np.max(np.abs(audio)) * 0.5).astype(np.float32)

    def generate_rhythmic_audio(
        self, duration: float, bpm: float = 120.0
    ) -> np.ndarray:
        """Generate rhythmic test audio for BPM detection."""
        samples = int(self.sr * duration)
        audio = np.zeros(samples, dtype=np.float32)

        beat_interval = int(60.0 / bpm * self.sr)
        beat_duration = int(0.1 * self.sr)

        for i in range(0, samples - beat_duration, beat_interval):
            t = np.linspace(0, 0.1, beat_duration)
            beat = 0.8 * np.sin(2 * np.pi * 100 * t) * np.exp(-t * 20)
            audio[i : i + beat_duration] = beat

        return audio

    def run_benchmark(
        self,
        name: str,
        func,
        audio: np.ndarray,
        warmup: int = 1,
        runs: int = 3,
    ) -> BenchmarkResult:
        """Run a single benchmark with timing and memory tracking."""
        import tracemalloc

        audio_duration = len(audio) / self.sr

        for _ in range(warmup):
            try:
                func(audio, self.sr)
            except Exception:
                pass

        tracemalloc.start()
        start_time = time.perf_counter()

        try:
            for _ in range(runs):
                func(audio, self.sr)

            end_time = time.perf_counter()
            current, peak = tracemalloc.get_traced_memory()
            tracemalloc.stop()

            total_duration = (end_time - start_time) / runs
            rtf = total_duration / audio_duration

            result = BenchmarkResult(
                name=name,
                duration_seconds=total_duration,
                audio_duration=audio_duration,
                real_time_factor=rtf,
                memory_mb=peak / (1024 * 1024),
                success=True,
            )

        except Exception as e:
            tracemalloc.stop()
            result = BenchmarkResult(
                name=name,
                duration_seconds=0,
                audio_duration=audio_duration,
                real_time_factor=0,
                memory_mb=0,
                success=False,
                error=str(e),
            )

        self.results.append(result)
        return result

    def benchmark_key_detection_v1(self, duration: float) -> BenchmarkResult:
        """Benchmark basic key detection."""
        from alignment.key_detection import detect_key

        audio = self.generate_test_audio(duration, freq=440.0, with_harmonics=True)

        return self.run_benchmark(
            f"key_detection_v1_{int(duration)}s",
            lambda a, sr: detect_key(a, sr),
            audio,
        )

    def benchmark_key_detection_v2(self, duration: float) -> BenchmarkResult:
        """Benchmark robust key detection."""
        from alignment.key_detection_v2 import RobustKeyDetector

        audio = self.generate_test_audio(duration, freq=440.0, with_harmonics=True)
        detector = RobustKeyDetector(sr=self.sr)

        return self.run_benchmark(
            f"key_detection_v2_{int(duration)}s",
            lambda a, sr: detector.detect_key(a, sr),
            audio,
        )

    def benchmark_bpm_detection_v1(self, duration: float) -> BenchmarkResult:
        """Benchmark basic BPM detection."""
        from alignment.bpm_detection import detect_bpm

        audio = self.generate_rhythmic_audio(duration, bpm=120.0)

        return self.run_benchmark(
            f"bpm_detection_v1_{int(duration)}s",
            lambda a, sr: detect_bpm(a, sr),
            audio,
        )

    def benchmark_bpm_detection_v2(self, duration: float) -> BenchmarkResult:
        """Benchmark robust BPM detection."""
        from alignment.bpm_detection_v2 import RobustBPMDetector

        audio = self.generate_rhythmic_audio(duration, bpm=120.0)
        detector = RobustBPMDetector(sr=self.sr)

        return self.run_benchmark(
            f"bpm_detection_v2_{int(duration)}s",
            lambda a, sr: detector.detect_bpm(a, sr),
            audio,
        )

    def benchmark_chord_detection(self, duration: float) -> BenchmarkResult:
        """Benchmark chord detection."""
        from alignment.chord_detection import ChordDetector

        audio = self.generate_test_audio(duration, freq=261.63, with_harmonics=True)
        detector = ChordDetector(sr=self.sr)

        return self.run_benchmark(
            f"chord_detection_{int(duration)}s",
            lambda a, sr: detector.detect_progression(a, sr),
            audio,
        )

    def benchmark_stitcher_v1(self) -> BenchmarkResult:
        """Benchmark basic crossfading."""
        from alignment.stitcher import crossfade

        audio_a = self.generate_test_audio(5.0, freq=440.0)
        audio_b = self.generate_test_audio(5.0, freq=523.25)

        start_time = time.perf_counter()
        result = crossfade(audio_a, audio_b, duration=1.0, sr=self.sr)
        duration_seconds = time.perf_counter() - start_time

        return BenchmarkResult(
            name="stitcher_v1_crossfade",
            duration_seconds=duration_seconds,
            audio_duration=10.0,
            real_time_factor=duration_seconds / 10.0,
            memory_mb=0,
            success=True,
        )

    def benchmark_stitcher_v2(self) -> BenchmarkResult:
        """Benchmark advanced crossfading."""
        from alignment.stitcher_v2 import AdvancedStitcher

        audio_a = self.generate_test_audio(5.0, freq=440.0)
        audio_b = self.generate_test_audio(5.0, freq=523.25)
        stitcher = AdvancedStitcher(sr=self.sr)

        start_time = time.perf_counter()
        result = stitcher.crossfade_smart(audio_a, audio_b, bpm=120.0)
        duration_seconds = time.perf_counter() - start_time

        return BenchmarkResult(
            name="stitcher_v2_crossfade",
            duration_seconds=duration_seconds,
            audio_duration=10.0,
            real_time_factor=duration_seconds / 10.0,
            memory_mb=0,
            success=True,
        )

    def benchmark_quality_metrics(self, duration: float) -> BenchmarkResult:
        """Benchmark quality metrics assessment."""
        from metrics.quality_metrics import QualityMetrics

        audio = self.generate_test_audio(duration, freq=440.0, with_harmonics=True)
        metrics = QualityMetrics(sr=self.sr)

        return self.run_benchmark(
            f"quality_metrics_{int(duration)}s",
            lambda a, sr: metrics.assess(a),
            audio,
        )

    def run_all_benchmarks(
        self, durations: List[float] = [5.0, 10.0, 30.0]
    ) -> Dict[str, Any]:
        """Run all benchmarks and return summary."""
        print("=" * 60)
        print("MUSIC-LAB BENCHMARK SUITE")
        print("=" * 60)

        for duration in durations:
            print(f"\n--- {int(duration)}s Audio Duration ---")

            print(f"  Running key_detection_v1...")
            self.benchmark_key_detection_v1(duration)

            print(f"  Running key_detection_v2...")
            self.benchmark_key_detection_v2(duration)

            print(f"  Running bpm_detection_v1...")
            self.benchmark_bpm_detection_v1(duration)

            print(f"  Running bpm_detection_v2...")
            self.benchmark_bpm_detection_v2(duration)

            print(f"  Running chord_detection...")
            self.benchmark_chord_detection(duration)

            print(f"  Running quality_metrics...")
            self.benchmark_quality_metrics(duration)

        print(f"\n--- Crossfade Benchmarks ---")
        print(f"  Running stitcher_v1...")
        self.benchmark_stitcher_v1()

        print(f"  Running stitcher_v2...")
        self.benchmark_stitcher_v2()

        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Get benchmark summary."""
        successful = [r for r in self.results if r.success]
        failed = [r for r in self.results if not r.success]

        summary = {
            "total_benchmarks": len(self.results),
            "successful": len(successful),
            "failed": len(failed),
            "results": [asdict(r) for r in self.results],
            "performance_summary": {},
        }

        for result in successful:
            name = result["name"] if isinstance(result, dict) else result.name
            rtf = (
                result["real_time_factor"]
                if isinstance(result, dict)
                else result.real_time_factor
            )

            if rtf < 0.1:
                status = "EXCELLENT"
            elif rtf < 0.5:
                status = "GOOD"
            elif rtf < 1.0:
                status = "ACCEPTABLE"
            else:
                status = "SLOW"

            key = name.split("_")[0] if "_" in name else name
            if key not in summary["performance_summary"]:
                summary["performance_summary"][key] = status

        return summary

    def print_results(self):
        """Print formatted benchmark results."""
        print("\n" + "=" * 60)
        print("BENCHMARK RESULTS")
        print("=" * 60)
        print(f"{'Benchmark':<30} {'Time (s)':<12} {'RTF':<10} {'Status':<10}")
        print("-" * 60)

        for result in self.results:
            if result.success:
                if result.real_time_factor < 0.1:
                    status = "EXCELLENT"
                elif result.real_time_factor < 0.5:
                    status = "GOOD"
                elif result.real_time_factor < 1.0:
                    status = "ACCEPTABLE"
                else:
                    status = "SLOW"

                print(
                    f"{result.name:<30} {result.duration_seconds:<12.4f} "
                    f"{result.real_time_factor:<10.2f} {status:<10}"
                )
            else:
                print(f"{result.name:<30} {'FAILED':<12} {'-':<10} {'ERROR':<10}")

        print("=" * 60)

    def save_results(self, filepath: str):
        """Save results to JSON file."""
        summary = self.get_summary()
        with open(filepath, "w") as f:
            json.dump(summary, f, indent=2)
        print(f"Results saved to {filepath}")


def main():
    """Run the benchmark suite."""
    suite = BenchmarkSuite(sr=44100)

    suite.run_all_benchmarks(durations=[5.0, 10.0, 30.0])
    suite.print_results()

    output_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "outputs",
        "reports",
        "benchmark_results.json",
    )
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    suite.save_results(output_path)


if __name__ == "__main__":
    main()
