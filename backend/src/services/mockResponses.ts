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
      text.includes('prodotti vendete') || 
      text.includes('what products') || 
      text.includes('products do you'),
    response: {
      role: 'assistant',
      content: `Ecco i nostri prodotti: Parmigiano Reggiano, Olio d'Oliva, Aceto Balsamico. Abbiamo 3 prodotti in totale.`
    }
  },
  {
    // Product count query
    matches: (text: string) => 
      text.includes('quanti prodotti') || 
      text.includes('how many product'),
    response: {
      role: 'assistant',
      content: `Abbiamo 3 prodotti nel nostro catalogo.`
    }
  },
  {
    // Wine query with image
    matches: (text: string) => 
      text.includes('italian wine') || 
      text.includes('vino italiano') || 
      text.includes('chianti'),
    response: () => {
      const imageUrl = 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80';
      
      logger.info(`Sending wine response with image URL: ${imageUrl}`);
      
      return {
        role: 'assistant',
        content: 'Si, abbiamo il vino Chianti! 🍷\n\nTi presento il nostro Chianti Classico, un vino premium dalla Toscana. Ha note di ciliegia e spezie, ed è perfetto da abbinare a piatti di pasta.\n- Prezzo: 35,99 €\n\nSe hai bisogno di ulteriori informazioni o suggerimenti su come abbinarlo, fammi sapere! 😊✨',
        imageUrl: imageUrl,
        imageCaption: 'Chianti Classico - Vino Premium Italiano'
      };
    }
  },
  {
    // Prosciutto e melone recipe
    matches: (text: string) => 
      text.includes('prosciutto') && 
      text.includes('melon'),
    response: () => {
      const imageUrl = 'https://images.unsplash.com/photo-1647354780631-7e34e1df202c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80';
      
      logger.info('Sending prosciutto e melone recipe with image');
      
      return {
        role: 'assistant',
        content: '# Involtini di Prosciutto e Melone 🍈🍖\n\nEcco una semplice e deliziosa ricetta che puoi provare con il nostro prosciutto di Parma!\n\n## Ingredienti\n- Prosciutto di Parma (affettato sottile)\n- Melone maturo (cantalupo o melone giallo)\n- Foglie di basilico fresco (opzionale)\n- Pepe nero macinato (opzionale)\n\n## Preparazione\n1. **Taglia il melone**: Sbuccia e rimuovi i semi del melone, poi taglialo a fette o a cubetti\n2. **Avvolgi il prosciutto**: Prendi una fetta di prosciutto e avvolgila attorno a ciascuna fetta di melone\n3. **Servi**: Disponi gli involtini su un piatto da portata. Se desideri, puoi guarnire con foglie di basilico fresco e una spolverata di pepe nero\n4. **Gusta**: Servi immediatamente come antipasto fresco!\n\nBuon appetito! 😋 Vuoi anche qualche consiglio su quale vino abbinare a questo piatto? 🍷',
        imageUrl: imageUrl,
        imageCaption: 'Involtini di Prosciutto e Melone - Antipasto Italiano'
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
        content: 'Posso aiutarti con informazioni sui nostri prodotti italiani. Abbiamo formaggi, oli e aceti balsamici. Cosa ti interessa?'
      };
      
      logger.info('Using default response (no pattern matched)');
      return defaultResponse;
    }
  } catch (error) {
    logger.error('Error generating mock response:', error);
    // Fallback if something fails
    return {
      role: 'assistant',
      content: 'Posso aiutarti con informazioni sui nostri prodotti italiani. Abbiamo formaggi come il Parmigiano Reggiano, olio d\'oliva e aceto balsamico. Cosa ti interessa?'
    };
  }
}; 