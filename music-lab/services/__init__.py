"""
Services package for MusicLab
"""

from .voice_cloning_service import (
    VoiceCloningService,
    VoiceEngine,
    VoiceTier,
    VoiceSample,
    ClonedVoice,
    FineTuneJob,
    voice_service,
)

from .music_analyzer_service import (
    MusicAnalyzerService,
    MusicAnalysis,
    Genre,
    MusicSection,
    StemInfo,
    VocalInfo,
    analyzer_service,
)

from .remix_service import (
    RemixService,
    RemixMode,
    TierLevel,
    RemixRequest,
    RemixJob,
    remix_service,
)

__all__ = [
    # Voice Cloning
    "VoiceCloningService",
    "VoiceEngine",
    "VoiceTier",
    "VoiceSample",
    "ClonedVoice",
    "FineTuneJob",
    "voice_service",
    # Analyzer
    "MusicAnalyzerService",
    "MusicAnalysis",
    "Genre",
    "MusicSection",
    "StemInfo",
    "VocalInfo",
    "analyzer_service",
    # Remix
    "RemixService",
    "RemixMode",
    "TierLevel",
    "RemixRequest",
    "RemixJob",
    "remix_service",
]
