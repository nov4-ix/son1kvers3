import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Conectando a la base de datos...');

    const tokens = await prisma.token.findMany();
    console.log(`Encontrados ${tokens.length} tokens:`);

    tokens.forEach((token, index) => {
      console.log(`\n--- Token ${index + 1} ---`);
      console.log(`ID: ${token.id}`);
      console.log(`Hash: ${token.hash}`);
      console.log(`Email: ${token.email || 'N/A'}`);
      console.log(`isActive: ${token.isActive}`);
      console.log(`isValid: ${token.isValid}`);
      console.log(`UsageCount: ${token.usageCount}`);
      console.log(`Tier: ${token.tier}`);
      console.log(`expiresAt: ${token.expiresAt}`);
      console.log(`lastUsed: ${token.lastUsed}`);
      console.log(`metadata:`, token.metadata);
      console.log(`encryptedToken (length): ${token.encryptedToken?.length || 0}`);

      if (token.encryptedToken) {
        try {
          const decrypted = Buffer.from(token.encryptedToken, 'base64').toString('utf-8');
          console.log(`Decrypted token (first 100 chars): ${decrypted.substring(0, 100)}...`);
          console.log(`Contiene comillas? ${decrypted.includes('"')}`);
          console.log(`Longitud real: ${decrypted.length}`);
        } catch (error) {
          console.log('Error al decodificar token:', error.message);
        }
      }
      console.log();
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
