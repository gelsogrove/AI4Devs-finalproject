import { chatApi } from '@/api/chatApi';
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
      const botMessage = await chatApi.sendMessage({
        messages: [...messages, userMessage],
      });
      
      setMessages(prev => [...prev, botMessage]);
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
                  <h3 className="font-medium">Gusto Italiano Assistant</h3>
                  <p className="text-xs text-gray-500">Online</p>
                </div>
              </div>
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                      {message.content.split('\n').map((line, i) => (
                        <div key={i} className={line.startsWith('•') ? 'mt-2' : ''}>
                          {line.includes('**') ? (
                            <div dangerouslySetInnerHTML={{ 
                              __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                            }} />
                          ) : (
                            line
                          )}
                        </div>
                      ))}
                      <div className="text-xs opacity-70 mt-1 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
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
                      setInput("Quali prodotti vendete?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    Quali prodotti vendete?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("Avete dei formaggi italiani?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    Avete dei formaggi italiani?
                  </Button>
                </li>
              </ul>
              
              <div className="mt-6 text-xs text-gray-500">
                <p className="font-medium mb-1">About the Chatbot</p>
                <p>This chatbot connects to a real AI service with function calling capabilities to search products and services in our database.</p>
                <p className="mt-2">You can ask about products in Italian or English, and the assistant will understand both languages.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
