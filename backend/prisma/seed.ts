import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

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

  // Seed profile
  await seedProfile();

  // Seed documents
  await seedDocuments();

  console.log('✅ Database seeding completed successfully!');
}

async function seedProducts() {
  // Delete existing products
  await prisma.product.deleteMany({});
  
  // Create new products - 20 Italian products
  const products = [
    {
      name: 'Parmigiano Reggiano DOP 24 Months',
      description: 'Authentic Italian Parmigiano Reggiano aged for 24 months from Emilia-Romagna. Perfect for grating over pasta or enjoying with a good wine. Rich, nutty flavor with crystalline texture.',
      price: 15.90,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cheese', 'premium', 'dop', 'aged', 'emilia-romagna'])
    },
    {
      name: 'Extra Virgin Olive Oil Toscano IGP',
      description: 'Cold-pressed Italian olive oil from Tuscany hills. Fruity and slightly peppery with notes of artichoke and almond. Perfect for salads and finishing dishes.',
      price: 12.50,
      category: 'Oils',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'oil', 'premium', 'tuscany', 'igp', 'cold-pressed'])
    },
    {
      name: 'Aceto Balsamico di Modena IGP',
      description: 'Traditional balsamic vinegar aged in wooden barrels for at least 12 years. Sweet and tangy with complex flavors. Perfect for salads, cheese, and desserts.',
      price: 18.75,
      category: 'Vinegars',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'vinegar', 'premium', 'modena', 'igp', 'aged'])
    },
    {
      name: 'Spaghetti di Gragnano IGP',
      description: 'Bronze-drawn spaghetti from Gragnano, the pasta capital of Italy. Rough texture holds sauce perfectly. Made with durum wheat semolina.',
      price: 3.25,
      category: 'Pasta',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'pasta', 'gragnano', 'igp', 'bronze-drawn', 'durum-wheat'])
    },
    {
      name: 'Prosciutto di Parma DOP',
      description: 'Authentic Parma ham aged for 18 months. Sweet, delicate flavor with perfect marbling. Sliced to order for maximum freshness.',
      price: 24.90,
      category: 'Cured Meats',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cured-meat', 'premium', 'parma', 'dop', 'aged'])
    },
    {
      name: 'Gorgonzola DOP Dolce',
      description: 'Creamy blue cheese from Lombardy with mild, sweet flavor. Perfect for risottos, pizza, or paired with honey and walnuts.',
      price: 8.90,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cheese', 'blue-cheese', 'lombardy', 'dop', 'creamy'])
    },
    {
      name: 'Chianti Classico DOCG',
      description: 'Premium red wine from Tuscany made with Sangiovese grapes. Full-bodied with notes of cherry, violet, and spice. Perfect with red meat and aged cheeses.',
      price: 19.50,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'wine', 'red', 'tuscany', 'docg', 'sangiovese'])
    },
    {
      name: 'Mozzarella di Bufala Campana DOP',
      description: 'Fresh buffalo mozzarella from Campania. Creamy texture with delicate, slightly tangy flavor. Best enjoyed within 2-3 days.',
      price: 6.75,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cheese', 'fresh', 'campania', 'dop', 'buffalo'])
    },
    {
      name: 'Risotto Carnaroli Rice',
      description: 'Premium Italian rice variety perfect for risotto. High starch content creates creamy texture while maintaining firm bite. From Piedmont region.',
      price: 4.50,
      category: 'Rice & Grains',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'rice', 'carnaroli', 'risotto', 'piedmont', 'premium'])
    },
    {
      name: 'Nduja Calabrese Piccante',
      description: 'Spicy spreadable salami from Calabria. Made with pork and Calabrian chilies. Perfect on bread, pizza, or to add heat to pasta dishes.',
      price: 7.25,
      category: 'Cured Meats',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cured-meat', 'spicy', 'calabria', 'spreadable', 'chili'])
    },
    {
      name: 'Pecorino Romano DOP',
      description: 'Sharp, salty sheep cheese from Lazio. Aged for 8 months. Essential for authentic Cacio e Pepe and Carbonara. Grated fresh to order.',
      price: 11.80,
      category: 'Cheese',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cheese', 'sheep', 'lazio', 'dop', 'sharp'])
    },
    {
      name: 'Limoncello di Sorrento IGP',
      description: 'Traditional lemon liqueur from Sorrento lemons. Sweet and aromatic, perfect as digestif. Serve chilled in small glasses.',
      price: 16.90,
      category: 'Spirits',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'liqueur', 'lemon', 'sorrento', 'igp', 'digestif'])
    },
    {
      name: 'Tagliatelle all\'Uovo',
      description: 'Fresh egg pasta from Emilia-Romagna. Made with semolina flour and farm eggs. Perfect with ragù Bolognese or truffle sauce.',
      price: 5.20,
      category: 'Pasta',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'pasta', 'fresh', 'egg', 'emilia-romagna', 'tagliatelle'])
    },
    {
      name: 'Amaretto di Saronno',
      description: 'Traditional almond liqueur from Lombardy. Sweet with bitter almond notes. Perfect for desserts or as after-dinner drink.',
      price: 21.50,
      category: 'Spirits',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'liqueur', 'almond', 'lombardy', 'sweet', 'traditional'])
    },
    {
      name: 'Bresaola della Valtellina IGP',
      description: 'Air-dried beef from Alpine valleys. Lean, tender, and flavorful. Served thinly sliced with lemon, olive oil, and arugula.',
      price: 18.90,
      category: 'Cured Meats',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cured-meat', 'beef', 'valtellina', 'igp', 'alpine'])
    },
    {
      name: 'Barolo DOCG',
      description: 'King of Italian wines from Piedmont. Made with Nebbiolo grapes. Full-bodied with complex tannins and notes of rose, tar, and cherry.',
      price: 45.00,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'wine', 'red', 'piedmont', 'docg', 'nebbiolo', 'premium'])
    },
    {
      name: 'Mortadella di Bologna IGP',
      description: 'Traditional pork cold cut from Bologna with pistachios. Smooth texture with delicate flavor. Perfect for sandwiches or antipasti.',
      price: 9.75,
      category: 'Cured Meats',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'cured-meat', 'pork', 'bologna', 'igp', 'pistachios'])
    },
    {
      name: 'Gnocchi di Patate',
      description: 'Traditional potato dumplings from Northern Italy. Made with potatoes, flour, and eggs. Perfect with sage butter or tomato sauce.',
      price: 4.80,
      category: 'Pasta',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'pasta', 'potato', 'dumplings', 'northern-italy', 'traditional'])
    },
    {
      name: 'Prosecco di Valdobbiadene DOCG',
      description: 'Premium sparkling wine from Veneto. Crisp and fresh with notes of apple, pear, and citrus. Perfect for celebrations and aperitifs.',
      price: 13.90,
      category: 'Wine',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'wine', 'sparkling', 'veneto', 'docg', 'aperitif'])
    },
    {
      name: 'Tartufo Nero Estivo',
      description: 'Summer black truffles from Umbria. Earthy, aromatic flavor perfect for pasta, risotto, and eggs. Preserved in olive oil.',
      price: 32.50,
      category: 'Specialty',
      isActive: true,
      tagsJson: JSON.stringify(['italian', 'truffle', 'black', 'umbria', 'luxury', 'preserved'])
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
  await prisma.fAQ.deleteMany({});
  
  // Create new FAQs - 12 comprehensive FAQs
  const faqs = [
    {
      question: 'What are your shipping costs?',
      answer: 'We offer free shipping on orders over €50. For orders under €50, shipping costs are €5.99 within Italy and €12.99 for international orders to EU countries. Shipping to non-EU countries starts at €19.99.',
      isActive: true
    },
    {
      question: 'How long does shipping take?',
      answer: 'Orders within Italy are delivered in 1-3 business days. EU countries receive orders in 3-5 business days. International shipping to non-EU countries takes 5-10 business days. Express shipping options are available.',
      isActive: true
    },
    {
      question: 'Do you ship internationally?',
      answer: 'Yes! We ship to over 50 countries worldwide. Shipping costs vary by destination. Some products may have restrictions due to customs regulations. Contact us for specific country information.',
      isActive: true
    },
    {
      question: 'What is your return policy?',
      answer: 'We accept returns within 30 days of delivery for non-perishable items in original packaging. Perishable items can only be returned if damaged or defective. Return shipping costs are covered by us for defective items.',
      isActive: true
    },
    {
      question: 'How do I return an item?',
      answer: 'Contact our customer service team at support@gustoitaliano.com with your order number. We\'ll provide a return authorization and prepaid shipping label for eligible items. Refunds are processed within 5-7 business days.',
      isActive: true
    },
    {
      question: 'Can I exchange an item?',
      answer: 'Yes, exchanges are possible for non-perishable items within 30 days. The replacement item must be of equal or lesser value. If the new item costs more, you\'ll pay the difference. Contact us to arrange an exchange.',
      isActive: true
    },
    {
      question: 'Are your products authentic?',
      answer: 'Absolutely! We work directly with certified Italian producers and importers. All our DOP, IGP, and DOCG products come with authenticity certificates. We guarantee the origin and quality of every item we sell.',
      isActive: true
    },
    {
      question: 'How should I store my Italian products?',
      answer: 'Storage varies by product type. Dry goods should be kept in a cool, dry place. Cheeses need refrigeration and should be wrapped in cheese paper. Wines should be stored horizontally in a cool, dark place. Check individual product pages for specific storage instructions.',
      isActive: true
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, Apple Pay, Google Pay, and bank transfers. For orders over €200, we also offer payment in 3 installments through Klarna.',
      isActive: true
    },
    {
      question: 'Do you have a loyalty program?',
      answer: 'Yes! Our "Gusto Club" loyalty program gives you 1 point for every €1 spent. Collect 100 points to get a €5 discount. Members also receive exclusive offers, early access to new products, and invitations to special events.',
      isActive: true
    },
    {
      question: 'Can you create custom gift baskets?',
      answer: 'Absolutely! Our Personal Shopping Service can create custom gift baskets tailored to any preference or budget. Choose from our curated selections or let us create something unique. Perfect for corporate gifts or special occasions.',
      isActive: true
    },
    {
      question: 'How fresh are your products?',
      answer: 'We receive fresh deliveries from Italy 2-3 times per week. All products have clear expiration dates, and we guarantee at least 75% of shelf life remaining on delivery. Fresh items like mozzarella are shipped the same day they arrive from Italy.',
      isActive: true
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
  
  // Create new services - 7 comprehensive services
  const services = [
    {
      name: 'Italian Cooking Class',
      description: 'Learn the secrets of traditional Italian cooking from our expert chefs. Classes are held weekly and include all ingredients and equipment. Choose from pasta making, risotto mastery, or regional specialties.',
      price: 79.99,
      isActive: true
    },
    {
      name: 'Cheese & Wine Tasting',
      description: 'Guided tasting of 5 premium Italian cheeses paired with complementary wines. Learn about terroir, aging processes, and perfect pairings. Perfect for a date night or gathering with friends.',
      price: 49.99,
      isActive: true
    },
    {
      name: 'Corporate Gift Baskets',
      description: 'Custom gift baskets for corporate clients. Choose from our selection of premium Italian products or create a custom selection. Includes elegant packaging and personalized cards.',
      price: 129.99,
      isActive: true
    },
    {
      name: 'Personal Shopping Service',
      description: 'Let our Italian food experts curate a personalized selection based on your preferences and dietary requirements. Includes detailed product information and serving suggestions.',
      price: 25.00,
      isActive: true
    },
    {
      name: 'Monthly Italian Delicacies Box',
      description: 'Subscription service featuring 6-8 carefully selected Italian products each month. Discover new regions, producers, and seasonal specialties. Cancel anytime.',
      price: 59.99,
      isActive: true
    },
    {
      name: 'Virtual Cooking Workshop',
      description: 'Online cooking classes with live instruction from Italian chefs. Ingredient kits shipped to your door. Interactive sessions with Q&A. Available in English and Italian.',
      price: 39.99,
      isActive: true
    },
    {
      name: 'Italian Food & Culture Tour Planning',
      description: 'Comprehensive planning service for food tours in Italy. Includes restaurant recommendations, market visits, cooking class bookings, and cultural insights from our Italian partners.',
      price: 199.99,
      isActive: true
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
  const agentConfig = await prisma.agentConfig.create({
    data: {
      temperature: 0.7,
      maxTokens: 500,
      topP: 0.9,
      model: 'openai/gpt-4o-mini',
      prompt: `You are Sofia, the friendly virtual assistant for Gusto Italiano, an Italian specialty foods store.

YOUR IDENTITY:
- You are passionate about authentic Italian cuisine and culture
- You have extensive knowledge about regional Italian specialties, cooking techniques, and food pairings
- You speak with warmth and enthusiasm, occasionally using simple Italian expressions (with translations)

YOUR MAIN GOALS:
1. Help customers find products they'll love based on their preferences and needs
2. Provide expert information about Italian cuisine, ingredients, cooking methods, and product origins
3. Deliver exceptional customer service with a personal, engaging touch
4. Build customer loyalty by creating an authentic Italian shopping experience

CRITICAL RULES - FUNCTION CALLS ARE MANDATORY:
- You MUST ALWAYS call the appropriate function before answering ANY question
- NEVER provide information without first calling a function to get current data
- If a customer asks about products, call getProducts() first
- If a customer asks about services, call getServices() first  
- If a customer asks about policies, shipping, returns, or common questions, call getFAQs() first
- If a customer asks about company location, website, opening hours, or contact info, call getProfile() first
- DO NOT use your internal knowledge - ONLY use data from function calls

FUNCTION CALLING CAPABILITIES:
You have access to the following functions that you MUST use to get accurate information:

1. getProducts(category?, search?, countOnly?)
   - Call this when users ask about products, want to browse, or ask for specific items
   - Use 'search' parameter for specific product queries
   - Set 'countOnly' to true when you only need to know if products exist or quantities
   - Examples: "What pasta do you sell?", "Do you have Parmigiano?", "Show me your cheeses"

2. getServices(isActive?, search?)
   - Call this when users ask about services offered by the store
   - Use 'search' parameter to find specific services
   - Examples: "What services do you offer?", "Do you provide cooking classes?"

3. getFAQs(search?)
   - Call this when users ask common questions about policies, shipping, returns, loyalty programs
   - Use 'search' parameter to find specific information
   - Examples: "What's your return policy?", "How long does shipping take?", "Do you have a loyalty program?"

4. getProfile()
   - Call this when users ask about company information, location, contact details, or business hours
   - Examples: "Where are you located?", "What's your website?", "When are you open?", "How can I contact you?"
   - Note: Phone number is not included for privacy reasons

RESPONSE GUIDELINES:
- Always call the appropriate function before providing information
- Be warm and personable, using the customer's name when available
- Provide expert recommendations based on actual available products
- Share cooking tips, pairing suggestions, and cultural insights
- When you don't know something, be honest and offer to connect them with specialists

Remember: Your knowledge comes from the database through function calls, not from hardcoded information. Always retrieve fresh, accurate data to provide the best customer experience.

Buon appetito!`
    }
  });
  
  console.log('Seeded agent config');
}

async function seedProfile() {
  // Delete existing profile
  await prisma.profile.deleteMany({});
  
  // Create new profile
  const profile = await prisma.profile.create({
    data: {
      username: 'shopmefy',
      companyName: 'ShopMefy',
      logoUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop&crop=center',
      description: 'Authentic Italian restaurant bringing the finest Italian cuisine and products directly to your table. From premium Parmigiano Reggiano to traditional pasta from Gragnano, we curate only the best Italian specialties with DOP and IGP certifications.',
      phoneNumber: '+390612345678',
      website: 'https://www.shopmefy.com',
      email: 'info@shopmefy.com',
      openingTime: 'Monday-Friday: 9:00-18:00, Saturday: 9:00-13:00, Sunday: Closed',
      address: 'Via Roma 123, 00186 Roma, Italy',
      sector: 'Premium Italian Food, Ecommerce'
    }
  });
  
  console.log('Seeded profile');
}

async function seedDocuments() {
  // Delete existing documents and chunks
  await prisma.documentChunk.deleteMany({});
  await prisma.document.deleteMany({});
  
  console.log('📄 Seeding sample documents...');
  
  // Sample documents from our created PDFs with proper title
  const sampleDocuments = [
    {
      filename: 'trasporto-merci-italia.pdf',
      originalName: 'Regolamento Trasporto Merci in Italia.pdf',
      title: 'Italian Goods Transportation Regulations',
      description: 'Comprehensive regulations for goods transportation in Italy, including licensing requirements, documentation, and legal responsibilities.'
    },
    {
      filename: 'gdpr-privacy-policy.pdf',
      originalName: 'GDPR Privacy Policy - Gusto Italiano.pdf',
      title: 'GDPR Privacy Policy - ShopMefy',
      description: 'Complete GDPR compliance documentation including data processing purposes, legal basis, and user rights.'
    },
    {
      filename: 'catalogo-prodotti-italiani.pdf',
      originalName: 'Catalogo Prodotti Italiani 2024.pdf',
      title: 'Italian Products Catalog 2024',
      description: 'Complete catalog of authentic Italian products including pasta, cheeses, wines, and traditional specialties.'
    }
  ];
  
  const sampleDir = path.join(__dirname, 'sample-documents');
  const uploadsDir = path.join(__dirname, '..', 'uploads', 'documents');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('📁 Created uploads/documents directory');
  }
  
  for (const docInfo of sampleDocuments) {
    const filePath = path.join(sampleDir, docInfo.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${docInfo.filename}, skipping...`);
      continue;
    }
    
    // Get file stats
    const stats = fs.statSync(filePath);
    const uploadPath = `uploads/documents/${docInfo.filename}`;
    
    // Copy file to uploads directory if it doesn't exist
    const destinationPath = path.join(uploadsDir, docInfo.filename);
    if (!fs.existsSync(destinationPath)) {
      fs.copyFileSync(filePath, destinationPath);
      console.log(`📋 Copied ${docInfo.filename} to uploads directory`);
    }
    
    // Create document record with title field
    const document = await prisma.document.create({
      data: {
        id: uuidv4(),
        filename: docInfo.filename,
        originalName: docInfo.originalName,
        title: docInfo.title,
        mimeType: 'application/pdf',
        size: stats.size,
        uploadPath: uploadPath,
        status: 'COMPLETED',
        userId: null, // System documents
        metadata: JSON.stringify({
          title: docInfo.title,
          pages: 1,
          description: docInfo.description,
          language: 'it'
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    // Create sample chunks for each document
    const sampleChunks = [
      {
        content: `${docInfo.title} - This document contains important information about ${docInfo.description.toLowerCase()}`,
        pageNumber: 1,
        chunkIndex: 0
      },
      {
        content: `Key topics covered in this document include regulations, requirements, and best practices related to ${docInfo.title.toLowerCase()}`,
        pageNumber: 1,
        chunkIndex: 1
      },
      {
        content: `This document provides comprehensive guidance for Italian business operations.`,
        pageNumber: 1,
        chunkIndex: 2
      }
    ];
    
    for (const chunkInfo of sampleChunks) {
      await prisma.documentChunk.create({
        data: {
          id: uuidv4(),
          content: chunkInfo.content,
          pageNumber: chunkInfo.pageNumber,
          chunkIndex: chunkInfo.chunkIndex,
          documentId: document.id,
          embedding: null, // Will be generated later by the embedding service
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    
    console.log(`✅ Seeded document: ${docInfo.title} (${stats.size} bytes)`);
  }
  
  console.log(`📄 Successfully seeded ${sampleDocuments.length} sample documents with chunks and proper title fields`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 