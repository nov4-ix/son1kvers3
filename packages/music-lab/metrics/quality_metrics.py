"""
Quality Metrics Module
Comprehensive audio quality assessment for AI-generated music

Provides:
- Perceptual quality metrics
- Production readiness scoring
- Spectral analysis
- Dynamic range assessment
- Comparative quality scoring
"""

import numpy as np
import librosa
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class QualityDimension(Enum):
    """Dimensions of audio quality."""

    SPECTRAL_BALANCE = "spectral_balance"
    DYNAMIC_RANGE = "dynamic_range"
    LOUDNESS_COMPLIANCE = "loudness_compliance"
    STEREO_IMAGE = "stereo_image"
    HARMONIC_COHERENCE = "harmonic_coherence"
    TEMPORAL_CONSISTENCY = "temporal_consistency"
    ARTIFACT_PRESENCE = "artifact_presence"
    OVERALL_QUALITY = "overall_quality"


@dataclass
class QualityScore:
    """Score for a single quality dimension."""

    dimension: QualityDimension
    score: float  # 0-100
    weight: float
    details: Dict[str, float]


@dataclass
class QualityReport:
    """Complete quality assessment report."""

    overall_score: float  # 0-100
    dimension_scores: List[QualityScore]
    production_ready: bool
    issues: List[str]
    recommendations: List[str]
    comparison_to_reference: Optional[float]


QUALITY_WEIGHTS = {
    QualityDimension.SPECTRAL_BALANCE: 0.15,
    QualityDimension.DYNAMIC_RANGE: 0.15,
    QualityDimension.LOUDNESS_COMPLIANCE: 0.20,
    QualityDimension.STEREO_IMAGE: 0.10,
    QualityDimension.HARMONIC_COHERENCE: 0.15,
    QualityDimension.TEMPORAL_CONSISTENCY: 0.10,
    QualityDimension.ARTIFACT_PRESENCE: 0.15,
}


