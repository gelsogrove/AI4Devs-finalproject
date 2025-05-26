import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Seed products
  await seedProducts();
  
  // Seed FAQs
  await seedFAQs();
  
  // Seed services
  await seedServices();
  
  // Seed an initial admin user
  await seedUsers();
  
  // Seed agent config
  await seedAgentConfig();

  console.log('Database seeded successfully!');
}

async function seedProducts() {
  // Delete existing products
  await prisma.product.deleteMany({});
  
  // Create new products
  const products = [
    {
      name: 'Parmigiano Reggiano DOP',
      description: 'Authentic Italian Parmigiano Reggiano aged for 24 months. Perfect for grating over pasta or enjoying with a good wine.',
      price: 15.90,
      imageUrl: '/images/products/parmigiano.jpg',
      category: 'Cheese',
      stock: 25,
      tagsJson: JSON.stringify(['italian', 'cheese', 'premium'])
    },
    {
      name: 'Extra Virgin Olive Oil',
      description: 'Cold-pressed Italian olive oil from Tuscany. Fruity and slightly peppery.',
      price: 12.50,
      imageUrl: '/images/products/olive-oil.jpg',
      category: 'Oils',
      stock: 30,
      tagsJson: JSON.stringify(['italian', 'oil', 'premium'])
    },
    {
      name: 'Balsamic Vinegar of Modena',
      description: 'Traditional balsamic vinegar aged in wooden barrels for at least 12 years.',
      price: 18.75,
      imageUrl: '/images/products/balsamic.jpg',
      category: 'Vinegars',
      stock: 15,
      tagsJson: JSON.stringify(['italian', 'vinegar', 'premium'])
    },
    {
      name: 'Spaghetti',
      description: 'Bronze-drawn spaghetti from Gragnano, the pasta capital of Italy.',
      price: 3.25,
      imageUrl: '/images/products/spaghetti.jpg',
      category: 'Pasta',
      stock: 50,
      tagsJson: JSON.stringify(['italian', 'pasta', 'basic'])
    }
  ];
  
  for (const product of products) {
    await prisma.product.create({
      data: product
    });
  }
  
  console.log(`Seeded ${products.length} products`);
}

async function seedFAQs() {
  // Delete existing FAQs
  await prisma.fAQChunk.deleteMany({});
  await prisma.fAQ.deleteMany({});
  
  // Create new FAQs
  const faqs = [
    {
      question: 'What are your shipping costs?',
      answer: 'We offer free shipping on orders over €50. For orders under €50, shipping costs are €5.99 within Italy and €12.99 for international orders.',
      category: 'Shipping & Delivery',
      tagsJson: JSON.stringify(['shipping', 'costs'])
    },
    {
      question: 'How long does shipping take?',
      answer: 'Domestic orders (Italy) typically arrive within 1-3 business days. International orders may take 5-10 business days, depending on the destination country and customs processing.',
      category: 'Shipping & Delivery',
      tagsJson: JSON.stringify(['shipping', 'delivery', 'time'])
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 14 days of delivery. Products must be unused and in their original packaging. Please contact our customer service to initiate a return.',
      category: 'Returns & Refunds',
      tagsJson: JSON.stringify(['returns', 'policy'])
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. Some restrictions apply for perishable items. Please note that international orders may be subject to customs duties and taxes.',
      category: 'Shipping & Delivery',
      tagsJson: JSON.stringify(['shipping', 'international'])
    },
    {
      question: 'How do I track my order?',
      answer: 'Once your order ships, you will receive a confirmation email with a tracking number. You can use this number on our website or the carrier\'s website to track your package.',
      category: 'Orders',
      tagsJson: JSON.stringify(['orders', 'tracking'])
    }
  ];
  
  for (const faq of faqs) {
    await prisma.fAQ.create({
      data: faq
    });
  }
  
  console.log(`Seeded ${faqs.length} FAQs`);
}

async function seedServices() {
  // Delete existing services
  await prisma.service.deleteMany({});
  
  // Create new services
  const services = [
    {
      name: 'Italian Cooking Class',
      description: 'Learn the secrets of traditional Italian cooking from our expert chefs. Classes are held weekly and include all ingredients and equipment.',
      price: 79.99,
      isActive: true,
      tagsJson: JSON.stringify(['cooking', 'class', 'experience'])
    },
    {
      name: 'Cheese & Wine Tasting',
      description: 'Guided tasting of 5 premium Italian cheeses paired with complementary wines. Perfect for a date night or gathering with friends.',
      price: 49.99,
      isActive: true,
      tagsJson: JSON.stringify(['tasting', 'cheese', 'wine', 'experience'])
    },
    {
      name: 'Corporate Gift Baskets',
      description: 'Custom gift baskets for corporate clients. Choose from our selection of premium Italian products or create a custom selection.',
      price: 129.99,
      isActive: true,
      tagsJson: JSON.stringify(['gift', 'corporate', 'basket'])
    }
  ];
  
  for (const service of services) {
    await prisma.service.create({
      data: service
    });
  }
  
  console.log(`Seeded ${services.length} services`);
}

async function seedUsers() {
  // Delete existing users
  await prisma.user.deleteMany({});
  
  // Create admin user
  await prisma.user.create({
    data: {
      email: 'admin@gustoitaliano.com',
      password: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // Secret password = "password"
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    }
  });
  
  console.log('Seeded admin user');
}

async function seedAgentConfig() {
  // Delete existing config
  await prisma.agentConfig.deleteMany({});
  
  // Create initial agent config
  await prisma.agentConfig.create({
    data: {
      model: 'anthropic/claude-3-haiku-20240307',
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.95,
      topK: 40,
      prompt: `You are a helpful customer service chatbot for 'Gusto Italiano', an Italian specialty food shop.

Your name is Sofia, and you're friendly, knowledgeable, and passionate about Italian cuisine.

When speaking with customers:
- Be warm and conversational with a touch of Italian charm
- Use Italian phrases occasionally (with translations) to create authentic atmosphere
- Show deep knowledge about our products, especially cheeses, olive oils, pastas, and wines
- Provide helpful cooking tips and pairing suggestions
- Address the customer by name if known
- Keep your responses concise but informative

Our shop offers:
- Fine Italian cheeses (Parmigiano Reggiano, Pecorino, Mozzarella di Bufala)
- Premium olive oils and balsamic vinegars
- Artisanal pastas and sauces
- Italian wines and spirits
- Specialty cured meats
- Cooking classes and tasting events

We ship throughout Italy and the EU with free shipping on orders over €50.
Return policy: Unopened, non-perishable items can be returned within 14 days.

If asked about prices, mention that you can check specific prices but the customer should also visit our online shop for the most current pricing and promotions.`
    }
  });
  
  console.log('Seeded agent config');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 