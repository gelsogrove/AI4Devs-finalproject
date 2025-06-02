export interface AgentConfig {
  id: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  model: string;
  prompt: string;
  updatedAt: string;
}

export interface UpdateAgentConfigDto {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  model?: string;
  prompt?: string;
}

export const AI_MODELS = [
  "openai/gpt-4o-mini",  
  "gpt-4-turbo",                  // Default, potente e versatile
  "gpt-4o",                       // Ultima versione di GPT-4, più veloce
  "claude-3-opus",                // Modello premium di Anthropic
  "claude-3-sonnet",              // Buon compromesso tra qualità e costo
  "gemini-pro",                   // Modello avanzato di Google
  "mistral-large"                 // Modello premium di Mistral AI
];

export const ECONOMICAL_AI_MODELS = [
  "openai/gpt-4o-mini",           // Nuovo, potente ed economico, ottima alternativa a GPT-3.5
  "openai/gpt-3.5-turbo",         // Classico, buon compromesso tra costo e qualità
  "anthropic/claude-instant-1",   // Rapido ed economico, buono per chatbot
  "mistralai/mistral-7b",         // Open-source, ottimo se self-hosted
  "google/gemma-7b-it",           // Ottimizzato per l'italiano, efficiente
  "meta/llama-3-8b"               // Ultimo modello open-source, valido e accessibile
]; 