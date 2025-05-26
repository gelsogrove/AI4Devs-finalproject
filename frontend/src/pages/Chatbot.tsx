import { chatApi, ChatApiResponse } from '@/api/chatApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types/chat';
import { Send } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Initial messages to demonstrate the chat
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Ciao! Welcome to Gusto Italiano. How can I help you today?',
    timestamp: new Date().toISOString()
  }
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Function to send a message and get a response from the API
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    
    try {
      // Call the real chat API
      const validRoles = ['user', 'assistant', 'system', 'function', 'tool'];
      
      // Format messages for the API - ensure all required fields are preserved
      const formattedMessages = [...messages, userMessage].map(msg => {
        // Base message
        const formattedMsg: any = {
          role: msg.role,
          content: msg.content
        };
        
        // Add optional fields if present
        if (msg.imageUrl) formattedMsg.imageUrl = msg.imageUrl;
        if (msg.imageCaption) formattedMsg.imageCaption = msg.imageCaption;
        if (msg.name) formattedMsg.name = msg.name;
        if (msg.function_call) formattedMsg.function_call = msg.function_call;
        if (msg.tool_calls) formattedMsg.tool_calls = msg.tool_calls;
        if (msg.tool_call_id) formattedMsg.tool_call_id = msg.tool_call_id;
        
        return formattedMsg;
      });
      
      // Filter out any messages with invalid roles
      const filteredMessages = formattedMessages.filter(msg => validRoles.includes(msg.role));
      
      // Log any invalid messages that are being filtered out
      formattedMessages.forEach((msg, i) => {
        if (!validRoles.includes(msg.role)) {
          console.warn(`Message at index ${i} has invalid role and will be filtered:`, msg);
        }
      });
      
      const response: ChatApiResponse = await chatApi.sendMessage({
        messages: filteredMessages,
      });
      
      // Debug log per la risposta
      console.log('Received API response:', response);
      
      // La risposta dell'API è un oggetto con proprietà 'message'
      // Estrai il messaggio correttamente e aggiungi i campi necessari
      let assistantMessage: ChatMessage;
      
      if (response && response.message) {
        // Risposta in formato {message: {...}}
        assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: response.message.content || 'Sorry, I could not generate a response.',
          timestamp: new Date().toISOString(),
          // Copia altri campi se presenti
          ...(response.message.function_call && { function_call: response.message.function_call }),
          ...(response.message.tool_calls && { tool_calls: response.message.tool_calls }),
          ...(response.message.tool_call_id && { tool_call_id: response.message.tool_call_id }),
          ...(response.message.name && { name: response.message.name }),
        };
      } else {
        // Fallback se la risposta è in formato non previsto
        assistantMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I could not generate a response.',
          timestamp: new Date().toISOString(),
        };
      }
      
      // Debug log per il messaggio estratto
      console.log('Formatted assistant message:', assistantMessage);
      
      // Ensure the message has a content property
      if (!assistantMessage.content) {
        console.warn('Bot message is missing content property:', assistantMessage);
        assistantMessage.content = 'Sorry, I could not generate a response.';
      }
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Chatbot</h1>
        <p className="text-gray-600">Test your AI-powered product assistant</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-0 flex flex-col h-[70vh]">
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center">
                <div className="w-8 h-8 rounded-full bg-shopme-500 flex items-center justify-center text-white font-medium mr-3">
                  AI
                </div>
                <div>
                  <h3 className="font-medium">ShopMe  Assistant</h3>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => {
                  // Debug log for each message being rendered
                  console.log(`Rendering message ${message.id}:`, { 
                    content: message.content,
                    imageUrl: message.imageUrl,
                    hasImage: !!message.imageUrl
                  });
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                        {/* Display image if available */}
                        {message.imageUrl && (
                          <div 
                            className="chat-image mb-2"
                            data-status="loading"
                          >
                            <img 
                              src={message.imageUrl} 
                              alt={message.imageCaption || "Image"} 
                              onError={(e) => {
                                console.error("Image failed to load:", e);
                                // Set data attribute on parent for styling
                                const target = e.target as HTMLImageElement;
                                if (target.parentElement) {
                                  target.parentElement.setAttribute('data-status', 'error');
                                }
                                // Set a fallback image
                                target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Available';
                              }}
                              onLoad={(e) => {
                                console.log("Image loaded successfully:", message.imageUrl);
                                // Set data attribute on parent for styling
                                const target = e.target as HTMLImageElement;
                                if (target.parentElement) {
                                  target.parentElement.setAttribute('data-status', 'loaded');
                                }
                              }}
                              style={{ maxWidth: '100%', height: 'auto' }}
                            />
                            {message.imageCaption && (
                              <p className="chat-image-caption">{message.imageCaption}</p>
                            )}
                          </div>
                        )}
                        
                        {/* Check for missing content */}
                        {!message.content && (() => { 
                          console.warn(`Message ${message.id} is missing content property`, message);
                          return null;
                        })()}
                        
                        {/* Display text content */}
                        {(message.content ?? '').split('\n').map((line, i) => {
                          // Check for markdown headers
                          if (line.startsWith('# ')) {
                            return (
                              <h1 key={i} className="text-xl font-bold mt-2 mb-2">
                                {line.substring(2)}
                              </h1>
                            );
                          } else if (line.startsWith('## ')) {
                            return (
                              <h2 key={i} className="text-lg font-semibold mt-2 mb-1">
                                {line.substring(3)}
                              </h2>
                            );
                          } else if (line.startsWith('- ')) {
                            return (
                              <div key={i} className="flex items-start mt-1">
                                <span className="mr-2">•</span>
                                <span>{line.substring(2)}</span>
                              </div>
                            );
                          } else if (line.match(/^\d+\.\s/)) {
                            // Numbered list items
                            const num = line.match(/^\d+/)?.[0] || '';
                            const text = line.replace(/^\d+\.\s/, '');
                            return (
                              <div key={i} className="flex items-start mt-1">
                                <span className="mr-2 font-medium">{num}.</span>
                                <span>{text}</span>
                              </div>
                            );
                          } else if (line.includes('**')) {
                            return (
                              <div key={i} className={line.startsWith('•') ? 'mt-2' : ''} 
                                dangerouslySetInnerHTML={{ 
                                  __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                                }} 
                              />
                            );
                          } else {
                            return (
                              <div key={i} className={`${line.startsWith('•') ? 'mt-2' : ''} ${line.trim() === '' ? 'h-2' : ''}`}>
                                {line}
                              </div>
                            );
                          }
                        })}
                        <div className="text-xs opacity-70 mt-1 text-right">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="chat-bubble-bot">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat input */}
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage} 
                    className="bg-shopme-500 hover:bg-shopme-600"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Try asking:</h3>
              <ul className="space-y-2">
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("What products do you sell?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    What products do you sell?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("Which services do you offer?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                   Which services do you offer ?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("Do you have any Italian wine?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                   Do you have any Italian wine?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("Are your products authentic Italian?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                  Are your products authentic Italian?  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("What payment methods do you accept?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                 What payment methods do you accept?  </Button>
                </li>

                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("How long does shipping take?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                 How long does shipping take?  </Button>
                </li>
                
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("Do you have a recipe for ham and melon?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    Do you have a recipe for ham and melon?
                  </Button>
                </li>
              </ul>
              
              <div className="mt-6 text-xs text-gray-500">
                <p className="font-medium mb-1">About the Chatbot</p>
                <p>This chatbot connects to a real AI service with function calling capabilities to search products and services in our database.</p>
               
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
