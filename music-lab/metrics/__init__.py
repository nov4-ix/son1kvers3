"""
Music Lab Metrics Package
Comprehensive audio analysis and quality assessment tools.

Modules:
- loudness: LUFS, RMS, peak analysis
- spectral: Spectral characteristics analysis
- report: JSON report generation
- quality_metrics: Comprehensive quality assessment
"""

from .loudness import LoudnessAnalyzer, analyze_loudness
from .spectral import SpectralAnalyzer, analyze_spectral
from .report import ReportGenerator, generate_report
from .quality_metrics import (
    QualityMetrics,
    QualityReport,
    QualityScore,
    QualityDimension,
    QUALITY_WEIGHTS,
)

__all__ = [
    "LoudnessAnalyzer",
    "SpectralAnalyzer",
    "ReportGenerator",
    "analyze_loudness",
    "analyze_spectral",
    "generate_report",
    "QualityMetrics",
    "QualityReport",
    "QualityScore",
    "QualityDimension",
    "QUALITY_WEIGHTS",
]
