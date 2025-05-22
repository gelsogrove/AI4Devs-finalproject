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

export const AI_MODELS = [
  "gpt-4-turbo",
  "gpt-4o",
  "gpt-3.5-turbo"
];
