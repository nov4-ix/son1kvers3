"""
Cost Optimization Module
GPU resource management and cost estimation for music generation

Provides:
- Memory optimization strategies
- Batch processing recommendations
- Cost estimation per generation
- Resource scheduling
"""

import numpy as np
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class GPUType(Enum):
    """Common GPU types with their specifications."""

    RTX_3090 = "rtx_3090"
    RTX_4090 = "rtx_4090"
    A100_40GB = "a100_40"
    A100_80GB = "a100_80"
    V100 = "v100"
    T4 = "t4"


GPU_SPECS = {
    GPUType.RTX_3090: {"vram_gb": 24, "tflops": 35.6, "cost_per_hour": 0.80},
    GPUType.RTX_4090: {"vram_gb": 24, "tflops": 82.6, "cost_per_hour": 1.20},
    GPUType.A100_40GB: {"vram_gb": 40, "tflops": 312, "cost_per_hour": 2.50},
    GPUType.A100_80GB: {"vram_gb": 80, "tflops": 312, "cost_per_hour": 4.50},
    GPUType.V100: {"vram_gb": 16, "tflops": 125, "cost_per_hour": 1.50},
    GPUType.T4: {"vram_gb": 16, "tflops": 65, "cost_per_hour": 0.50},
}


@dataclass
class GenerationCost:
    """Cost breakdown for a single generation."""

    duration_seconds: float
    generation_time_seconds: float
    gpu_hours: float
    estimated_cost_usd: float
    memory_peak_gb: float
    efficiency_score: float


@dataclass
class OptimizationRecommendation:
    """Recommendations for cost optimization."""

    current_cost: float
    optimized_cost: float
    savings_percent: float
    recommendations: List[str]
    batch_size_recommendation: int
    memory_savings_percent: float


class CostOptimizer:
    """
    GPU cost optimization and resource management.

    Features:
    - Cost estimation per generation
    - Memory optimization strategies
    - Batch processing recommendations
    - Resource scheduling

    Example:
        >>> optimizer = CostOptimizer(gpu_type=GPUType.RTX_4090)
        >>> cost = optimizer.estimate_cost(duration=180, model='heartmula')
        >>> print(f"Estimated cost: ${cost.estimated_cost_usd:.4f}")
    """

    def __init__(
        self,
        gpu_type: GPUType = GPUType.RTX_4090,
        generation_speed_multiplier: float = 2.0,
    ):
        """
        Initialize cost optimizer.

        Args:
            gpu_type: Type of GPU being used
            generation_speed_multiplier: Generation time multiplier (2x = 2 seconds per 1s audio)
        """
        self.gpu_type = gpu_type
        self.gpu_specs = GPU_SPECS[gpu_type]
        self.speed_multiplier = generation_speed_multiplier

    def estimate_cost(
        self,
        duration: float,
        model: str = "heartmula",
        optimization_level: str = "balanced",
    ) -> GenerationCost:
        """
        Estimate cost for a generation.

        Args:
            duration: Target audio duration in seconds
            model: Model being used
            optimization_level: 'fast', 'balanced', 'quality'

        Returns:
            GenerationCost with detailed breakdown
        """
        speed_multipliers = {"fast": 1.5, "balanced": 2.0, "quality": 3.0}

        multiplier = speed_multipliers.get(optimization_level, 2.0)

        model_memory = {
            "musicgen": 4.0,
            "heartmula": 6.0,
            "audioldm2": 3.5,
        }

        generation_time = duration * multiplier

        gpu_hours = generation_time / 3600

        estimated_cost = gpu_hours * self.gpu_specs["cost_per_hour"]

        memory_peak = model_memory.get(model, 5.0)

        theoretical_min = duration / 3600 * self.gpu_specs["cost_per_hour"]
        efficiency = theoretical_min / (estimated_cost + 1e-8)
        efficiency = min(1.0, efficiency)

        return GenerationCost(
            duration_seconds=duration,
            generation_time_seconds=generation_time,
            gpu_hours=gpu_hours,
            estimated_cost_usd=estimated_cost,
            memory_peak_gb=memory_peak,
            efficiency_score=efficiency,
        )

    def estimate_batch_cost(
        self, durations: List[float], model: str = "heartmula"
    ) -> Dict[str, float]:
        """
        Estimate cost for batch generation.

        Args:
            durations: List of target durations
            model: Model being used

        Returns:
            Dictionary with batch cost breakdown
        """
        total_duration = sum(durations)
        total_generation_time = total_duration * self.speed_multiplier

        batch_overhead = 0.1 * len(durations)
        total_time = total_generation_time + batch_overhead

        total_cost = (total_time / 3600) * self.gpu_specs["cost_per_hour"]

        individual_costs = sum(
            self.estimate_cost(d, model).estimated_cost_usd for d in durations
        )

        savings = individual_costs - total_cost
        savings_percent = (
            (savings / individual_costs * 100) if individual_costs > 0 else 0
        )

        return {
            "total_duration": total_duration,
            "total_generation_time": total_time,
            "total_cost": total_cost,
            "individual_costs_sum": individual_costs,
            "batch_savings": savings,
            "savings_percent": savings_percent,
            "recommended_batch_size": self._recommend_batch_size(
                len(durations), total_duration
            ),
        }

    def get_optimization_recommendations(
        self, current_config: Dict
    ) -> OptimizationRecommendation:
        """
        Get recommendations for cost optimization.

        Args:
            current_config: Current generation configuration

        Returns:
            OptimizationRecommendation with actionable suggestions
        """
        recommendations = []
        memory_savings = 0.0

        if current_config.get("precision", "fp32") == "fp32":
            recommendations.append("Switch to FP16/BF16 precision (saves ~50% memory)")
            memory_savings += 50.0

        if not current_config.get("gradient_checkpointing", False):
            recommendations.append("Enable gradient checkpointing (saves ~30% memory)")
            memory_savings += 30.0

        if (
            not current_config.get("batch_size")
            or current_config.get("batch_size", 1) < 4
        ):
            recommendations.append(
                "Increase batch size to 4-8 for better GPU utilization"
            )

        if current_config.get("flash_attention", True) is False:
            recommendations.append("Enable Flash Attention 2 for faster generation")

        if current_config.get("model_parallel", False):
            recommendations.append("Consider model parallelism for large models")

        current_cost = current_config.get("estimated_cost", 0.10)
        optimized_cost = current_cost * 0.7  # Estimate 30% savings

        return OptimizationRecommendation(
            current_cost=current_cost,
            optimized_cost=optimized_cost,
            savings_percent=30.0,
            recommendations=recommendations,
            batch_size_recommendation=self._recommend_batch_size(
                current_config.get("batch_size", 1),
                current_config.get("total_duration", 180),
            ),
            memory_savings_percent=memory_savings,
        )

    def _recommend_batch_size(self, current_count: int, total_duration: float) -> int:
        """Recommend optimal batch size."""
        available_vram = self.gpu_specs["vram_gb"]

        if available_vram >= 40:
            return 8
        elif available_vram >= 24:
            return 4
        elif available_vram >= 16:
            return 2
        else:
            return 1

    def calculate_monthly_costs(
        self, generations_per_day: int, avg_duration: float, model: str = "heartmula"
    ) -> Dict[str, float]:
        """
        Calculate monthly costs for a generation schedule.

        Args:
            generations_per_day: Average generations per day
            avg_duration: Average duration per generation
            model: Model being used

        Returns:
            Monthly cost breakdown
        """
        daily_cost = (
            generations_per_day
            * self.estimate_cost(avg_duration, model).estimated_cost_usd
        )
        monthly_cost = daily_cost * 30

        return {
            "daily_generations": generations_per_day,
            "daily_cost": daily_cost,
            "monthly_cost": monthly_cost,
            "cost_per_generation": daily_cost / generations_per_day
            if generations_per_day > 0
            else 0,
            "cost_per_minute": daily_cost / (generations_per_day * avg_duration / 60)
            if generations_per_day > 0
            else 0,
        }


