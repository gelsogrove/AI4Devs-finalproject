import { chatApi, ChatApiResponse } from '@/api/chatApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChatMessage } from '@/types/chat';
import { Bot, Bug, HelpCircle, MessageCircle, Send, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

// Initial messages to demonstrate the chat
const initialMessages: ChatMessage[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Ciao! Welcome to ShopMefy. How can I help you today?',
    timestamp: new Date().toISOString()
  }
];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
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
      
      // Store debug information
      if (debugMode) {
        const debugEntry = {
          timestamp: new Date().toISOString(),
          userMessage: userMessage.content,
          functionCalls: response?.message?.tool_calls || response?.message?.function_call ? 
            (response.message.tool_calls || [response.message.function_call]) : [],
          responseContent: response?.message?.content || 'No response content'
        };
        setDebugInfo(prev => [debugEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
      }
      
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
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-shopme-50 to-green-50 rounded-xl p-6 border border-shopme-100 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-shopme-500 to-shopme-600 rounded-lg flex items-center justify-center shadow-lg">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Chatbot</h1>
            <p className="text-gray-600">Test your AI-powered product assistant</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-2 animate-scale-in">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col h-[70vh]">
              {/* Chat header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 flex items-center rounded-t-lg">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-shopme-500 to-shopme-600 flex items-center justify-center text-white font-medium mr-3 shadow-md">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Company name - Sofia</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDebugMode(!debugMode)}
                    className={`p-2 rounded-lg transition-all duration-200 ${
                      debugMode 
                        ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                        : 'text-gray-400 hover:text-orange-500 hover:bg-orange-50'
                    }`}
                    title="Toggle debug mode"
                  >
                    <Bug className="w-4 h-4" />
                  </button>
                  <Sparkles className="w-5 h-5 text-shopme-500" />
                </div>
              </div>
              
              {/* Debug Panel */}
              {debugMode && (
                <div className="border-b border-gray-100 bg-orange-50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bug className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">Debug Mode Active</span>
                  </div>
                  {debugInfo.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {debugInfo.map((info, index) => (
                        <div key={index} className="text-xs bg-white rounded p-2 border border-orange-200">
                          <div className="font-medium text-orange-800">
                            Query: {info.userMessage.substring(0, 50)}...
                          </div>
                          {info.functionCalls.length > 0 && (
                            <div className="text-orange-600 mt-1">
                              Functions called: {info.functionCalls.map((call: any) => 
                                call?.function?.name || call?.name || 'Unknown'
                              ).join(', ')}
                            </div>
                          )}
                          <div className="text-gray-500 text-xs mt-1">
                            {new Date(info.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-orange-600">No function calls recorded yet</div>
                  )}
                </div>
              )}
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-gray-50">
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
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
                    >
                      <div className={`${message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'} max-w-[80%] shadow-sm`}>
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
                            // Bullet list items
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
                        <div className="text-xs opacity-70 mt-2 text-right">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="chat-bubble-bot shadow-sm">
                      <div className="flex space-x-2 items-center">
                        <Bot className="w-4 h-4 text-shopme-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 rounded-full bg-shopme-500 animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-shopme-500 animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-shopme-500 animate-bounce [animation-delay:0.4s]" />
                        </div>
                        <span className="text-sm text-gray-500">Sofia is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Chat input */}
              <div className="border-t border-gray-100 p-4 bg-white rounded-b-lg">
                <div className="flex gap-3">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about our Italian products..."
                    className="flex-1 border-gray-200 focus:border-shopme-500 focus:ring-shopme-500 transition-colors"
                    disabled={isTyping}
                  />
                  <Button 
                    onClick={sendMessage} 
                    className="bg-gradient-to-r from-shopme-500 to-shopme-600 hover:from-shopme-600 hover:to-shopme-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-4"
                    disabled={!input.trim() || isTyping}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Suggestions Panel */}
        <div className="space-y-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Try asking:</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Click any suggestion to start a conversation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "What products do you sell?",
                "Which services do you offer?",
                "Any suggestions for a good wine?",
                "Do you have wine less than 20 Euro?",
                "Which kind of pasta do you sell?",
                "Are your products genuinely made in Italy?",
                "What payment methods do you accept?",
                "How long does shipping take?",
                "Do you ship internationally?"
              ].map((suggestion, index) => (
                <Button 
                  key={index}
                  variant="outline" 
                  className="w-full justify-start text-left h-auto py-3 px-4 border-gray-200 hover:border-shopme-300 hover:bg-shopme-50 transition-all duration-200 text-sm"
                  onClick={() => {
                    setInput(suggestion);
                    setTimeout(() => sendMessage(), 100);
                  }}
                >
                  <MessageCircle className="w-4 h-4 mr-2 text-shopme-500 flex-shrink-0" />
                  <span className="text-gray-700">{suggestion}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
          
          {/* About Section */}
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">About Sofia</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Your AI shopping assistant
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600 leading-relaxed">
                <p>
                  <strong className="text-gray-900">Sofia</strong> is your personal Italian food expert, powered by advanced AI technology.
                </p>
                <p>
                  She can search our product catalog, answer questions about services, and provide detailed information about authentic Italian cuisine.
                </p>
                <div className="mt-4 p-3 bg-shopme-50 rounded-lg border border-shopme-100">
                  <p className="text-xs text-shopme-700 font-medium">
                    ✨ Features: Real-time product search, FAQ assistance, and personalized recommendations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
