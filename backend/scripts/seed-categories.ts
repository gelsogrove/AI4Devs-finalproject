import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

const sampleCategories = [
  {
    name: 'Formaggi',
    description: 'Formaggi italiani di alta qualità',
  },
  {
    name: 'Salumi',
    description: 'Salumi e insaccati tradizionali',
  },
  {
    name: 'Pasta',
    description: 'Pasta fresca e secca artigianale',
  },
  {
    name: 'Vini',
    description: 'Vini italiani selezionati',
  },
  {
    name: 'Olio',
    description: 'Olio extravergine di oliva',
  },
  {
    name: 'Conserve',
    description: 'Conserve e prodotti sott\'olio',
  },
  {
    name: 'Dolci',
    description: 'Dolci e dessert tradizionali',
  },
  {
    name: 'Bevande',
    description: 'Bevande analcoliche e liquori',
  },
];

async function seedCategories() {
  console.log('🚀 Starting category seeding...');

  try {
    // Check if categories already exist
    const existingCategories = await prisma.category.findMany();
    
    if (existingCategories.length > 0) {
      console.log(`📊 Found ${existingCategories.length} existing categories. Skipping seeding.`);
      return;
    }

    // Create categories
    for (const categoryData of sampleCategories) {
      const category = await prisma.category.create({
        data: {
          id: uuidv4(),
          name: categoryData.name,
          description: categoryData.description,
          isActive: true,
        },
      });

      console.log(`✅ Created category: ${category.name} (${category.id})`);
    }

    console.log(`📝 Created ${sampleCategories.length} categories successfully!`);

  } catch (error) {
    console.error('❌ Error during category seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
if (require.main === module) {
  seedCategories().catch(console.error);
}

export { seedCategories };
