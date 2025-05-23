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
        prompt: 'You are a helpful shopping assistant for an Italian food store called "Gusto Italiano". Help customers find authentic Italian products and answer questions about our products, shipping, returns, and other common inquiries.',
      },
    });
    console.log('Created default agent config');
  }
  
  // Define product categories
  const categories = [
    'Pasta & Risotto',
    'Olive Oil & Vinegar',
    'Sauces & Spreads',
    'Cheese & Dairy',
    'Salumi & Cured Meats',
    'Pastries & Desserts',
    'Wines & Spirits',
    'Coffee & Beverages'
  ];
  
  // Create sample products
  const productCount = await prisma.product.count();
  
  // Define products with tags
    const products = [
      {
        name: 'Parmigiano Reggiano DOP',
        description: 'Authentic Parmigiano Reggiano aged 24 months from Emilia-Romagna. Perfect for grating over pasta or enjoying with a glass of wine.',
        price: 19.99,
        imageUrl: 'https://images.unsplash.com/photo-1599937970284-31e55c9435c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Cheese & Dairy',
      tags: ['cheese', 'formaggio', 'parmigiano', 'parmesan', 'reggiano', 'dop', 'italian cheese', 'grating cheese']
      },
      {
        name: 'Extra Virgin Olive Oil',
        description: 'Cold-pressed Tuscan extra virgin olive oil with fruity notes and a peppery finish. Perfect for dressings and finishing dishes.',
        price: 24.99,
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Olive Oil & Vinegar',
      tags: ['oil', 'olio', 'olive oil', 'olio d\'oliva', 'extra virgin', 'extra vergine', 'tuscan', 'toscano', 'condiment']
      },
      {
        name: 'Artisanal Pasta Selection',
        description: 'Set of handmade pasta varieties including spaghetti, tagliatelle, and pappardelle from a small producer in Naples.',
        price: 14.99,
        imageUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Pasta & Risotto',
      tags: ['pasta', 'spaghetti', 'tagliatelle', 'pappardelle', 'handmade', 'artisanal', 'naples', 'napoli']
      },
      {
        name: 'Tiramisu Kit',
        description: 'Complete kit for making authentic tiramisu at home, including ladyfingers, mascarpone, and coffee.',
        price: 29.99,
        imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Pastries & Desserts',
      tags: ['tiramisu', 'dessert', 'dolce', 'mascarpone', 'coffee', 'caffè', 'ladyfingers', 'savoiardi']
      },
      {
        name: 'San Marzano Tomatoes',
        description: 'Authentic San Marzano tomatoes from Campania, perfect for making traditional Italian sauces.',
        price: 8.99,
        imageUrl: 'https://images.unsplash.com/photo-1594148394159-2ae1c34ab2e7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Sauces & Spreads',
      tags: ['tomatoes', 'pomodori', 'san marzano', 'campania', 'sauce', 'sugo', 'passata']
      },
      {
        name: 'Prosciutto di Parma',
        description: 'Aged 18 months, this prosciutto from Parma is delicately sliced and ready to serve.',
        price: 22.99,
        imageUrl: 'https://images.unsplash.com/photo-1619221882266-0d45843667ed?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Salumi & Cured Meats',
      tags: ['prosciutto', 'ham', 'parma', 'cured meat', 'salumi', 'charcuterie', 'antipasto']
      },
      {
        name: 'Chianti Classico',
        description: 'Premium Chianti Classico from Tuscany with notes of cherry and spice, perfect with pasta dishes.',
        price: 35.99,
        imageUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78a0b98?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Wines & Spirits',
      tags: ['wine', 'vino', 'chianti', 'tuscany', 'toscana', 'red wine', 'vino rosso', 'classico']
      },
      {
        name: 'Italian Espresso Beans',
        description: 'Dark roast espresso beans from a small roastery in Sicily, perfect for making authentic Italian coffee.',
        price: 15.99,
        imageUrl: 'https://images.unsplash.com/photo-1518057111178-44a106bad636?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
        category: 'Coffee & Beverages',
      tags: ['coffee', 'caffè', 'espresso', 'beans', 'sicily', 'sicilia', 'dark roast', 'italian coffee']
      },
    ];
    
  if (productCount === 0) {
    // Create new products if none exist
    for (const product of products) {
      await prisma.product.create({
        data: product,
      });
    }
    
    console.log(`Created ${products.length} products`);
  } else {
    // Update existing products with tags
    console.log('Updating existing products with tags...');
    
    // Get all existing products
    const existingProducts = await prisma.product.findMany();
    
    // Update each product with matching tags
    for (const existing of existingProducts) {
      const matchingProduct = products.find(p => p.name === existing.name);
      if (matchingProduct) {
        await prisma.product.update({
          where: { id: existing.id },
          data: { tags: matchingProduct.tags }
        });
        console.log(`Updated tags for: ${existing.name}`);
      }
    }
    
    console.log('Products updated successfully');
  }
  
  // Create sample FAQs
  const faqCount = await prisma.fAQ.count();
  if (faqCount === 0) {
    const faqs = [
      {
        question: 'Do you ship internationally?',
        answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary depending on the destination. Please check the shipping information during checkout.',
        category: 'Shipping & Delivery',
        tags: ['shipping', 'international', 'delivery', 'worldwide']
      },
      {
        question: 'How long does shipping take?',
        answer: 'Domestic orders typically arrive within 2-5 business days. International orders can take 7-14 business days depending on the destination country.',
        category: 'Shipping & Delivery',
        tags: ['shipping', 'delivery time', 'timeframe', 'domestic', 'international']
      },
      {
        question: 'What is your return policy?',
        answer: 'We accept returns within 30 days of purchase. Products must be unopened and in their original packaging. Please contact customer service to initiate a return.',
        category: 'Returns & Refunds',
        tags: ['returns', 'refunds', 'policy', '30 days', 'customer service']
      },
      {
        question: 'Are your products authentic Italian?',
        answer: 'Yes, all our products are sourced directly from Italian producers. Many of our products carry DOP or IGP certification, guaranteeing their authentic Italian origin.',
        category: 'Products',
        tags: ['authenticity', 'italian', 'origin', 'dop', 'igp', 'certification']
      },
      {
        question: 'How do I store olive oil properly?',
        answer: 'Olive oil should be stored in a cool, dark place away from heat and light. Avoid storing near the stove or in direct sunlight. Properly stored, olive oil can last up to 2 years unopened.',
        category: 'Product Care',
        tags: ['storage', 'olive oil', 'care', 'preservation', 'shelf life']
      },
      {
        question: 'Do you offer gift wrapping?',
        answer: 'Yes, we offer gift wrapping for an additional fee. You can select this option during checkout and include a personalized message.',
        category: 'Orders & Payments',
        tags: ['gift', 'wrapping', 'packaging', 'personalization', 'checkout']
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit cards, PayPal, Apple Pay, and Google Pay.',
        category: 'Orders & Payments',
        tags: ['payment', 'credit card', 'paypal', 'apple pay', 'google pay']
      },
      {
        question: 'How do I track my order?',
        answer: 'Once your order ships, you will receive a tracking number via email. You can also log into your account on our website to track your order status.',
        category: 'Shipping & Delivery',
        tags: ['tracking', 'order status', 'shipping', 'email', 'account']
      }
    ];
    
    for (const faq of faqs) {
      await prisma.fAQ.create({
        data: faq,
      });
    }
    
    console.log(`Created ${faqs.length} FAQs`);
  } else {
    // Update existing FAQs with tags
    console.log('Updating existing FAQs with tags...');
    
    const existingFAQs = await prisma.fAQ.findMany();
    const faqTags = {
      'Do you ship internationally?': ['shipping', 'international', 'delivery', 'worldwide'],
      'How long does shipping take?': ['shipping', 'delivery time', 'timeframe', 'domestic', 'international'],
      'What is your return policy?': ['returns', 'refunds', 'policy', '30 days', 'customer service'],
      'Are your products authentic Italian?': ['authenticity', 'italian', 'origin', 'dop', 'igp', 'certification'],
      'How do I store olive oil properly?': ['storage', 'olive oil', 'care', 'preservation', 'shelf life'],
      'Do you offer gift wrapping?': ['gift', 'wrapping', 'packaging', 'personalization', 'checkout'],
      'What payment methods do you accept?': ['payment', 'credit card', 'paypal', 'apple pay', 'google pay'],
      'How do I track my order?': ['tracking', 'order status', 'shipping', 'email', 'account']
    };
    
    for (const faq of existingFAQs) {
      const tags = faqTags[faq.question as keyof typeof faqTags] || [];
      if (tags.length > 0) {
        await prisma.fAQ.update({
          where: { id: faq.id },
          data: { tags }
        });
        console.log(`Updated tags for FAQ: ${faq.question}`);
      }
    }
  }
  
  // Create sample Services
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const services = [
      {
        name: 'Standard Delivery',
        description: 'Standard home delivery service with tracking. Your Italian products will be delivered within 3-5 business days.',
        price: 9.99,
        tags: ['delivery', 'standard', 'tracking', 'shipping']
      },
      {
        name: 'Express Delivery',
        description: 'Fast delivery service guaranteed within 24-48 hours. The perfect solution when you need your Italian products quickly.',
        price: 19.99,
        tags: ['delivery', 'express', 'fast', 'quick', 'urgent']
      },
      {
        name: 'Gift Package',
        description: 'Special gift wrapping service with customized message card. Perfect for sending Italian delicacies as gifts to friends and family.',
        price: 4.99,
        tags: ['gift', 'wrapping', 'packaging', 'message', 'personalization']
      },
      {
        name: 'Refrigerated Transport',
        description: 'Temperature-controlled shipping for perishable Italian products like cheese, cured meats, and fresh pasta. Ensures product quality during delivery.',
        price: 14.99,
        tags: ['refrigerated', 'temperature-controlled', 'perishable', 'fresh', 'quality']
      },
      {
        name: 'Shipping Insurance',
        description: 'Full coverage insurance for your valuable Italian products during transit. Covers damage, loss, or theft up to €500.',
        price: 6.99,
        tags: ['insurance', 'coverage', 'protection', 'damage', 'loss', 'theft']
      }
    ];
    
    for (const service of services) {
      await prisma.service.create({
        data: service,
      });
    }
    
    console.log(`Created ${services.length} services`);
  } else {
    // Update existing services with tags
    console.log('Updating existing services with tags...');
    
    const existingServices = await prisma.service.findMany();
    const serviceTags = {
      'Standard Delivery': ['delivery', 'standard', 'tracking', 'shipping'],
      'Express Delivery': ['delivery', 'express', 'fast', 'quick', 'urgent'],
      'Gift Package': ['gift', 'wrapping', 'packaging', 'message', 'personalization'],
      'Refrigerated Transport': ['refrigerated', 'temperature-controlled', 'perishable', 'fresh', 'quality'],
      'Shipping Insurance': ['insurance', 'coverage', 'protection', 'damage', 'loss', 'theft']
    };
    
    for (const service of existingServices) {
      const tags = serviceTags[service.name as keyof typeof serviceTags] || [];
      if (tags.length > 0) {
        await prisma.service.update({
          where: { id: service.id },
          data: { tags }
        });
        console.log(`Updated tags for service: ${service.name}`);
      }
    }
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