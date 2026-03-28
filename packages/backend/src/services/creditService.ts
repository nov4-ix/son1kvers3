
import { PrismaClient } from '@prisma/client';

export class CreditService {
    constructor(private prisma: PrismaClient) { }

    /**
     * Get user credit balance and stats
     */
    async getUserCredits(userId: string) {
        let credits = await this.prisma.userCredits.findUnique({
            where: { userId }
        });

        // Create if not exists with default values
        if (!credits) {
            // First, ensure the user exists in the users table
            let user = await this.prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                // Create user if doesn't exist
                user = await this.prisma.user.create({
                    data: {
                        id: userId,
                        email: `${userId}@temp.local`,
                        username: userId,
                        tier: 'FREE'
                    }
                });
            }

            // Now create credits
            credits = await this.prisma.userCredits.create({
                data: {
                    userId,
                    totalCredits: 100, // Welcome bonus
                    boostMinutes: 60,
                    level: 1,
                    xp: 0
                }
            });
        }

        return credits;
    }

    /**
     * Spend credits for an action
     */
    async spendCredits(userId: string, amount: number, purpose: string): Promise<boolean> {
        const credits = await this.getUserCredits(userId);

        if (credits.totalCredits - credits.usedCredits < amount) {
            return false;
        }

        await this.prisma.userCredits.update({
            where: { userId },
            data: {
                usedCredits: { increment: amount },
                spentOn: [
                    ...(credits.spentOn as string[] || []),
                    { amount, purpose, date: new Date().toISOString() }
                ]
            }
        });

        // Grant XP for spending credits (Gamification)
        await this.addXp(userId, amount * 10); // 10 XP per credit

        return true;
    }

    /**
     * Add credits to user wallet
     */
    async addCredits(userId: string, amount: number, source: string) {
        const credits = await this.getUserCredits(userId);

        await this.prisma.userCredits.update({
            where: { userId },
            data: {
                totalCredits: { increment: amount },
                earnedBy: [
                    ...(credits.earnedBy as string[] || []),
                    { amount, source, date: new Date().toISOString() }
                ]
            }
        });
    }

    /**
     * Add XP and handle Level Up
     */
    async addXp(userId: string, amount: number) {
        const credits = await this.getUserCredits(userId);
        let newXp = credits.xp + amount;
        let newLevel = credits.level;

        // Level up logic: Level N requires N * 1000 XP total? 
        // Simple formula: Level = floor(sqrt(XP / 100)) + 1
        // Let's use thresholds:
        // Lvl 1: 0-999
        // Lvl 2: 1000-2999
        // Lvl 3: 3000...

        // Better: Level * 1000 XP needed for next level
        // cost to reach level L = 500 * L * (L-1)

        // For now, simple incremental: 1000 XP per level
        const calculatedLevel = Math.floor(newXp / 1000) + 1;

        if (calculatedLevel > newLevel) {
            // Level Up!
            newLevel = calculatedLevel;
            // Grant Level Up Bonus?
            await this.prisma.userCredits.update({
                where: { userId },
                data: {
                    xp: newXp,
                    level: newLevel,
                    totalCredits: { increment: 50 } // 50 credits bonus level up
                }
            });
            return { levelUp: true, newLevel };
        } else {
            await this.prisma.userCredits.update({
                where: { userId },
                data: { xp: newXp }
            });
            return { levelUp: false, newLevel };
        }
    }

    /**
     * Activate Boost Mode
     * Consumes boost minutes for priority
     */
    async activateBoost(userId: string): Promise<boolean> {
        const credits = await this.getUserCredits(userId);

        if (credits.boostMinutes < 10) { // Minimum 10 min activation
            return false;
        }

        // Logic for boost activation would typically involve checking a "boost active until" timestamp
        // For now, we assume this is called per-generation or session

        return true;
    }

    /**
     * Deduct boost minutes
     */
    async consumeBoost(userId: string, minutes: number) {
        await this.prisma.userCredits.update({
            where: { userId },
            data: {
                boostMinutes: { decrement: minutes }
            }
        });
    }
}
