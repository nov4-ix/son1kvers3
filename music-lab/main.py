#!/usr/bin/env python3
"""
Music Lab - Main Entry Point
Production-ready Music Generation Research Lab for HeartMuLa evaluation

Usage:
    python main.py --genre "latin pop" --mood "romantic" --language "spanish" --duration 180
"""

import argparse
import sys
import time
from pathlib import Path
from typing import Optional

from config import (
    SongParams,
    ensure_directories,
    PATHS,
    HEARTMULA_MODEL_NAME,
)
from generators.section_composer import SectionComposer
from generators.heartmula_generator import HeartMuLaGenerator
from post_processing.mastering_chain import MasteringChain
from metrics.report import ReportGenerator
from utils.logging import setup_logger, PerformanceTracker

logger = setup_logger("MusicLab")


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Music Lab - HeartMuLa Music Generation Research Lab",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python main.py --genre "latin pop" --mood "romantic" --language "spanish" --duration 180
    python main.py --genre "electronic" --mood "energetic" --language "english" --duration 120 --bpm 128
    python main.py --genre "jazz" --mood "calm" --language "instrumental" --duration 240 --lyrics "..."
        """,
    )

    parser.add_argument(
        "--genre",
        "-g",
        type=str,
        required=True,
        help="Music genre (e.g., 'latin pop', 'electronic', 'rock', 'jazz')",
    )

    parser.add_argument(
        "--mood",
        "-m",
        type=str,
        required=True,
        help="Mood/emotion (e.g., 'romantic', 'energetic', 'calm', 'dark')",
    )

    parser.add_argument(
        "--language",
        "-l",
        type=str,
        required=True,
        help="Language for lyrics (e.g., 'spanish', 'english', 'instrumental')",
    )

    parser.add_argument(
        "--duration",
        "-d",
        type=int,
        required=True,
        help="Target duration in seconds (e.g., 180 for 3 minutes)",
    )

    parser.add_argument(
        "--bpm",
        "-b",
        type=int,
        default=None,
        help="Beats per minute (auto-estimated from genre if not specified)",
    )

    parser.add_argument(
        "--lyrics", type=str, default=None, help="Optional lyrics text for the song"
    )

    parser.add_argument(
        "--title",
        "-t",
        type=str,
        default=None,
        help="Song title (auto-generated if not specified)",
    )

    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default=None,
        help="Output directory for generated files",
    )

    parser.add_argument(
        "--skip-mastering",
        action="store_true",
        help="Skip the mastering chain (output raw generation only)",
    )

    parser.add_argument(
        "--skip-report", action="store_true", help="Skip generating the metrics report"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show section plan without generating audio",
    )

    parser.add_argument(
        "--model",
        type=str,
        default=HEARTMULA_MODEL_NAME,
        help=f"HeartMuLa model name (default: {HEARTMULA_MODEL_NAME})",
    )

    return parser.parse_args()


def print_banner():
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║   ♪ ♫ ♬  MUSIC LAB - HeartMuLa Research Lab  ♬ ♫ ♪          ║
    ║                                                               ║
    ║   Production-ready Music Generation & Analysis System        ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    print(banner)


def print_section_plan(sections):
    print("\n📋 Section Plan:")
    print("-" * 50)
    print(f"{'Section':<15} {'Duration':<12} {'Start':<12} {'Energy':<10}")
    print("-" * 50)
    for s in sections:
        print(
            f"{s.name.upper():<15} {s.duration:.1f}s{'':<6} {s.start_time:.1f}s{'':<6} {s.energy:.2f}"
        )
    print("-" * 50)
    total = sum(s.duration for s in sections)
    print(f"{'TOTAL':<15} {total:.1f}s")
    print()


def main():
    print_banner()

    args = parse_arguments()

    logger.info("Initializing Music Lab...")
    ensure_directories()

    if args.output:
        output_dir = Path(args.output)
        output_dir.mkdir(parents=True, exist_ok=True)
        for subdir in ["raw", "processed", "reports"]:
            (output_dir / subdir).mkdir(parents=True, exist_ok=True)

    song_params = SongParams(
        genre=args.genre,
        mood=args.mood,
        language=args.language,
        duration_seconds=args.duration,
        lyrics=args.lyrics,
        bpm=args.bpm,
        title=args.title,
    )

    logger.info(f"Song Parameters:")
    logger.info(f"  Genre: {song_params.genre}")
    logger.info(f"  Mood: {song_params.mood}")
    logger.info(f"  Language: {song_params.language}")
    logger.info(f"  Duration: {song_params.duration_seconds}s")
    logger.info(f"  BPM: {song_params.bpm}")
    if song_params.lyrics:
        logger.info(f"  Lyrics: {len(song_params.lyrics)} chars")

    composer = SectionComposer(song_params)
    sections = composer.compose()

    print_section_plan(sections)

    if args.dry_run:
        logger.info("Dry run complete. Exiting.")
        return 0

    with PerformanceTracker("Full Generation Pipeline") as pipeline:
        logger.info("\n" + "=" * 60)
        logger.info("PHASE 1: MUSIC GENERATION")
        logger.info("=" * 60)

        generator = HeartMuLaGenerator(model_name=args.model)

        if not generator.load_model():
            logger.error("Failed to load HeartMuLa model. Exiting.")
            return 1

        generation_result = generator.generate(song_params, sections)
        pipeline.checkpoint("generation")

        raw_audio_path = Path(generation_result.audio_path)

        processed_audio_path = raw_audio_path
        processing_result = None

        if not args.skip_mastering:
            logger.info("\n" + "=" * 60)
            logger.info("PHASE 2: MASTERING CHAIN")
            logger.info("=" * 60)

            mastering_chain = MasteringChain()
            processing_result = mastering_chain.master(raw_audio_path)
            processed_audio_path = Path(processing_result.output_path)
            pipeline.checkpoint("mastering")

        if not args.skip_report:
            logger.info("\n" + "=" * 60)
            logger.info("PHASE 3: METRICS ANALYSIS")
            logger.info("=" * 60)

            report_generator = ReportGenerator()
            report = report_generator.generate_report(
                song_params=song_params,
                generation_result=generation_result,
                audio_path=processed_audio_path,
                processing_metrics=processing_result.__dict__
                if processing_result
                else None,
            )

            report_generator.print_summary(report)
            pipeline.checkpoint("reporting")

        print("\n" + "=" * 60)
        print("  GENERATION COMPLETE")
        print("=" * 60)
        print(f"\n📁 Output Files:")
        print(f"   Raw Audio: {raw_audio_path}")
        if not args.skip_mastering:
            print(f"   Mastered: {processed_audio_path}")
        if not args.skip_report:
            print(
                f"   Report: {PATHS['reports_output']}/{report.generation_id}_report.json"
            )

        print(f"\n⏱️ Performance Summary:")
        print(f"   Generation Time: {generation_result.generation_time:.2f}s")
        if generation_result.vram_used_mb > 0:
            print(f"   VRAM Used: {generation_result.vram_used_mb:.1f} MB")
        if processing_result:
            print(f"   Mastering Time: {processing_result.processing_time:.2f}s")

        print(f"\n🎵 Audio:")
        print(f"   Duration: {generation_result.duration:.2f}s")
        print(f"   Target: {song_params.duration_seconds}s")
        print(
            f"   Accuracy: {(1 - abs(generation_result.duration - song_params.duration_seconds) / song_params.duration_seconds) * 100:.1f}%"
        )

        print("\n" + "=" * 60)
        print("  Thank you for using Music Lab!")
        print("=" * 60 + "\n")

        return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\nGeneration interrupted by user.")
        sys.exit(130)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
