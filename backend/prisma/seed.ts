import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

// Instanciar Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Hashear contraseñas
  const adminPassword = await bcrypt.hash('admin123', 10);
  const userPassword = await bcrypt.hash('user123', 10);
  const premiumPassword = await bcrypt.hash('premium123', 10);

  // Crear usuarios (usar createMany para eficiencia si son muchos, pero create es más claro aquí)
  // Usaremos upsert para evitar errores si el script se corre múltiples veces
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@codex.com' },
    update: {}, // No actualizar si ya existe
    create: {
      email: 'admin@codex.com',
      firstName: 'Administrator',
      password: adminPassword,
      role: Role.SUPERADMIN,
      isActive: true, // Asegurar que estén activos
    },
  });
  console.log(`Created/found admin user: ${admin.email}`);

  const user = await prisma.user.upsert({
    where: { email: 'user@codex.com' },
    update: {},
    create: {
      email: 'user@codex.com',
      firstName: 'Test',
      lastName: 'User',
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });
  console.log(`Created/found standard user: ${user.email}`);

  const premium = await prisma.user.upsert({
    where: { email: 'premium@codex.com' },
    update: {},
    create: {
      email: 'premium@codex.com',
      firstName: 'Premium',
      lastName: 'User',
      password: premiumPassword,
      role: Role.PREMIUM,
      isActive: true,
    },
  });
  console.log(`Created/found premium user: ${premium.email}`);

  console.log(`Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    // Cerrar conexión de Prisma
    await prisma.$disconnect();
  }); 