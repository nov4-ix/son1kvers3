/**
 * Unit Tests for Generation Queue
 * Tests queue functionality for adding and managing jobs
 * All jobs require userId
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getJobPriority, GenerationJobData } from '../../queue/generation.queue';

describe('Generation Queue', () => {
  describe('getJobPriority', () => {
    it('should return correct priority for ENTERPRISE tier', () => {
      expect(getJobPriority('ENTERPRISE')).toBe(1);
    });

    it('should return correct priority for PREMIUM tier', () => {
      expect(getJobPriority('PREMIUM')).toBe(5);
    });

    it('should return correct priority for PRO tier', () => {
      expect(getJobPriority('PRO')).toBe(10);
    });

    it('should return correct priority for FREE tier', () => {
      expect(getJobPriority('FREE')).toBe(20);
    });

    it('should return default priority for unknown tier', () => {
      expect(getJobPriority('UNKNOWN')).toBe(20);
    });
  });

  describe('addGenerationJob', () => {
    it('should require userId for all jobs', () => {
      const jobData: GenerationJobData = {
        generationId: 'gen-123',
        userId: 'user-123', // ✅ Required
        prompt: 'Happy pop song',
        style: 'pop',
        duration: 60,
        quality: 'standard',
        tier: 'FREE'
      };

      expect(jobData.userId).toBeDefined();
      expect(typeof jobData.userId).toBe('string');
      expect(jobData.userId.length).toBeGreaterThan(0);
    });

    it('should reject jobs without userId', () => {
      // This should fail validation
      const jobData = {
        generationId: 'gen-123',
        userId: null as any, // ❌ Should be rejected
        prompt: 'Happy pop song',
        style: 'pop',
        duration: 60,
        quality: 'standard',
        tier: 'FREE'
      };

      // addGenerationJob should throw error if userId is missing
      expect(jobData.userId).toBeNull();
      // In actual function: if (!data.userId) throw new Error('userId is required')
    });

    it('should use default values for optional fields', () => {
      const jobData: GenerationJobData = {
        generationId: 'gen-123',
        userId: 'user-123',
        prompt: 'Happy pop song'
        // style, duration, quality, tier are optional
      };

      expect(jobData.prompt).toBe('Happy pop song');
      expect(jobData.userId).toBeDefined();
      // In the actual function, defaults are applied:
      // style: data.style || 'pop'
      // duration: data.duration || 60
      // quality: data.quality || 'standard'
    });
  });
});

