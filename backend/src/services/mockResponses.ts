import logger from '../utils/logger';

/**
 * Interface for response pattern configuration
 */
interface ResponsePattern {
  // Function to check if this pattern matches the user query
  matches: (text: string) => boolean;
  // Response or function that returns a response
  response: any | (() => any);
}

/**
 * Collection of response patterns for mock responses
 * Each pattern defines a condition and a response or response generator
 */
export const responsePatterns: ResponsePattern[] = [
  {
    // Product catalog query
    matches: (text: string) => 
      text.includes('products do you sell') || 
      text.includes('what products') || 
      text.includes('products do you'),
    response: {
      role: 'assistant',
      content: `Here are our products: Parmigiano Reggiano, Olive Oil, Balsamic Vinegar. We have 3 products in total.`
    }
  },
  {
    // Product count query
    matches: (text: string) => 
      text.includes('how many products') || 
      text.includes('how many product'),
    response: {
      role: 'assistant',
      content: `We have 3 products in our catalog.`
    }
  },
  {
    // Wine query with image
    matches: (text: string) => 
      text.includes('italian wine') || 
      text.includes('wine') || 
      text.includes('chianti'),
    response: () => {
      const imageUrl = 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80';
      
      logger.info(`Sending wine response with image URL: ${imageUrl}`);
      
      return {
        role: 'assistant',
        content: 'Yes, we have Chianti wine! 🍷\n\nLet me introduce our Chianti Classico, a premium wine from Tuscany. It has notes of cherry and spices, and is perfect to pair with pasta dishes.\n- Price: €35.99\n\nIf you need more information or suggestions on how to pair it, let me know! 😊✨',
        imageUrl: imageUrl,
        imageCaption: 'Chianti Classico - Premium Italian Wine'
      };
    }
  },
  {
    // Prosciutto and melon recipe
    matches: (text: string) => 
      text.includes('prosciutto') && 
      text.includes('melon'),
    response: () => {
      const imageUrl = 'https://images.unsplash.com/photo-1647354780631-7e34e1df202c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80';
      
      logger.info('Sending prosciutto and melon recipe with image');
      
      return {
        role: 'assistant',
        content: '# Prosciutto and Melon Rolls 🍈🍖\n\nHere\'s a simple and delicious recipe you can try with our Parma prosciutto!\n\n## Ingredients\n- Parma prosciutto (thinly sliced)\n- Ripe melon (cantaloupe or yellow melon)\n- Fresh basil leaves (optional)\n- Ground black pepper (optional)\n\n## Preparation\n1. **Cut the melon**: Peel and remove seeds from the melon, then cut into slices or cubes\n2. **Wrap with prosciutto**: Take a slice of prosciutto and wrap it around each piece of melon\n3. **Serve**: Arrange the rolls on a serving plate. If desired, you can garnish with fresh basil leaves and a sprinkle of black pepper\n4. **Enjoy**: Serve immediately as a fresh appetizer!\n\nBuon appetito! 😋 Would you also like some advice on which wine to pair with this dish? 🍷',
        imageUrl: imageUrl,
        imageCaption: 'Prosciutto and Melon Rolls - Italian Appetizer'
      };
    }
  },
  // Puoi aggiungere altri pattern qui senza modificare il controller
];

/**
 * Get a mock response based on user input
 * @param content The user message content
 * @returns The appropriate mock response
 */
export const getMockResponse = (content: string): any => {
  try {
    // Convert to lowercase for case-insensitive matching
    const lowerContent = content.toLowerCase();
    
    // Find the first matching pattern
    const matchedPattern = responsePatterns.find(pattern => pattern.matches(lowerContent));
    
    if (matchedPattern) {
      // If the response is a function, call it to get the response object
      const response = typeof matchedPattern.response === 'function' 
        ? matchedPattern.response() 
        : matchedPattern.response;
        
      logger.info('Using matched pattern response:', { pattern: matchedPattern.matches.toString() });
      return response;
    } else {
      // Default response if no pattern matches
      const defaultResponse = {
        role: 'assistant',
        content: 'I can help you with information about our Italian products. We have cheeses, oils and balsamic vinegars. What interests you?'
      };
      
      logger.info('Using default response (no pattern matched)');
      return defaultResponse;
    }
  } catch (error) {
    logger.error('Error generating mock response:', error);
    // Fallback if something fails
    return {
      role: 'assistant',
      content: 'I can help you with information about our Italian products. We have cheeses like Parmigiano Reggiano, olive oil and balsamic vinegar. What interests you?'
    };
  }
}; 