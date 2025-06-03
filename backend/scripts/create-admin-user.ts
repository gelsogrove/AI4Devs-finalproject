import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');

    // Check if admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@shopmefy.com' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists');
      console.log('📧 Email: admin@shopmefy.com');
      console.log('🔑 Password: admin123');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@shopmefy.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@shopmefy.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', adminUser.id);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser(); 