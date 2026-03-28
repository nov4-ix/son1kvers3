const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTokens() {
  try {
    const tokens = await prisma.token.findMany();
    console.log('📊 Tokens en la base de datos:', tokens.length);
    tokens.forEach((token, i) => {
      console.log(`\nToken ${i + 1}:`);
      console.log('  ID:', token.id);
      console.log('  Hash:', token.hash);
      console.log('  Email:', token.email);
      console.log('  Activo:', token.isActive);
      console.log('  Válido:', token.isValid);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTokens();
