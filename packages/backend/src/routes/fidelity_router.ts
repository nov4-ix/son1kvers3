/**
 * Fidelity-Aware Remix Routing
 * Routes remix jobs based on fidelity level to optimize cost
 */

import { ComputeTier, ComputeJob } from './compute_router';

export enum RemixMode {
  REMIX = 'remix',      // 0-33%
  COVER = 'cover',      // 34-66%
  UPGRADE = 'upgrade'  // 67-100%
}

export interface RemixStrategy {
  mode: RemixMode;
  computeTier: ComputeTier;
  description: string;
  processingTime: number; // estimated seconds
  gpuRequired: boolean;
}

export class FidelityRouter {
  /**
   * Determine processing strategy based on fidelity
   */
  public static getStrategy(fidelity: number, userTier: string): RemixStrategy {
    // Route based on fidelity level
    if (fidelity < 30) {
      return {
        mode: RemixMode.REMIX,
        computeTier: ComputeTier.LIGHT_CPU,
        description: 'CPU-based embedding transform, no GPU required',
        processingTime: 30,
        gpuRequired: false
      };
    } else if (fidelity < 70) {
      return {
        mode: RemixMode.COVER,
        computeTier: ComputeTier.MEDIUM_GPU,
        description: 'Partial generation with melody preservation',
        processingTime: 60,
        gpuRequired: true
      };
    } else {
      return {
        mode: RemixMode.UPGRADE,
        computeTier: ComputeTier.HEAVY_GPU,
        description: 'Full regeneration with stem separation and mastering',
        processingTime: 180,
        gpuRequired: true
      };
    }
  }

  /**
   * Check if user tier allows requested fidelity
   */
  public static canAccessFidelity(fidelity: number, userTier: string): boolean {
    const tierLimits: Record<string, number> = {
      'free': 33,
      'basic': 66,
      'pro': 100,
      'enterprise': 100
    };

    const limit = tierLimits[userTier] || 0;
    return fidelity <= limit;
  }

  /**
   * Get max fidelity for user tier
   */
  public static getMaxFidelity(userTier: string): number {
    const tierLimits: Record<string, number> = {
      'free': 33,
      'basic': 66,
      'pro': 100,
      'enterprise': 100
    };

    return tierLimits[userTier] || 0;
  }

  /**
   * Get available modes for user tier
   */
  public static getAvailableModes(userTier: string): RemixMode[] {
    const tierModes: Record<string, RemixMode[]> = {
      'free': [RemixMode.REMIX],
      'basic': [RemixMode.REMIX, RemixMode.COVER],
      'pro': [RemixMode.REMIX, RemixMode.COVER, RemixMode.UPGRADE],
      'enterprise': [RemixMode.REMIX, RemixMode.COVER, RemixMode.UPGRADE]
    };

    return tierModes[userTier] || [RemixMode.REMIX];
  }

  /**
   * Estimate processing time based on fidelity and duration
   */
  public static estimateProcessingTime(fidelity: number, duration: number): number {
    const baseTime = this.getStrategy(fidelity, 'pro').processingTime;
    
    // Scale by duration
    const durationScale = duration / 60; // base on 60 seconds
    
    return baseTime * durationScale;
  }

  /**
   * Get routing decision for job
   */
  public static routeJob(
    fidelity: number,
    userTier: string,
    payload: Record<string, unknown>
  ): { tier: ComputeTier; canProceed: boolean; reason?: string } {
    // Check tier access
    if (!this.canAccessFidelity(fidelity, userTier)) {
      return {
        tier: ComputeTier.LIGHT_CPU,
        canProceed: false,
        reason: `User tier ${userTier} does not allow fidelity ${fidelity}%. Max: ${this.getMaxFidelity(userTier)}%`
      };
    }

    // Get strategy
    const strategy = this.getStrategy(fidelity, userTier);

    // Add fidelity to payload for downstream processing
    (payload as any).fidelity = fidelity;
    (payload as any).remixMode = strategy.mode;

    return {
      tier: strategy.computeTier,
      canProceed: true
    };
  }
}

// Export
export default FidelityRouter;
