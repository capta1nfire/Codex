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
    where: { email: 'admin@qreable.com' },
    update: {}, // No actualizar si ya existe
    create: {
      email: 'admin@qreable.com',
      firstName: 'Administrator',
      password: adminPassword,
      role: Role.SUPERADMIN,
      isActive: true, // Asegurar que estén activos
    },
  });
  console.log(`Created/found admin user: ${admin.email}`);

  const user = await prisma.user.upsert({
    where: { email: 'user@qreable.com' },
    update: {},
    create: {
      email: 'user@qreable.com',
      firstName: 'Test',
      lastName: 'User',
      password: userPassword,
      role: Role.USER,
      isActive: true,
    },
  });
  console.log(`Created/found standard user: ${user.email}`);

  const premium = await prisma.user.upsert({
    where: { email: 'premium@qreable.com' },
    update: {},
    create: {
      email: 'premium@qreable.com',
      firstName: 'Premium',
      lastName: 'User',
      password: premiumPassword,
      role: Role.PREMIUM,
      isActive: true,
    },
  });
  console.log(`Created/found premium user: ${premium.email}`);

  // Crear usuario personal capta1nfire
  const captainPassword = await bcrypt.hash('$Am3r1c4*19.27!', 10);
  const captain = await prisma.user.upsert({
    where: { email: 'capta1nfire@me.com' },
    update: {
      password: captainPassword, // Actualizar contraseña si el usuario ya existe
    },
    create: {
      email: 'capta1nfire@me.com',
      firstName: 'Captain',
      lastName: 'Fire',
      password: captainPassword,
      role: Role.SUPERADMIN,
      isActive: true,
    },
  });
  console.log(`Created/found captain user: ${captain.email}`);

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