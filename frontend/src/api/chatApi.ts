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
      console.log('Sending messages to API:', params.messages);
      
      // Convert frontend message format to backend format
      const backendMessages = params.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        imageUrl: msg.imageUrl,
        imageCaption: msg.imageCaption,
      }));
      
      console.log('Backend format messages:', backendMessages);
      
      const response = await apiClient.post('/chat', {
        messages: backendMessages,
      });
      
      // Log the raw API response for debugging
      console.log('Raw API response:', response.data);
      
      // Convert backend response to frontend format
      const responseMessage = response.data.message;
      console.log('Response message from API:', responseMessage);
      
      // Fix for the image URL display issue
      // If the URL is included in the content, extract it and set it properly
      let content = responseMessage.content || '';
      let imageUrl = responseMessage.imageUrl;
      let imageCaption = responseMessage.imageCaption;
      
      // Check if we have an imageUrl but it's showing up in the content
      if (content.includes(imageUrl)) {
        // Remove the URL from content
        content = content.replace(imageUrl, '').trim();
      }
      
      // Check if the content contains a URL that should be an image
      if (content && content.includes('![')) {
        // Extract the URL from markdown image format
        const markdownMatches = content.match(/!\[(.*?)\]\((.*?)\)/);
        if (markdownMatches && markdownMatches[2]) {
          imageUrl = markdownMatches[2];
          // Use the alt text as caption if available
          if (markdownMatches[1] && !imageCaption) {
            imageCaption = markdownMatches[1];
          }
          // Remove the image markdown from content
          content = content.replace(/!\[.*?\]\((.*?)\)/, '').trim();
        }
      }
      
      // Check if the content contains a URL that looks like an image URL
      if (!imageUrl) {
        // Check for common image URLs
        const urlPatterns = [
          /(https:\/\/images\.unsplash\.com[^\s)]+)/,
          /(https:\/\/.*?\.(?:png|jpg|jpeg|gif|webp))/i
        ];
        
        for (const pattern of urlPatterns) {
          const matches = content.match(pattern);
          if (matches && matches[1]) {
            imageUrl = matches[1];
            // Remove the raw URL from content
            content = content.replace(matches[1], '').trim();
            break;
          }
        }
      }
      
      // Check for text that might indicate an image URL is being mentioned
      if (!imageUrl && content.includes('http') && (
        content.includes('immagine') || 
        content.includes('image') || 
        content.includes('photo') || 
        content.includes('foto')
      )) {
        const urlMatch = content.match(/(https?:\/\/\S+)/);
        if (urlMatch && urlMatch[1]) {
          imageUrl = urlMatch[1];
          // Remove the URL from content
          content = content.replace(urlMatch[1], '').trim();
        }
      }
      
      // Clean up content by removing empty lines at start/end and multiple spaces
      content = content
        .replace(/^\s*[\r\n]/gm, '') // Remove empty lines
        .replace(/\s+/g, ' ')        // Replace multiple spaces with single space
        .trim();
      
      // Create the frontend message format
      const chatMessage = {
        id: Date.now().toString(),
        role: responseMessage.role,
        content: content,
        imageUrl: imageUrl,
        imageCaption: imageCaption || 'Immagine prodotto',
        timestamp: new Date().toISOString(),
      } as ChatMessage;
      
      console.log('Formatted chat message:', chatMessage);
      
      return chatMessage;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },
}; 