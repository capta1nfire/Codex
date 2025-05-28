import { PrismaClient } from '@prisma/client';

import logger from '../utils/logger.js';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    logger.info('📋 Listando todos los usuarios...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      logger.info('ℹ️  No se encontraron usuarios en la base de datos.');
      return;
    }

    logger.info(`Total de usuarios: ${users.length}\n`);

    users.forEach((user, index) => {
      const roleIcon =
        {
          SUPERADMIN: '👑',
          WEBADMIN: '🔧',
          ADVANCED: '⭐',
          PREMIUM: '💎',
          USER: '👤',
        }[user.role] || '❓';

      const status = user.isActive ? '🟢' : '🔴';
      const lastLoginText = user.lastLogin
        ? new Date(user.lastLogin).toLocaleDateString('es-ES')
        : 'Nunca';

      logger.info(`${index + 1}. ${roleIcon} ${user.firstName} ${user.lastName || ''}`);
      logger.info(`   📧 ${user.email}`);
      logger.info(`   🏷️  Rol: ${user.role}`);
      logger.info(`   ${status} Estado: ${user.isActive ? 'Activo' : 'Inactivo'}`);
      logger.info(`   📅 Último acceso: ${lastLoginText}`);
      logger.info(`   🆔 ID: ${user.id}`);
      logger.info('');
    });
  } catch (error) {
    logger.error('❌ Error al listar usuarios:', error);
    throw error;
  }
}

async function makeUserAdmin(email: string, roleType: 'WEBADMIN' | 'SUPERADMIN' = 'WEBADMIN') {
  try {
    logger.info(`🔄 Convirtiendo usuario ${email} a ${roleType}...`);

    // Verificar que el usuario existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true, role: true },
    });

    if (!existingUser) {
      logger.error(`❌ Usuario con email ${email} no encontrado.`);
      return;
    }

    logger.info(`👤 Usuario encontrado: ${existingUser.firstName} ${existingUser.lastName || ''}`);
    logger.info(`🏷️  Rol actual: ${existingUser.role}`);

    if (existingUser.role === roleType) {
      logger.info(`ℹ️  El usuario ya tiene el rol ${roleType}.`);
      return;
    }

    // Actualizar el rol del usuario
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: roleType },
      select: { id: true, firstName: true, lastName: true, role: true, email: true },
    });

    const roleIcon = roleType === 'SUPERADMIN' ? '👑' : '🔧';
    logger.info(`✅ Usuario actualizado exitosamente:`);
    logger.info(`   ${roleIcon} ${updatedUser.firstName} ${updatedUser.lastName || ''}`);
    logger.info(`   📧 ${updatedUser.email}`);
    logger.info(`   🏷️  Nuevo rol: ${updatedUser.role}`);
  } catch (error) {
    logger.error(`❌ Error al convertir usuario a ${roleType}:`, error);
    throw error;
  }
}

// Lógica principal
async function main() {
  try {
    const args = process.argv.slice(2);

    if (args.includes('--list')) {
      await listUsers();
    } else if (args.length >= 1) {
      const email = args[0];
      const roleType = args[1]?.toUpperCase() === 'SUPERADMIN' ? 'SUPERADMIN' : 'WEBADMIN';
      await makeUserAdmin(email, roleType);
    } else {
      logger.info('📖 Uso del script:');
      logger.info('  npm run list-users                    # Listar todos los usuarios');
      logger.info('  npm run make-admin <email>            # Convertir a WebAdmin');
      logger.info('  npm run make-admin <email> SUPERADMIN # Convertir a SuperAdmin');
      logger.info('');
      logger.info('Ejemplos:');
      logger.info('  npm run make-admin usuario@ejemplo.com');
      logger.info('  npm run make-admin usuario@ejemplo.com SUPERADMIN');
    }
  } catch (error) {
    logger.error('💥 Error fatal:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
