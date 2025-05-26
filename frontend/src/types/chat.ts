export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: string;
  timestamp: string;
  imageUrl?: string;
  imageCaption?: string;
  source?: string;
  isError?: boolean;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    }
  }>;
  tool_call_id?: string;
}

export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  createdAt: string;
}
