const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTokens() {
    try {
        const tokens = await prisma.token.findMany({
            select: {
                id: true,
                email: true,
                hash: true,
                isActive: true,
                isValid: true,
                encryptedToken: true
            }
        });

        console.log('📊 Tokens en la base de datos:');
        console.log('Total:', tokens.length);
        console.log('');

        tokens.forEach((token, idx) => {
            console.log(`Token ${idx + 1}:`);
            console.log('  ID:', token.id);
            console.log('  Email:', token.email);
            console.log('  Hash:', token.hash);
            console.log('  Activo:', token.isActive);
            console.log('  Válido:', token.isValid);
            console.log('  Token (primeros 50 chars):', token.encryptedToken.substring(0, 50) + '...');
            console.log('  Token length:', token.encryptedToken.length);
            console.log('  Tiene saltos de línea:', token.encryptedToken.includes('\n') || token.encryptedToken.includes('\r'));
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkTokens();
