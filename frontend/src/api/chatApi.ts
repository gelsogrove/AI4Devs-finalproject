import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';
const CHAT_ENDPOINT = API_URL ? `${API_URL}/api/chat` : '/api/chat';

// Get authentication token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface SimpleChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
  content: string;
  imageUrl?: string;
  imageCaption?: string;
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

export interface SendMessageParams {
  messages: SimpleChatMessage[];
}

export interface ChatApiResponse {
  message: {
    role: 'user' | 'assistant' | 'system' | 'function' | 'tool';
    content: string;
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
  };
  debug?: {
    functionCalls?: Array<{
      name: string;
      arguments: any;
      result?: any;
      timestamp: string;
    }>;
    processingTime?: number;
    model?: string;
    temperature?: number;
  };
}

export const chatApi = {
  // Send a message to the chat API
  async sendMessage(params: SendMessageParams) {
    try {
      const response = await axios.post(CHAT_ENDPOINT, params, getAuthHeader());
      return response.data as ChatApiResponse;
    } catch (error) {
      console.error('Chat API error:', error);
      throw error;
    }
  }
}; 