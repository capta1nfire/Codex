import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRoles() {
  try {
    console.log('🔄 Iniciando migración de roles...');

    // Primero, vamos a ver qué usuarios tienen rol ADMIN
    const adminUsers = await prisma.$queryRaw`
      SELECT id, email, "firstName", role 
      FROM "User" 
      WHERE role = 'ADMIN'
    `;

    console.log('👥 Usuarios con rol ADMIN encontrados:', adminUsers);

    if (Array.isArray(adminUsers) && adminUsers.length > 0) {
      console.log('📝 Actualizando usuarios ADMIN a WEBADMIN...');

      // Actualizar usuarios con rol ADMIN a WEBADMIN
      const updateResult = await prisma.$executeRaw`
        UPDATE "User" 
        SET role = 'WEBADMIN' 
        WHERE role = 'ADMIN'
      `;

      console.log(`✅ ${updateResult} usuarios actualizados de ADMIN a WEBADMIN`);
    } else {
      console.log('ℹ️  No se encontraron usuarios con rol ADMIN');
    }

    // Verificar el resultado
    const webAdminUsers = await prisma.$queryRaw`
      SELECT id, email, "firstName", role 
      FROM "User" 
      WHERE role = 'WEBADMIN'
    `;

    console.log('🎯 Usuarios con rol WEBADMIN después de la migración:', webAdminUsers);

    console.log('✅ Migración de roles completada exitosamente');
  } catch (error) {
    console.error('❌ Error durante la migración de roles:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la migración
migrateRoles()
  .then(() => {
    console.log('🏁 Script de migración finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

export { migrateRoles };
