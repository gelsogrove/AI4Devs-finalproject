import { ChatMessage } from '@/types/chat';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests when available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface SendMessageParams {
  messages: ChatMessage[];
}

export const chatApi = {
  /**
   * Send a message to the chatbot and get a response
   */
  sendMessage: async (params: SendMessageParams) => {
    try {
      // Convert frontend message format to backend format
      const backendMessages = params.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      const response = await apiClient.post('/chat', {
        messages: backendMessages,
      });
      
      // Convert backend response to frontend format
      const responseMessage = response.data.message;
      
      return {
        id: Date.now().toString(),
        role: responseMessage.role,
        content: responseMessage.content,
        timestamp: new Date().toISOString(),
      } as ChatMessage;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },
}; 