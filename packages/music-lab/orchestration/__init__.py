"""
Orchestration Module
Intelligent model selection and coordination for hybrid music generation

This module provides:
- Model capability analysis
- Section-to-model assignment
- Resource estimation
- Generation pipeline orchestration
"""

from .engine import (
    OrchestrationEngine,
    OrchestrationPlan,
    SectionRequirements,
    ModelCapabilities,
    GenerationType,
    MODEL_CAPABILITIES,
    create_default_sections,
)

__all__ = [
    "OrchestrationEngine",
    "OrchestrationPlan",
    "SectionRequirements",
    "ModelCapabilities",
    "GenerationType",
    "MODEL_CAPABILITIES",
    "create_default_sections",
]
