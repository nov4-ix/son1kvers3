import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create Supabase client only if environment variables are provided
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('⚠️  Supabase environment variables not provided. Running in development mode without Supabase.')
}

export class SupabaseAuthService {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  async createUserFromSupabase(supabaseUser: any) {
    if (!supabase) {
      console.warn('Supabase not configured, returning null for development')
      return null
    }

    try {
      // Check if user already exists with userTier
      const existingUser = await this.getUserWithTier(supabaseUser.id)

      if (existingUser && existingUser.userTier) {
        return existingUser
      }

      // If user exists but no userTier, create it
      if (existingUser && !existingUser.userTier) {
        await this.createUserTier(existingUser.id, existingUser.tier)
        return await this.getUserWithTier(existingUser.id)
      }

      // Check by email in case id doesn't match
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: supabaseUser.email },
        include: { userTier: true }
      })

      if (existingUserByEmail) {
        // If no userTier, create it
        if (!existingUserByEmail.userTier) {
          await this.createUserTier(existingUserByEmail.id, existingUserByEmail.tier)
          return await this.getUserWithTier(existingUserByEmail.id)
        }
        return existingUserByEmail
      }

      // Create new user
      const user = await this.prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email,
          username: supabaseUser.user_metadata?.username || supabaseUser.email.split('@')[0],
          tier: 'FREE',
          isAdmin: false,
          alvaeEnabled: false
        }
      })

      // Create user tier record
      await this.createUserTier(user.id, 'FREE')

      // Return user with userTier
      return await this.getUserWithTier(user.id)
    } catch (error) {
      console.error('Error creating user from Supabase:', error)
      throw error
    }
  }

  async createUserTier(userId: string, tier: string) {
    const tierConfigs = {
      FREE: {
        monthlyGenerations: 10,
        dailyGenerations: 5,
        maxDuration: 60,
        quality: 'standard',
        features: ['basic_generation', 'community_access']
      },
      BASIC: {
        monthlyGenerations: 100,
        dailyGenerations: 20,
        maxDuration: 120,
        quality: 'standard',
        features: ['basic_generation', 'community_access']
      },
      PRO: {
        monthlyGenerations: 500,
        dailyGenerations: 50,
        maxDuration: 120,
        quality: 'high',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls']
      },
      PREMIUM: {
        monthlyGenerations: 1000,
        dailyGenerations: 100,
        maxDuration: 300,
        quality: 'premium',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls', 'collaboration', 'commercial_use']
      },
      ENTERPRISE: {
        monthlyGenerations: 10000,
        dailyGenerations: 500,
        maxDuration: 600,
        quality: 'enterprise',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls', 'collaboration', 'commercial_use', 'api_access', 'white_label']
      }
    }

    const config = tierConfigs[tier as keyof typeof tierConfigs]

    return await this.prisma.userTier.create({
      data: {
        userId,
        tier,
        monthlyGenerations: config.monthlyGenerations,
        dailyGenerations: config.dailyGenerations,
        maxDuration: config.maxDuration,
        quality: config.quality,
        features: config.features.join(','), // Convert array to comma-separated string
        usedThisMonth: 0,
        usedToday: 0,
        monthResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        dayResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      }
    })
  }

  async updateUserTier(userId: string, newTier: string, stripeCustomerId?: string, stripeSubscriptionId?: string) {
    // Update user tier
    await this.prisma.user.update({
      where: { id: userId },
      data: { tier: newTier }
    })

    // Update or create user tier record
    const existingUserTier = await this.prisma.userTier.findUnique({
      where: { userId }
    })

    const tierConfigs = {
      FREE: {
        monthlyGenerations: 10,
        dailyGenerations: 5,
        maxDuration: 60,
        quality: 'standard',
        features: ['basic_generation', 'community_access']
      },
      BASIC: {
        monthlyGenerations: 100,
        dailyGenerations: 20,
        maxDuration: 120,
        quality: 'standard',
        features: ['basic_generation', 'community_access']
      },
      PRO: {
        monthlyGenerations: 500,
        dailyGenerations: 50,
        maxDuration: 120,
        quality: 'high',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls']
      },
      PREMIUM: {
        monthlyGenerations: 1000,
        dailyGenerations: 100,
        maxDuration: 300,
        quality: 'premium',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls', 'collaboration', 'commercial_use']
      },
      ENTERPRISE: {
        monthlyGenerations: 10000,
        dailyGenerations: 500,
        maxDuration: 600,
        quality: 'enterprise',
        features: ['basic_generation', 'community_access', 'priority_support', 'advanced_controls', 'collaboration', 'commercial_use', 'api_access', 'white_label']
      }
    }

    const config = tierConfigs[newTier as keyof typeof tierConfigs] || tierConfigs.FREE

    if (existingUserTier) {
      await this.prisma.userTier.update({
        where: { userId },
        data: {
          tier: newTier,
          monthlyGenerations: config.monthlyGenerations,
          dailyGenerations: config.dailyGenerations,
          maxDuration: config.maxDuration,
          quality: config.quality,
          features: config.features.join(','),
          stripeCustomerId,
          stripeSubscriptionId,
          subscriptionStatus: 'active',
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      })
    } else {
      await this.createUserTier(userId, newTier)
      // If we have stripe IDs, update them too (createUserTier only sets defaults)
      if (stripeCustomerId || stripeSubscriptionId) {
        await this.prisma.userTier.update({
          where: { userId },
          data: { stripeCustomerId, stripeSubscriptionId }
        })
      }
    }
  }

  async getUserWithTier(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userTier: true
      }
    })
  }

  async checkGenerationLimit(userId: string): Promise<{ allowed: boolean; reason?: string; limits: any }> {
    const user = await this.getUserWithTier(userId)

    if (!user || !user.userTier) {
      return { allowed: false, reason: 'User not found or no tier assigned', limits: {} }
    }

    const { userTier } = user
    const now = new Date()

    // Check monthly limit
    if (userTier.usedThisMonth >= userTier.monthlyGenerations) {
      return {
        allowed: false,
        reason: 'Monthly generation limit reached',
        limits: {
          monthly: { used: userTier.usedThisMonth, limit: userTier.monthlyGenerations },
          daily: { used: userTier.usedToday, limit: userTier.dailyGenerations }
        }
      }
    }

    // Check daily limit
    if (userTier.usedToday >= userTier.dailyGenerations) {
      return {
        allowed: false,
        reason: 'Daily generation limit reached',
        limits: {
          monthly: { used: userTier.usedThisMonth, limit: userTier.monthlyGenerations },
          daily: { used: userTier.usedToday, limit: userTier.dailyGenerations }
        }
      }
    }

    return {
      allowed: true,
      limits: {
        monthly: { used: userTier.usedThisMonth, limit: userTier.monthlyGenerations },
        daily: { used: userTier.usedToday, limit: userTier.dailyGenerations }
      }
    }
  }

  async incrementGenerationUsage(userId: string) {
    const userTier = await this.prisma.userTier.findUnique({
      where: { userId }
    })

    if (!userTier) {
      throw new Error('User tier not found')
    }

    await this.prisma.userTier.update({
      where: { userId },
      data: {
        usedThisMonth: userTier.usedThisMonth + 1,
        usedToday: userTier.usedToday + 1
      }
    })
  }

  async resetDailyUsage() {
    await this.prisma.userTier.updateMany({
      data: {
        usedToday: 0,
        dayResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    })
  }

  async resetMonthlyUsage() {
    await this.prisma.userTier.updateMany({
      data: {
        usedThisMonth: 0,
        monthResetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    })
  }

  async validateSupabaseToken(token: string) {
    if (!supabase) {
      console.warn('Supabase not configured, returning mock user for development')
      return {
        id: 'dev-user-1',
        email: 'dev@example.com',
        user_metadata: { username: 'devuser' }
      }
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token)

      if (error || !user) {
        return null
      }

      return user
    } catch (error) {
      console.error('Error validating Supabase token:', error)
      return null
    }
  }
}