class QualityMetrics:
    """
    Comprehensive audio quality assessment system.

    Evaluates multiple dimensions of audio quality and provides
    actionable recommendations for improvement.

    Example:
        >>> metrics = QualityMetrics(sr=44100)
        >>> report = metrics.assess(audio, reference_audio=reference)
        >>> print(f"Quality score: {report.overall_score:.1f}/100")
        >>> print(f"Production ready: {report.production_ready}")
    """

    def __init__(
        self,
        sr: int = 44100,
        target_lufs: float = -14.0,
        production_threshold: float = 70.0,
    ):
        """
        Initialize quality metrics.

        Args:
            sr: Sample rate
            target_lufs: Target loudness in LUFS
            production_threshold: Minimum score for production readiness
        """
        self.sr = sr
        self.target_lufs = target_lufs
        self.production_threshold = production_threshold

    def assess(
        self, audio: np.ndarray, reference_audio: Optional[np.ndarray] = None
    ) -> QualityReport:
        """
        Perform comprehensive quality assessment.

        Args:
            audio: Audio to assess
            reference_audio: Optional reference for comparison

        Returns:
            QualityReport with detailed scores
        """
        if audio.ndim == 2:
            mono = np.mean(audio, axis=0)
        else:
            mono = audio

        scores = []
        issues = []

        spectral = self._assess_spectral_balance(audio, mono)
        scores.append(spectral)
        if spectral.score < 60:
            issues.append(f"Spectral imbalance detected (score: {spectral.score:.1f})")

        dynamic = self._assess_dynamic_range(audio, mono)
        scores.append(dynamic)
        if dynamic.score < 60:
            issues.append(f"Limited dynamic range (score: {dynamic.score:.1f})")

        loudness = self._assess_loudness_compliance(audio, mono)
        scores.append(loudness)
        if loudness.score < 70:
            issues.append(
                f"Loudness outside broadcast standards (score: {loudness.score:.1f})"
            )

        stereo = self._assess_stereo_image(audio)
        scores.append(stereo)

        harmonic = self._assess_harmonic_coherence(audio, mono)
        scores.append(harmonic)
        if harmonic.score < 60:
            issues.append(f"Harmonic inconsistencies (score: {harmonic.score:.1f})")

        temporal = self._assess_temporal_consistency(audio, mono)
        scores.append(temporal)
        if temporal.score < 60:
            issues.append(f"Temporal inconsistencies (score: {temporal.score:.1f})")

        artifacts = self._assess_artifacts(audio, mono)
        scores.append(artifacts)
        if artifacts.score < 70:
            issues.append(f"Audio artifacts detected (score: {artifacts.score:.1f})")

        overall = self._calculate_overall(scores)
        scores.append(overall)

        comparison = None
        if reference_audio is not None:
            comparison = self._compare_to_reference(audio, reference_audio)

        overall_score = overall.score
        production_ready = overall_score >= self.production_threshold

        recommendations = self._generate_recommendations(scores, issues)

        return QualityReport(
            overall_score=overall_score,
            dimension_scores=scores,
            production_ready=production_ready,
            issues=issues,
            recommendations=recommendations,
            comparison_to_reference=comparison,
        )

    def _assess_spectral_balance(
        self, audio: np.ndarray, mono: np.ndarray
    ) -> QualityScore:
        """Assess spectral balance across frequency bands."""
        centroid = librosa.feature.spectral_centroid(y=mono, sr=self.sr)
        mean_centroid = np.mean(centroid)

        bandwidth = librosa.feature.spectral_bandwidth(y=mono, sr=self.sr)
        mean_bandwidth = np.mean(bandwidth)

        rolloff = librosa.feature.spectral_rolloff(y=mono, sr=self.sr)
        mean_rolloff = np.mean(rolloff)

        target_centroid = 2000  # Hz
        centroid_score = 100 - min(100, abs(mean_centroid - target_centroid) / 50)

        target_bandwidth = 1500  # Hz
        bandwidth_score = 100 - min(100, abs(mean_bandwidth - target_bandwidth) / 30)

        balance_score = (centroid_score + bandwidth_score) / 2

        return QualityScore(
            dimension=QualityDimension.SPECTRAL_BALANCE,
            score=balance_score,
            weight=QUALITY_WEIGHTS[QualityDimension.SPECTRAL_BALANCE],
            details={
                "centroid_hz": float(mean_centroid),
                "bandwidth_hz": float(mean_bandwidth),
                "rolloff_hz": float(mean_rolloff),
            },
        )

    def _assess_dynamic_range(
        self, audio: np.ndarray, mono: np.ndarray
    ) -> QualityScore:
        """Assess dynamic range characteristics."""
        rms = librosa.feature.rms(y=mono)

        rms_std = np.std(rms)
        rms_mean = np.mean(rms)

        if rms_mean > 0:
            dynamic_range = 20 * np.log10(
                (rms_mean + rms_std) / (rms_mean - rms_std + 1e-8)
            )
        else:
            dynamic_range = 0

        peak = np.max(np.abs(mono))
        rms_avg = np.mean(rms)

        if rms_avg > 0:
            crest_factor = peak / rms_avg
            crest_db = 20 * np.log10(crest_factor + 1e-8)
        else:
            crest_db = 0

        target_dr = 8  # dB
        dr_score = 100 - min(100, abs(dynamic_range - target_dr) * 5)

        target_crest = 12  # dB
        crest_score = 100 - min(100, abs(crest_db - target_crest) * 3)

        score = (dr_score + crest_score) / 2

        return QualityScore(
            dimension=QualityDimension.DYNAMIC_RANGE,
            score=score,
            weight=QUALITY_WEIGHTS[QualityDimension.DYNAMIC_RANGE],
            details={
                "dynamic_range_db": float(dynamic_range),
                "crest_factor_db": float(crest_db),
                "peak_amplitude": float(peak),
            },
        )

    def _assess_loudness_compliance(
        self, audio: np.ndarray, mono: np.ndarray
    ) -> QualityScore:
        """Assess loudness compliance with broadcast standards."""
        try:
            import pyloudnorm

            meter = pyloudnorm.Meter(self.sr)
            lufs = meter.integrated_loudness(mono)
        except:
            lufs = -20  # fallback estimate

        lufs_diff = abs(lufs - self.target_lufs)

        if lufs_diff <= 0.5:
            score = 100
        elif lufs_diff <= 1:
            score = 95
        elif lufs_diff <= 2:
            score = 85
        elif lufs_diff <= 3:
            score = 70
        elif lufs_diff <= 5:
            score = 50
        else:
            score = max(0, 50 - (lufs_diff - 5) * 5)

        peak = np.max(np.abs(mono))
        true_peak_score = 100 if peak <= 0.99 else max(0, 100 - (peak - 0.99) * 1000)

        final_score = score * 0.8 + true_peak_score * 0.2

        return QualityScore(
            dimension=QualityDimension.LOUDNESS_COMPLIANCE,
            score=final_score,
            weight=QUALITY_WEIGHTS[QualityDimension.LOUDNESS_COMPLIANCE],
            details={
                "lufs": float(lufs),
                "target_lufs": self.target_lufs,
                "lufs_difference": float(lufs_diff),
                "true_peak": float(peak),
            },
        )

    def _assess_stereo_image(self, audio: np.ndarray) -> QualityScore:
        """Assess stereo image quality."""
        if audio.ndim != 2 or audio.shape[0] != 2:
            return QualityScore(
                dimension=QualityDimension.STEREO_IMAGE,
                score=50,  # Neutral score for mono
                weight=QUALITY_WEIGHTS[QualityDimension.STEREO_IMAGE],
                details={"stereo": False},
            )

        left = audio[0]
        right = audio[1]

        correlation = np.corrcoef(left, right)[0, 1]

        mid = (left + right) / 2
        side = (left - right) / 2

        mid_energy = np.sum(mid**2)
        side_energy = np.sum(side**2)

        if mid_energy > 0:
            width_ratio = side_energy / mid_energy
        else:
            width_ratio = 0

        correlation_score = 100 - min(100, abs(correlation - 0.5) * 100)

        target_width = 0.3
        width_score = 100 - min(100, abs(width_ratio - target_width) * 200)

        score = (correlation_score + width_score) / 2

        return QualityScore(
            dimension=QualityDimension.STEREO_IMAGE,
            score=score,
            weight=QUALITY_WEIGHTS[QualityDimension.STEREO_IMAGE],
            details={
                "stereo": True,
                "channel_correlation": float(correlation),
                "width_ratio": float(width_ratio),
            },
        )

    def _assess_harmonic_coherence(
        self, audio: np.ndarray, mono: np.ndarray
    ) -> QualityScore:
        """Assess harmonic coherence."""
        chroma = librosa.feature.chroma_cqt(y=mono, sr=self.sr)

        chroma_std = np.std(chroma, axis=1)
        chroma_mean = np.mean(chroma_std)

        coherence_score = 100 - min(100, chroma_mean * 50)

        flatness = librosa.feature.spectral_flatness(y=mono)
        mean_flatness = np.mean(flatness)

        harmonic_score = 100 - min(100, mean_flatness * 100)

        score = (coherence_score + harmonic_score) / 2

        return QualityScore(
            dimension=QualityDimension.HARMONIC_COHERENCE,
            score=score,
            weight=QUALITY_WEIGHTS[QualityDimension.HARMONIC_COHERENCE],
            details={
                "chroma_variance": float(chroma_mean),
                "spectral_flatness": float(mean_flatness),
            },
        )

    def _assess_temporal_consistency(
        self, audio: np.ndarray, mono: np.ndarray
    ) -> QualityScore:
        """Assess temporal consistency."""
        rms = librosa.feature.rms(y=mono, hop_length=2048)

        rms_changes = np.abs(np.diff(rms.flatten()))
        mean_change = np.mean(rms_changes)

        consistency_score = 100 - min(100, mean_change * 500)

        onset_env = librosa.onset.onset_strength(y=mono, sr=self.sr)
        onset_std = np.std(onset_env)

        rhythm_score = min(100, onset_std * 200)

        score = (consistency_score + rhythm_score) / 2

        return QualityScore(
            dimension=QualityDimension.TEMPORAL_CONSISTENCY,
            score=score,
            weight=QUALITY_WEIGHTS[QualityDimension.TEMPORAL_CONSISTENCY],
            details={
                "rms_stability": float(mean_change),
                "rhythmic_strength": float(onset_std),
            },
        )

    def _assess_artifacts(self, audio: np.ndarray, mono: np.ndarray) -> QualityScore:
        """Detect potential audio artifacts."""
        clips = np.sum(np.abs(mono) > 0.99) / len(mono)
        clip_score = max(0, 100 - clips * 10000)

        S = np.abs(librosa.stft(mono))
        spectral_flatness = librosa.feature.spectral_flatness(S=S)

        noise_like_frames = np.sum(spectral_flatness > 0.5) / spectral_flatness.size
        noise_score = 100 - noise_like_frames * 50

        score = (clip_score + noise_score) / 2

        return QualityScore(
            dimension=QualityDimension.ARTIFACT_PRESENCE,
            score=score,
            weight=QUALITY_WEIGHTS[QualityDimension.ARTIFACT_PRESENCE],
            details={
                "clipping_ratio": float(clips),
                "noise_like_frames": float(noise_like_frames),
            },
        )

    def _calculate_overall(self, scores: List[QualityScore]) -> QualityScore:
        """Calculate weighted overall score."""
        weighted_sum = sum(s.score * s.weight for s in scores)
        total_weight = sum(s.weight for s in scores)

        overall = weighted_sum / total_weight if total_weight > 0 else 0

        return QualityScore(
            dimension=QualityDimension.OVERALL_QUALITY,
            score=overall,
            weight=1.0,
            details={
                "weighted_average": float(overall),
                "component_count": len(scores),
            },
        )

    def _compare_to_reference(self, audio: np.ndarray, reference: np.ndarray) -> float:
        """Compare audio to reference."""
        if audio.ndim == 2:
            audio_mono = np.mean(audio, axis=0)
        else:
            audio_mono = audio

        if reference.ndim == 2:
            ref_mono = np.mean(reference, axis=0)
        else:
            ref_mono = reference

        min_len = min(len(audio_mono), len(ref_mono))
        audio_mono = audio_mono[:min_len]
        ref_mono = ref_mono[:min_len]

        audio_mfcc = librosa.feature.mfcc(y=audio_mono, sr=self.sr, n_mfcc=13)
        ref_mfcc = librosa.feature.mfcc(y=ref_mono, sr=self.sr, n_mfcc=13)

        audio_mean = np.mean(audio_mfcc, axis=1)
        ref_mean = np.mean(ref_mfcc, axis=1)

        distance = np.linalg.norm(audio_mean - ref_mean)

        similarity = max(0, 100 - distance * 2)

        return float(similarity)

    def _generate_recommendations(
        self, scores: List[QualityScore], issues: List[str]
    ) -> List[str]:
        """Generate improvement recommendations."""
        recommendations = []

        for score in scores:
            if score.dimension == QualityDimension.OVERALL_QUALITY:
                continue

            if score.score < 60:
                if score.dimension == QualityDimension.LOUDNESS_COMPLIANCE:
                    recommendations.append("Apply LUFS normalization to -14 LUFS")
                elif score.dimension == QualityDimension.SPECTRAL_BALANCE:
                    recommendations.append(
                        "Apply gentle EQ to balance frequency spectrum"
                    )
                elif score.dimension == QualityDimension.DYNAMIC_RANGE:
                    recommendations.append(
                        "Apply gentle compression to improve dynamic consistency"
                    )
                elif score.dimension == QualityDimension.ARTIFACT_PRESENCE:
                    recommendations.append(
                        "Review source material for clipping or noise"
                    )
                elif score.dimension == QualityDimension.HARMONIC_COHERENCE:
                    recommendations.append(
                        "Review harmonic content for inconsistencies"
                    )

        return list(set(recommendations))


