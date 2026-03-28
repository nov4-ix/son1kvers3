export interface TimeSlot {
    day: string;
    time: string; // "10:00"
    score: number; // 0-100
    reason: string;
}

export class ScheduleOptimizer {

    /**
     * Get optimal posting slots for a user on a specific platform
     */
    getOptimalSlots(platform: string, audienceType: string): TimeSlot[] {
        const baseSlots = this.getPlatformBaseSlots(platform);

        // Adjust based on audience (simple heuristic for now)
        return baseSlots.map(slot => {
            let adjustedScore = slot.score;
            let reason = slot.reason;

            if (audienceType.toLowerCase().includes('professional') && this.isWorkHours(slot.time)) {
                adjustedScore += 10;
                reason += " + High professional activity";
            }

            if (audienceType.toLowerCase().includes('student') && this.isEvening(slot.time)) {
                adjustedScore += 15;
                reason += " + Student free time";
            }

            return { ...slot, score: Math.min(100, adjustedScore), reason };
        }).sort((a, b) => b.score - a.score).slice(0, 5);
    }

    private getPlatformBaseSlots(platform: string): TimeSlot[] {
        switch (platform.toLowerCase()) {
            case 'linkedin':
                return [
                    { day: 'Tuesday', time: '09:00', score: 95, reason: 'Peak professional engagement' },
                    { day: 'Wednesday', time: '10:00', score: 90, reason: 'Mid-week momentum' },
                    { day: 'Thursday', time: '09:00', score: 92, reason: 'High visibility' },
                    { day: 'Tuesday', time: '17:00', score: 85, reason: 'End of work day check' }
                ];
            case 'instagram':
                return [
                    { day: 'Monday', time: '12:00', score: 88, reason: 'Lunch break scrolling' },
                    { day: 'Wednesday', time: '19:00', score: 92, reason: 'Evening relaxation' },
                    { day: 'Friday', time: '16:00', score: 85, reason: 'Weekend mood start' },
                    { day: 'Sunday', time: '20:00', score: 90, reason: 'Sunday scaries scrolling' }
                ];
            case 'twitter':
                return [
                    { day: 'Monday', time: '09:00', score: 85, reason: 'News catchup' },
                    { day: 'Wednesday', time: '12:00', score: 90, reason: 'Lunch discussions' },
                    { day: 'Friday', time: '09:00', score: 88, reason: 'End of week news' }
                ];
            default:
                return [
                    { day: 'Tuesday', time: '10:00', score: 80, reason: 'General high traffic' },
                    { day: 'Thursday', time: '14:00', score: 80, reason: 'General high traffic' }
                ];
        }
    }

    private isWorkHours(time: string): boolean {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 9 && hour <= 17;
    }

    private isEvening(time: string): boolean {
        const hour = parseInt(time.split(':')[0]);
        return hour >= 18 && hour <= 23;
    }
}

export const scheduleOptimizer = new ScheduleOptimizer();
