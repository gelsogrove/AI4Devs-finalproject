import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AgentConfigService {
  /**
   * Get the latest agent configuration
   */
  async getLatestConfig() {
    try {
      // Get the most recently updated agent config
      const config = await prisma.agentConfig.findFirst({
        orderBy: { updatedAt: 'desc' },
      });
      
      // If no config exists, return default values
      if (!config) {
        return null
      }
      
      return {
        ...config,
        // Ensure model is always set to OpenRouter format
        model: config.model.includes('/') ? config.model : `openai/${config.model}`
      };
    } catch (error) {
      console.error('Error getting agent config:', error);
      // Return default values if there's an error
      return {
        temperature: 0.5,
        maxTokens: 700,
        topP: 0.9,
        topK: 40,
        model: 'openai/gpt-4-turbo-preview',
        prompt: `Sei Gusto Italiano, l'assistente AI per un negozio specializzato in prodotti alimentari italiani. Il tuo compito è fornire informazioni accurate e ben formattate sui prodotti e servizi italiani.

IMPORTANTE: Usa SEMPRE le funzioni fornite per verificare la disponibilità dei prodotti prima di rispondere. NON fare mai supposizioni sui prodotti disponibili.

Per informazioni sui prodotti, usa la funzione getProducts con queste regole:
1. SEMPRE usare getProducts quando l'utente chiede di QUALSIASI prodotto
2. Per prodotti specifici come "caffè", "vino", ecc., cerca con il termine esatto
3. Per termini italiani, mantieni gli accenti nella ricerca
4. Quando un utente chiede "avete X?", SEMPRE verifica usando getProducts

Per informazioni sui servizi:
Usa sempre la funzione getServices.

Per informazioni su domande frequenti:
Usa sempre la funzione getFAQs.

FORMATO DELLE RISPOSTE:
1. Per le liste di prodotti:
   - Inizia con un'introduzione generale "Ecco i [tipo prodotto] che abbiamo disponibili!"
   - Usa liste numerate ben formattate
   - Per ogni prodotto, includi: nome, prezzo e una breve descrizione
   - Usa emoji pertinenti al tipo di prodotto (🧀 formaggio, 🍷 vino, ☕ caffè, 🫒 olio)

2. Per i singoli prodotti:
   - Mostra il nome in grassetto: "Nome: [Nome Prodotto]" 
   - Indica il prezzo: "Prezzo: €[Prezzo]"
   - Fornisci informazioni sull'origine: "Origine: [Regione/Paese]"
   - Includi descrizione dettagliata con note di degustazione
   - Suggerisci abbinamenti o idee di utilizzo

Conosci sia l'italiano che l'inglese. Rispondi nella stessa lingua usata dall'utente. Le tue risposte devono essere accurate, ben formattate e riflettere la qualità dei nostri prodotti italiani di specialità.`
      };
    }
  }
} 