if __name__ == "__main__":
    print("Quality Metrics Module")
    print("=" * 50)

    sr = 44100
    duration = 10.0

    t = np.linspace(0, duration, int(sr * duration))

    good_audio = 0.3 * np.sin(2 * np.pi * 440 * t) + 0.2 * np.sin(2 * np.pi * 880 * t)
    good_audio = good_audio / np.max(np.abs(good_audio)) * 0.8

    poor_audio = np.random.randn(len(t)) * 0.3
    poor_audio[: int(sr * 0.1)] = 1.0

    metrics = QualityMetrics(sr=sr)

    print("\nAssessing 'Good' Audio:")
    print("-" * 40)
    good_report = metrics.assess(good_audio)
    print(f"  Overall score: {good_report.overall_score:.1f}/100")
    print(f"  Production ready: {good_report.production_ready}")
    print(f"  Issues: {len(good_report.issues)}")

    for score in good_report.dimension_scores:
        print(f"    {score.dimension.value}: {score.score:.1f}")

    print("\n\nAssessing 'Poor' Audio:")
    print("-" * 40)
    poor_report = metrics.assess(poor_audio)
    print(f"  Overall score: {poor_report.overall_score:.1f}/100")
    print(f"  Production ready: {poor_report.production_ready}")
    print(f"  Issues: {len(poor_report.issues)}")

    for issue in poor_report.issues:
        print(f"    - {issue}")

    if poor_report.recommendations:
        print("\n  Recommendations:")
        for rec in poor_report.recommendations:
            print(f"    - {rec}")

    print("\n" + "=" * 50)
    print("Quality metrics ready.")
