
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types/chat';
import { Send } from 'lucide-react';

// Mock product data for function calling
const products = [
  {
    id: '1',
    name: 'Parmigiano Reggiano',
    description: 'Authentic Parmigiano Reggiano aged 24 months. Imported directly from Parma, Italy.',
    price: 29.99,
    category: 'Cheese',
  },
  {
    id: '2',
    name: 'Extra Virgin Olive Oil',
    description: 'Cold-pressed olive oil from Tuscany. Perfect for salads and finishing dishes.',
    price: 19.99,
    category: 'Oils',
  },
  {
    id: '3',
    name: 'Balsamic Vinegar of Modena',
    description: 'Traditional balsamic vinegar aged in wooden barrels for 12 years.',
    price: 24.99,
    category: 'Vinegars',
  }
];

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

  // Function to simulate sending a message and getting a response
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
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate bot response based on user input
    let botResponse: string;
    const userInput = input.toLowerCase();
    
    if (userInput.includes('product') || userInput.includes('catalog') || userInput.includes('what do you sell')) {
      // Simulate function calling for product list
      botResponse = `We offer a variety of authentic Italian products. Here are some of our popular items:\n\n${products.map(p => 
        `• **${p.name}** - €${p.price.toFixed(2)}\n  ${p.description}`
      ).join('\n\n')}`;
    } 
    else if (userInput.includes('shipping') || userInput.includes('delivery')) {
      botResponse = 'We ship to most European countries within 3-5 business days. International shipping usually takes 7-10 business days. All orders over €75 qualify for free shipping!';
    }
    else if (userInput.includes('return') || userInput.includes('refund')) {
      botResponse = 'We accept returns within 30 days of delivery. The product must be unused and in its original packaging. Please contact our customer service to initiate a return.';
    }
    else if (userInput.includes('hello') || userInput.includes('hi') || userInput.includes('hey') || userInput.includes('ciao')) {
      botResponse = 'Ciao! How can I help you with our Italian specialty products today?';
    }
    else {
      botResponse = "Thank you for your message! I'd be happy to help with information about our authentic Italian products. Would you like to see our popular items, or do you have questions about specific products, shipping, or anything else?";
    }
    
    // Add bot response
    const botMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: botResponse,
      timestamp: new Date().toISOString()
    };
    
    setIsTyping(false);
    setMessages(prev => [...prev, botMessage]);
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
                      setInput("How long does shipping take?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    How long does shipping take?
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => {
                      setInput("What's your return policy?");
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    What's your return policy?
                  </Button>
                </li>
              </ul>
              
              <div className="mt-6 text-xs text-gray-500">
                <p className="font-medium mb-1">About the Chatbot</p>
                <p>This is a simulation of the ShopMe WhatsApp chatbot. In a production environment, this would connect to the WhatsApp Business API and respond to actual customer inquiries.</p>
                <p className="mt-2">Function calling capabilities include product searching, FAQ lookup, and order status checking.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Chatbot;
