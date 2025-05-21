import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed process...');
  
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
    },
  });
  console.log(`Created user: ${user.email}`);
  
  // Create sample agent config if none exists
  const agentConfigCount = await prisma.agentConfig.count();
  if (agentConfigCount === 0) {
    await prisma.agentConfig.create({
      data: {
        temperature: 0.7,
        maxTokens: 500,
        topP: 0.9,
        model: 'gpt-4-turbo',
        prompt: 'You are a helpful shopping assistant for ShopMe. Help customers find products they are looking for and answer questions about products, shipping, returns, and other common inquiries.',
      },
    });
    console.log('Created default agent config');
  }
  
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 