import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.documentChunk.deleteMany();
  await prisma.document.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.agentConfig.deleteMany();
  await prisma.user.deleteMany();
  await prisma.service.deleteMany();
  await prisma.fAQ.deleteMany();
  await prisma.product.deleteMany();

  // Seed products
  const products = [
    {
      name: 'Barolo DOCG 2018',
      description: 'Premium red wine from Piedmont region, aged in oak barrels for 24 months.',
      price: 45.99,
      category: 'Wine',
      stock: 25,
      imageUrl: '/images/barolo-docg.jpg',
      isActive: true,
      tags: ['wine', 'red', 'premium', 'piedmont', 'docg', 'barolo'],
      origin: 'Piedmont, Italy',
      alcoholContent: 14.5,
      vintage: 2018
    },
    {
      name: 'Chianti Classico DOCG 2020',
      description: 'Traditional Tuscan red wine with notes of cherry and herbs.',
      price: 28.50,
      category: 'Wine',
      stock: 40,
      imageUrl: '/images/chianti-classico.jpg',
      isActive: true,
      tags: ['wine', 'red', 'chianti', 'tuscany', 'docg', 'classic'],
      origin: 'Tuscany, Italy',
      alcoholContent: 13.5,
      vintage: 2020
    },
    {
      name: 'Prosecco di Valdobbiadene DOCG',
      description: 'Sparkling wine from Veneto with fresh and fruity notes.',
      price: 18.75,
      category: 'Wine',
      stock: 60,
      imageUrl: '/images/prosecco-valdobbiadene.jpg',
      isActive: true,
      tags: ['wine', 'sparkling', 'prosecco', 'veneto', 'docg', 'fresh'],
      origin: 'Veneto, Italy',
      alcoholContent: 11.0,
      vintage: 2022
    },
    {
      name: 'Amarone della Valpolicella DOCG 2017',
      description: 'Full-bodied red wine made from dried grapes, complex and intense.',
      price: 65.00,
      category: 'Wine',
      stock: 15,
      imageUrl: '/images/amarone-valpolicella.jpg',
      isActive: true,
      tags: ['wine', 'red', 'amarone', 'valpolicella', 'docg', 'premium'],
      origin: 'Veneto, Italy',
      alcoholContent: 15.5,
      vintage: 2017
    },
    {
      name: 'Pinot Grigio delle Venezie DOC 2022',
      description: 'Light and crisp white wine, perfect as an aperitif.',
      price: 12.90,
      category: 'Wine',
      stock: 80,
      imageUrl: '/images/pinot-grigio-venezie.jpg',
      isActive: true,
      tags: ['wine', 'white', 'pinot grigio', 'venezie', 'doc', 'light'],
      origin: 'Veneto, Italy',
      alcoholContent: 12.0,
      vintage: 2022
    },
    {
      name: 'Brunello di Montalcino DOCG 2018',
      description: 'Prestigious Tuscan red wine, aged for at least 5 years.',
      price: 85.00,
      category: 'Wine',
      stock: 12,
      imageUrl: '/images/brunello-montalcino.jpg',
      isActive: true,
      tags: ['wine', 'red', 'brunello', 'montalcino', 'docg', 'prestigious'],
      origin: 'Tuscany, Italy',
      alcoholContent: 14.0,
      vintage: 2018
    },
    {
      name: 'Parmigiano Reggiano DOP 24 months',
      description: 'Authentic Parmigiano Reggiano cheese aged for 24 months.',
      price: 32.50,
      category: 'Cheese',
      stock: 30,
      imageUrl: '/images/parmigiano-reggiano-24.jpg',
      isActive: true,
      tags: ['cheese', 'parmigiano', 'reggiano', 'dop', 'aged', 'authentic'],
      origin: 'Emilia-Romagna, Italy'
    },
    {
      name: 'Gorgonzola DOP Dolce',
      description: 'Creamy blue cheese from Lombardy, sweet and delicate.',
      price: 18.90,
      category: 'Cheese',
      stock: 25,
      imageUrl: '/images/gorgonzola-dolce.jpg',
      isActive: true,
      tags: ['cheese', 'gorgonzola', 'blue', 'dop', 'creamy', 'lombardy'],
      origin: 'Lombardy, Italy'
    },
    {
      name: 'Prosciutto di Parma DOP',
      description: 'Traditional cured ham from Parma, aged for 18 months.',
      price: 45.00,
      category: 'Cured Meat',
      stock: 20,
      imageUrl: '/images/prosciutto-parma.jpg',
      isActive: true,
      tags: ['meat', 'prosciutto', 'parma', 'dop', 'cured', 'traditional'],
      origin: 'Emilia-Romagna, Italy'
    },
    {
      name: 'Extra Virgin Olive Oil Toscano IGP',
      description: 'Premium extra virgin olive oil from Tuscany.',
      price: 24.50,
      category: 'Oil',
      stock: 50,
      imageUrl: '/images/olive-oil-toscano.jpg',
      isActive: true,
      tags: ['oil', 'olive', 'extra virgin', 'toscano', 'igp', 'premium'],
      origin: 'Tuscany, Italy'
    },
    {
      name: 'Pasta di Gragnano IGP - Spaghetti',
      description: 'Traditional pasta from Gragnano, bronze-drawn and slow-dried.',
      price: 8.50,
      category: 'Pasta',
      stock: 100,
      imageUrl: '/images/pasta-gragnano-spaghetti.jpg',
      isActive: true,
      tags: ['pasta', 'gragnano', 'igp', 'spaghetti', 'bronze', 'traditional'],
      origin: 'Campania, Italy'
    },
    {
      name: 'Gnocchi di Patate',
      description: 'Fresh potato gnocchi, ready to cook.',
      price: 6.90,
      category: 'Pasta',
      stock: 35,
      imageUrl: '/images/gnocchi-patate.jpg',
      isActive: true,
      tags: ['pasta', 'gnocchi', 'potato', 'fresh', 'ready'],
      origin: 'Italy'
    },
    {
      name: 'Risotto Rice Carnaroli',
      description: 'Premium Carnaroli rice, perfect for risotto.',
      price: 12.00,
      category: 'Rice',
      stock: 45,
      imageUrl: '/images/rice-carnaroli.jpg',
      isActive: true,
      tags: ['rice', 'carnaroli', 'risotto', 'premium', 'italian'],
      origin: 'Piedmont, Italy'
    },
    {
      name: 'Balsamic Vinegar of Modena IGP',
      description: 'Traditional balsamic vinegar aged in wooden barrels.',
      price: 16.75,
      category: 'Vinegar',
      stock: 40,
      imageUrl: '/images/balsamic-modena.jpg',
      isActive: true,
      tags: ['vinegar', 'balsamic', 'modena', 'igp', 'aged', 'traditional'],
      origin: 'Emilia-Romagna, Italy'
    },
    {
      name: 'Limoncello di Sorrento',
      description: 'Traditional lemon liqueur from the Amalfi Coast.',
      price: 22.00,
      category: 'Liqueur',
      stock: 30,
      imageUrl: '/images/limoncello-sorrento.jpg',
      isActive: true,
      tags: ['liqueur', 'limoncello', 'sorrento', 'lemon', 'traditional', 'amalfi'],
      origin: 'Campania, Italy',
      alcoholContent: 30.0
    }
  ];

  await prisma.product.createMany({ data: products });

  // Seed FAQs
  const faqs = [
    {
      question: 'What are your shipping times?',
      answer: 'We offer different shipping options: Standard shipping (5-7 business days), Express shipping (2-3 business days), and Premium shipping (1-2 business days). All orders are processed within 24 hours.',
      category: 'Shipping',
      isActive: true,
      tags: ['shipping', 'delivery', 'times', 'standard', 'express', 'premium']
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most countries worldwide. International shipping times vary by destination: EU countries (3-5 business days), North America (7-10 business days), Other countries (10-15 business days). Additional customs fees may apply.',
      category: 'Shipping',
      isActive: true,
      tags: ['international', 'shipping', 'worldwide', 'eu', 'customs', 'delivery']
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. All payments are processed securely through our encrypted payment system.',
      category: 'Payment',
      isActive: true,
      tags: ['payment', 'credit card', 'paypal', 'apple pay', 'google pay', 'bank transfer']
    },
    {
      question: 'How do you package wine bottles?',
      answer: 'All wine bottles are carefully packaged in protective foam inserts and sturdy cardboard boxes. For orders of 6+ bottles, we use specialized wine shipping boxes with dividers. We guarantee safe delivery or full replacement.',
      category: 'Packaging',
      isActive: true,
      tags: ['wine', 'packaging', 'protection', 'foam', 'shipping', 'bottles']
    },
    {
      question: 'What is your return policy?',
      answer: 'We offer a 30-day return policy for unopened products. Wine and perishable items can be returned only if damaged during shipping. Return shipping costs are covered by us for defective items.',
      category: 'Returns',
      isActive: true,
      tags: ['returns', 'policy', '30 days', 'unopened', 'damaged', 'defective']
    },
    {
      question: 'Do you offer bulk discounts?',
      answer: 'Yes! We offer volume discounts: 5% off orders over €200, 10% off orders over €500, 15% off orders over €1000. Corporate customers can contact us for special pricing.',
      category: 'Pricing',
      isActive: true,
      tags: ['bulk', 'discount', 'volume', 'corporate', 'pricing', 'special']
    },
    {
      question: 'How do you ensure product authenticity?',
      answer: 'All our products are sourced directly from certified Italian producers. We maintain strict quality control and provide certificates of authenticity for premium items like DOP and DOCG products.',
      category: 'Quality',
      isActive: true,
      tags: ['authenticity', 'quality', 'certified', 'producers', 'dop', 'docg']
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes, once your order ships, you will receive a tracking number via email. You can track your package in real-time through our website or the carrier\'s tracking system.',
      category: 'Shipping',
      isActive: true,
      tags: ['tracking', 'order', 'email', 'real-time', 'carrier', 'package']
    },
    {
      question: 'Do you have a customer loyalty program?',
      answer: 'Yes! Our "Gusto Club" loyalty program offers points for every purchase, exclusive discounts, early access to new products, and special member-only events.',
      category: 'Loyalty',
      isActive: true,
      tags: ['loyalty', 'gusto club', 'points', 'discounts', 'exclusive', 'events']
    },
    {
      question: 'What temperature should wine be stored at?',
      answer: 'Red wines should be stored at 12-18°C, white wines at 8-12°C, and sparkling wines at 6-10°C. Keep bottles horizontal in a dark, humid environment away from vibrations.',
      category: 'Wine Care',
      isActive: true,
      tags: ['wine', 'storage', 'temperature', 'red', 'white', 'sparkling', 'care']
    }
  ];

  await prisma.fAQ.createMany({ data: faqs });

  // Seed services
  const services = [
    {
      name: 'Wine Tasting Experience',
      description: 'Professional wine tasting session with our sommelier, including 6 premium Italian wines with detailed explanations of origin, production methods, and tasting notes.',
      price: 75.00,
      duration: 120,
      isActive: true,
      category: 'Experience',
      tags: ['wine', 'tasting', 'sommelier', 'premium', 'experience', 'education']
    },
    {
      name: 'Italian Cooking Class',
      description: 'Learn to cook authentic Italian dishes with our chef. Includes hands-on preparation of pasta, risotto, and traditional sauces using our premium ingredients.',
      price: 95.00,
      duration: 180,
      isActive: true,
      category: 'Cooking',
      tags: ['cooking', 'class', 'chef', 'pasta', 'risotto', 'authentic', 'hands-on']
    },
    {
      name: 'Cheese & Wine Pairing',
      description: 'Discover the perfect combinations of Italian cheeses and wines. Guided tasting of 5 cheese varieties paired with complementary wines.',
      price: 65.00,
      duration: 90,
      isActive: true,
      category: 'Pairing',
      tags: ['cheese', 'wine', 'pairing', 'tasting', 'guided', 'combinations']
    },
    {
      name: 'Premium Gift Wrapping',
      description: 'Elegant gift wrapping service with premium Italian paper, ribbons, and personalized cards. Perfect for special occasions.',
      price: 12.50,
      duration: 15,
      isActive: true,
      category: 'Gift',
      tags: ['gift', 'wrapping', 'premium', 'elegant', 'personalized', 'special']
    },
    {
      name: 'Personal Shopping Consultation',
      description: 'One-on-one consultation with our Italian food expert to create a personalized selection based on your preferences and dietary requirements.',
      price: 45.00,
      duration: 60,
      isActive: true,
      category: 'Consultation',
      tags: ['personal', 'shopping', 'consultation', 'expert', 'personalized', 'dietary']
    },
    {
      name: 'Corporate Catering',
      description: 'Professional catering service for corporate events featuring authentic Italian cuisine and premium wine selection.',
      price: 150.00,
      duration: 240,
      isActive: true,
      category: 'Catering',
      tags: ['corporate', 'catering', 'events', 'authentic', 'cuisine', 'professional']
    }
  ];

  await prisma.service.createMany({ data: services });

  // Seed admin user
  const hashedPassword = await bcrypt.hash('password123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@shopmefy.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    }
  });

  // Seed agent configuration
  await prisma.agentConfig.create({
    data: {
      prompt: `You are Sofia, an expert in Italian products and cuisine at ShopMefy, a premium Italian food and wine e-commerce platform.

PERSONALITY & TONE:
- Warm, knowledgeable, and passionate about Italian culture
- Professional yet friendly, like a trusted Italian food expert
- Use occasional Italian words naturally (ciao, grazie, prego, etc.)
- Show enthusiasm for quality Italian products

CORE KNOWLEDGE:
- Expert in Italian wines (DOCG, DOC, IGP classifications)
- Deep knowledge of Italian cheeses, cured meats, and regional specialties
- Understanding of Italian food culture and traditions
- Wine and food pairing expertise

RESPONSE GUIDELINES:
1. Always be helpful and informative
2. Provide specific product recommendations when relevant
3. Share interesting facts about Italian food culture
4. Use the available functions to search for products, services, FAQs, and documents
5. If you don't have specific information, use the search functions to find relevant data
6. Always respond in the same language as the user's question

AVAILABLE FUNCTIONS:
- getProducts: Search for products by name, category, price range, etc.
- getServices: Find available services like wine tastings, cooking classes
- getFAQs: Search frequently asked questions about shipping, payments, etc.
- getCompanyInfo: Get company profile and contact information
- getDocuments: Search uploaded documents for specific information
- OrderCompleted: Process completed orders with customer details

Remember: You represent a premium Italian food brand, so maintain high standards and showcase the authenticity and quality of Italian products.`,
      model: 'gpt-4-turbo',
      temperature: 0.7,
      maxTokens: 500,
      topP: 0.9
    }
  });

  // Seed profile
  await prisma.profile.create({
    data: {
      username: 'shopmefy',
      companyName: 'ShopMefy - Authentic Italian Foods',
      description: 'Premium Italian food and wine e-commerce platform offering authentic products directly from certified Italian producers.',
      address: 'Via Roma 123, 20121 Milano, Italy',
      phoneNumber: '+39 02 1234 5678',
      email: 'info@shopmefy.com',
      website: 'https://www.shopmefy.com',
      openingTime: 'Monday-Friday: 9:00-18:00, Saturday: 9:00-13:00',
      sector: 'Premium Italian Food E-commerce'
    }
  });

  // Seed documents
  try {
    const sampleDocPath = path.join(__dirname, 'sample-documents', 'international-transportation-law.pdf');
    
    if (!fs.existsSync(sampleDocPath)) {
      return;
    }

    const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const targetFilename = `international-transportation-law-${Date.now()}.pdf`;
    const uploadPath = path.join(uploadsDir, targetFilename);
    
    fs.copyFileSync(sampleDocPath, uploadPath);
    
    const stats = fs.statSync(uploadPath);
    
    const document = await prisma.document.create({
      data: {
        filename: targetFilename,
        originalName: 'international-transportation-law.pdf',
        title: 'International Transportation Law',
        mimeType: 'application/pdf',
        size: stats.size,
        uploadPath: uploadPath,
        status: 'COMPLETED',
        metadata: JSON.stringify({
          pages: 1,
          language: 'en',
          keywords: ['transportation', 'international', 'law', 'delivery', 'regulations'],
          description: 'Legal framework for international transportation and delivery regulations'
        })
      }
    });
  } catch (e) {
    // Ignore document seeding errors
  }
}

main()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 