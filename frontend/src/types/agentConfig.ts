export interface AgentConfig {
  id: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  model: string;
  prompt: string;
  updatedAt: string;
}

export interface AgentConfigFormData {
  temperature: number;
  maxTokens: number;
  topP: number;
  model: string;
  prompt: string;
}

export const ECONOMICAL_AI_MODELS = [
  "openai/gpt-4o-mini",           // Nuovo, potente ed economico, ottima alternativa a GPT-3.5
  "openai/gpt-3.5-turbo",         // Classico, buon compromesso tra costo e qualità
  "anthropic/claude-instant-1",   // Rapido ed economico, buono per chatbot
  "mistralai/mistral-7b",         // Open-source, ottimo se self-hosted
  "google/gemma-7b-it",           // Ottimizzato per l’italiano, efficiente
  "meta/llama-3-8b"               // Ultimo modello open-source, valido e accessibile
];