def estimate_generation_cost(
    duration: float, gpu_type: GPUType = GPUType.RTX_4090, model: str = "heartmula"
) -> float:
    """Convenience function for quick cost estimation."""
    optimizer = CostOptimizer(gpu_type=gpu_type)
    cost = optimizer.estimate_cost(duration, model)
    return cost.estimated_cost_usd


if __name__ == "__main__":
    print("Cost Optimization Module")
    print("=" * 50)

    optimizer = CostOptimizer(gpu_type=GPUType.RTX_4090)

    print("\nGPU Specifications:")
    print(f"  Type: {optimizer.gpu_type.value}")
    print(f"  VRAM: {optimizer.gpu_specs['vram_gb']} GB")
    print(f"  TFLOPS: {optimizer.gpu_specs['tflops']}")
    print(f"  Cost/hour: ${optimizer.gpu_specs['cost_per_hour']}")

    print("\n\nCost Estimation (3-minute song):")
    print("-" * 40)

    for model in ["musicgen", "heartmula", "audioldm2"]:
        cost = optimizer.estimate_cost(duration=180, model=model)
        print(f"\n  {model.upper()}:")
        print(f"    Generation time: {cost.generation_time_seconds:.1f}s")
        print(f"    GPU hours: {cost.gpu_hours:.4f}")
        print(f"    Estimated cost: ${cost.estimated_cost_usd:.4f}")
        print(f"    Memory peak: {cost.memory_peak_gb:.1f} GB")
        print(f"    Efficiency: {cost.efficiency_score:.1%}")

    print("\n\nBatch Processing Analysis:")
    print("-" * 40)

    durations = [180, 180, 180, 120, 120]
    batch_cost = optimizer.estimate_batch_cost(durations, model="heartmula")

    print(f"  5 songs (3x180s + 2x120s)")
    print(f"  Total duration: {batch_cost['total_duration']:.0f}s")
    print(f"  Total cost: ${batch_cost['total_cost']:.4f}")
    print(f"  Batch savings: {batch_cost['savings_percent']:.1f}%")
    print(f"  Recommended batch size: {batch_cost['recommended_batch_size']}")

    print("\n\nMonthly Cost Projection (10 songs/day):")
    print("-" * 40)

    monthly = optimizer.calculate_monthly_costs(
        generations_per_day=10, avg_duration=180, model="heartmula"
    )

    print(f"  Daily cost: ${monthly['daily_cost']:.2f}")
    print(f"  Monthly cost: ${monthly['monthly_cost']:.2f}")
    print(f"  Cost per generation: ${monthly['cost_per_generation']:.4f}")
    print(f"  Cost per minute: ${monthly['cost_per_minute']:.4f}")

    print("\n" + "=" * 50)
    print("Cost optimizer ready.")
