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
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'red', 'premium', 'piedmont', 'docg', 'barolo'])
    },
    {
      name: 'Chianti Classico DOCG 2020',
      description: 'Traditional Tuscan red wine with notes of cherry and herbs.',
      price: 28.50,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'red', 'chianti', 'tuscany', 'docg', 'classic'])
    },
    {
      name: 'Prosecco di Valdobbiadene DOCG',
      description: 'Sparkling wine from Veneto with fresh and fruity notes.',
      price: 18.75,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'sparkling', 'prosecco', 'veneto', 'docg', 'fresh'])
    },
    {
      name: 'Amarone della Valpolicella DOCG 2017',
      description: 'Full-bodied red wine made from dried grapes, complex and intense.',
      price: 65.00,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'red', 'amarone', 'valpolicella', 'docg', 'premium'])
    },
    {
      name: 'Pinot Grigio delle Venezie DOC 2022',
      description: 'Light and crisp white wine, perfect as an aperitif.',
      price: 12.90,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'white', 'pinot grigio', 'venezie', 'doc', 'light'])
    },
    {
      name: 'Brunello di Montalcino DOCG 2018',
      description: 'Prestigious Tuscan red wine, aged for at least 5 years.',
      price: 85.00,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['wine', 'red', 'brunello', 'montalcino', 'docg', 'prestigious'])
    },
    {
      name: 'Parmigiano Reggiano DOP 24 months',
      description: 'Authentic Parmigiano Reggiano cheese aged for 24 months.',
      price: 32.50,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['cheese', 'parmigiano', 'reggiano', 'dop', 'aged', 'authentic'])
    },
    {
      name: 'Gorgonzola DOP Dolce',
      description: 'Creamy blue cheese from Lombardy, sweet and delicate.',
      price: 18.90,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['cheese', 'gorgonzola', 'blue', 'dop', 'creamy', 'lombardy'])
    },
    {
      name: 'Prosciutto di Parma DOP',
      description: 'Traditional cured ham from Parma, aged for 18 months.',
      price: 45.00,
      category: 'Cured Meat',
      isActive: true,
      tagsJson: JSON.stringify(['meat', 'prosciutto', 'parma', 'dop', 'cured', 'traditional'])
    },
    {
      name: 'Extra Virgin Olive Oil Toscano IGP',
      description: 'Premium extra virgin olive oil from Tuscany.',
      price: 24.50,
      category: 'Oil',
      isActive: true,
      tagsJson: JSON.stringify(['oil', 'olive', 'extra virgin', 'toscano', 'igp', 'premium'])
    },
    {
      name: 'Pasta di Gragnano IGP - Spaghetti',
      description: 'Traditional pasta from Gragnano, bronze-drawn and slow-dried.',
      price: 8.50,
      category: 'Pasta',
      isActive: true,
      tagsJson: JSON.stringify(['pasta', 'gragnano', 'igp', 'spaghetti', 'bronze', 'traditional'])
    },
    {
      name: 'Gnocchi di Patate',
      description: 'Fresh potato gnocchi, ready to cook.',
      price: 6.90,
      category: 'Pasta',
      isActive: true,
      tagsJson: JSON.stringify(['pasta', 'gnocchi', 'potato', 'fresh', 'ready'])
    },
    {
      name: 'Risotto Rice Carnaroli',
      description: 'Premium Carnaroli rice, perfect for risotto.',
      price: 12.00,
      category: 'Rice',
      isActive: true,
      tagsJson: JSON.stringify(['rice', 'carnaroli', 'risotto', 'premium', 'italian'])
    },
    {
      name: 'Balsamic Vinegar of Modena IGP',
      description: 'Traditional balsamic vinegar aged in wooden barrels.',
      price: 16.75,
      category: 'Vinegar',
      isActive: true,
      tagsJson: JSON.stringify(['vinegar', 'balsamic', 'modena', 'igp', 'aged', 'traditional'])
    },
    {
      name: 'Limoncello di Sorrento',
      description: 'Traditional lemon liqueur from the Amalfi Coast.',
      price: 22.00,
      category: 'Liqueur',
      isActive: true,
      tagsJson: JSON.stringify(['liqueur', 'limoncello', 'sorrento', 'lemon', 'traditional', 'amalfi'])
    }
  ];

  await prisma.product.createMany({ data: products });

  // Seed FAQs
  const faqs = [
    {
      question: 'What are your shipping options?',
      answer: 'We offer standard shipping (3-5 business days) for €5.99, express shipping (1-2 business days) for €12.99, and free shipping on orders over €75.',
      isActive: true
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes, we ship to most European countries. International shipping costs vary by destination and are calculated at checkout.',
      isActive: true
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers.',
      isActive: true
    },
    {
      question: 'How do I store wine properly?',
      answer: 'Store wine in a cool, dark place at 12-15°C with consistent temperature. Keep bottles horizontal to keep the cork moist.',
      isActive: true
    },
    {
      question: 'What is the difference between DOCG and DOC wines?',
      answer: 'DOCG (Denominazione di Origine Controllata e Garantita) is the highest Italian wine classification, with stricter regulations than DOC (Denominazione di Origine Controllata).',
      isActive: true
    },
    {
      question: 'Can I return products if I\'m not satisfied?',
      answer: 'Yes, we offer a 30-day return policy for unopened products. Wine returns are accepted only if the product is defective.',
      isActive: true
    },
    {
      question: 'Do you offer wine tastings?',
      answer: 'Yes, we offer guided wine tasting experiences with our sommelier. Check our services section for available dates and booking.',
      isActive: true
    },
    {
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days, express shipping takes 1-2 business days. International orders may take 5-10 business days.',
      isActive: true
    },
    {
      question: 'Are your products authentic Italian?',
      answer: 'Yes, all our products are sourced directly from certified Italian producers and come with authenticity guarantees.',
      isActive: true
    },
    {
      question: 'Do you have a minimum order amount?',
      answer: 'No minimum order amount required. However, orders over €75 qualify for free shipping.',
      isActive: true
    },
    {
      question: 'Can I track my order?',
      answer: 'Yes, once your order ships, you will receive a tracking number via email. You can track your package in real-time through our website or the carrier\'s tracking system.',
      isActive: true
    },
    {
      question: 'Do you have a customer loyalty program?',
      answer: 'Yes! Our "Gusto Club" loyalty program offers points for every purchase, exclusive discounts, early access to new products, and special member-only events.',
      isActive: true
    },
    {
      question: 'What temperature should wine be stored at?',
      answer: 'Red wines should be stored at 12-18°C, white wines at 8-12°C, and sparkling wines at 6-10°C. Keep bottles horizontal in a dark, humid environment away from vibrations.',
      isActive: true
    }
  ];

  await prisma.fAQ.createMany({ data: faqs });

  // Seed services
  const services = [
    {
      name: 'Wine Tasting Experience',
      description: 'Professional wine tasting session with our sommelier, including 6 premium Italian wines with detailed explanations of origin, production methods, and tasting notes.',
      price: 75.00,
      isActive: true
    },
    {
      name: 'Italian Cooking Class',
      description: 'Learn to cook authentic Italian dishes with our chef. Includes hands-on preparation of pasta, risotto, and traditional sauces using our premium ingredients.',
      price: 95.00,
      isActive: true
    },
    {
      name: 'Cheese & Wine Pairing',
      description: 'Discover the perfect combinations of Italian cheeses and wines. Guided tasting of 5 cheese varieties paired with complementary wines.',
      price: 65.00,
      isActive: true
    },
    {
      name: 'Premium Gift Wrapping',
      description: 'Elegant gift wrapping service with premium Italian paper, ribbons, and personalized cards. Perfect for special occasions.',
      price: 12.50,
      isActive: true
    },
    {
      name: 'Personal Shopping Consultation',
      description: 'One-on-one consultation with our Italian food expert to create a personalized selection based on your preferences and dietary requirements.',
      price: 45.00,
      isActive: true
    },
    {
      name: 'Corporate Catering',
      description: 'Professional catering service for corporate events featuring authentic Italian cuisine and premium wine selection.',
      price: 150.00,
      isActive: true
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
      model: 'openai/gpt-4o-mini',
      temperature: 0.3,
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

    const targetFilename = 'international-transportation-law.pdf';
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