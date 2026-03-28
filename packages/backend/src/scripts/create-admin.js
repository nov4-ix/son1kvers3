const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createAdminUser() {
  const adminEmail = 'nov4-ix@son1kvers3.com'
  const adminUserId = 'admin-nov4-ix-son1kvers3'

  console.log('🚀 Creando usuario administrador:', adminEmail)

  try {
    // 1. Crear usuario en Prisma
    const user = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {
        isAdmin: true,
        alvaeEnabled: true,
        tier: 'ENTERPRISE',
        username: 'nov4-ix',
        metadata: {
          symbol: 'ALVAE',
          role: 'administrator',
          created_by_system: true,
          admin_override: true
        }
      },
      create: {
        id: adminUserId,
        email: adminEmail,
        username: 'nov4-ix',
        tier: 'ENTERPRISE',
        isAdmin: true,
        alvaeEnabled: true,
        metadata: {
          symbol: 'ALVAE',
          role: 'administrator',
          created_by_system: true,
          admin_override: true
        }
      }
    })

    console.log('✅ Usuario creado en Prisma:', user.id)

    // 2. Crear UserTier
    const userTier = await prisma.userTier.upsert({
      where: { userId: user.id },
      update: {
        tier: 'ENTERPRISE',
        monthlyGenerations: 999999,
        dailyGenerations: 999999,
        usedThisMonth: 0,
        usedToday: 0,
        maxDuration: 600,
        quality: 'premium',
        features: 'unlimited_generation,premium_quality,alvae_system,admin_tools,all_extensions,instant_generation,priority_queue,advanced_analytics,collaboration_tools,nft_creation,commercial_license,god_mode'
      },
      create: {
        userId: user.id,
        tier: 'ENTERPRISE',
        monthlyGenerations: 999999,
        dailyGenerations: 999999,
        maxDuration: 600,
        quality: 'premium',
        features: 'unlimited_generation,premium_quality,alvae_system,admin_tools,all_extensions,instant_generation,priority_queue,advanced_analytics,collaboration_tools,nft_creation,commercial_license,god_mode'
      }
    })

    console.log('✅ UserTier: PERMISOS ILIMITADOS')

    // 3. Crear UserCredits
    const userCredits = await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: {
        totalCredits: 999999999,
        usedCredits: 0,
        bonusCredits: 999999999
      },
      create: {
        userId: user.id,
        totalCredits: 999999999,
        usedCredits: 0,
        bonusCredits: 999999999
      }
    })

    console.log('✅ UserCredits: CRÉDITOS ILIMITADOS')

    console.log('\n🎉 ¡USUARIO ADMINISTRADOR CREADO!')
    console.log('================================')
    console.log('👑 Email: nov4-ix@son1kvers3.com')
    console.log('🔑 Password: iloveMusic!90')
    console.log('🎭 Símbolo: ALVAE')
    console.log('⚡ Estado: GOD MODE ACTIVADO')

  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  }
}

createAdminUser()
  .catch((e) => {
    console.error('❌ Error fatal:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })