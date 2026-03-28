import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

beforeAll(async () => {
  // Conectar a DB de test (solo si existe una DB de test)
  if (process.env.DATABASE_URL?.includes('test')) {
    await prisma.$connect()
  }
})

afterAll(async () => {
  // Limpiar y desconectar
  if (process.env.DATABASE_URL?.includes('test')) {
    await prisma.$disconnect()
  }
})

beforeEach(async () => {
  // Limpiar datos entre tests (opcional - solo si hay DB de test)
  // await prisma.generation.deleteMany()
})

export { prisma }