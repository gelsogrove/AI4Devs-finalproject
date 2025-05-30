import { chatApi, ChatApiResponse } from '@/api/chatApi';
import { profileApi } from '@/api/profileApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OrderModal } from '@/components/ui/OrderModal';
import { OrderToast } from '@/components/ui/OrderToast';
import { ChatMessage } from '@/types/chat';
import { Profile } from '@/types/profile';
import { Bot, Bug, MessageCircle, Send, Sparkles } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

// Initial messages to demonstrate the chat
// NOTA: Array vuoto per permettere agli utenti di iniziare la conversazione
// Rimosso il messaggio di benvenuto automatico per migliorare l'UX
const initialMessages: ChatMessage[] = [];

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  
  // Order notification state
  const [orderNotification, setOrderNotification] = useState<{
    order: any;
    showToast: boolean;
    showModal: boolean;
  } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await profileApi.getProfile();
        setProfile(profileData);
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };

    loadProfile();
  }, []);

  // Function to send a message and get a response from the API
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
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
      
      const response: ChatApiResponse = await chatApi.sendMessage({
        messages: filteredMessages,
      });
      
      // Capture debug information if available
      if (response.debug && debugMode) {
        const newDebugInfo = {
          userMessage: inputMessage.trim(),
          timestamp: new Date().toISOString(),
          functionCalls: response.debug.functionCalls || [],
          processingTime: response.debug.processingTime,
          model: response.debug.model,
          temperature: response.debug.temperature
        };
        
        setDebugInfo(prev => [newDebugInfo, ...prev].slice(0, 10)); // Keep last 10 debug entries
        
        console.log('🐛 Debug Info Captured:', newDebugInfo);
      }
      
      // Check if the response contains an OrderCompleted function call result
      const responseContent = response.message.content;
      
      // Enhanced order detection - check for both function calls and text patterns
      const hasOrderNumber = responseContent.includes('ORD-') || responseContent.includes('Order Number:');
      const hasConfirmationText = responseContent.includes('confermato') || responseContent.includes('confirmed') || responseContent.includes('confermato con successo');
      const hasOrderDetails = (responseContent.includes('Totale:') || responseContent.includes('Total:')) && (responseContent.includes('€') || responseContent.includes('EUR'));
      const hasDeliveryInfo = responseContent.includes('consegna') || responseContent.includes('spedizione') || responseContent.includes('Delivery') || responseContent.includes('delivery');
      
      // Check if this looks like an order confirmation
      if ((hasOrderNumber && hasConfirmationText) || 
          (hasConfirmationText && hasOrderDetails && hasDeliveryInfo)) {
        
        console.log('🎉 Order detected!', {
          hasOrderNumber,
          hasConfirmationText,
          hasOrderDetails,
          hasDeliveryInfo,
          responseContent: responseContent.substring(0, 200) + '...'
        });
        
        // Try to extract order number
        let orderNumber = 'ORD-' + Date.now().toString().slice(-6);
        const orderNumberMatch = responseContent.match(/(?:Order Number:|ORD-)[\s]*([A-Z0-9-]+)/i);
        if (orderNumberMatch) {
          orderNumber = orderNumberMatch[1].startsWith('ORD-') ? orderNumberMatch[1] : 'ORD-' + orderNumberMatch[1];
        }
        
        // Try to extract order details from the response content
        let orderData = null;
        
        // Look for order details in the response
        try {
          // Try to parse if there's JSON data in the response
          const jsonMatch = responseContent.match(/\{[^}]*"orderNumber"[^}]*\}/);
          if (jsonMatch) {
            orderData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          // If parsing fails, extract from text
          console.log('Extracting order data from text response');
        }
        
        // Extract products and totals from text
        if (!orderData) {
          const items = [];
          let total = 0;
          
          // Look for product lines like "• **Corporate Gift Baskets** - €129.99" or "• Barolo DOCG - €45.00 (3 bottiglie)"
          const productMatches = responseContent.match(/•\s*\*?\*?([^-\n]+?)\*?\*?\s*-\s*€?(\d+(?:\.\d{2})?)/g);
          if (productMatches) {
            productMatches.forEach(match => {
              const parts = match.match(/•\s*\*?\*?([^-\n]+?)\*?\*?\s*-\s*€?(\d+(?:\.\d{2})?)/);
              if (parts) {
                const productName = parts[1].trim().replace(/\*\*/g, '');
                const price = parseFloat(parts[2]);
                
                // Try to extract quantity from the line
                let quantity = 1;
                const quantityMatch = match.match(/\((\d+)\s*(?:bottles?|bottiglie?|pezzi?|pieces?)\)/i);
                if (quantityMatch) {
                  quantity = parseInt(quantityMatch[1]);
                }
                
                const subtotal = price;
                
                items.push({
                  product: productName,
                  quantity: quantity,
                  price: quantity > 1 ? price / quantity : price,
                  subtotal: subtotal
                });
                total += subtotal;
              }
            });
          }
          
          // Look for total in text like "Totale: €135.00" or "Total: €199.49"
          const totalMatch = responseContent.match(/(?:Totale|Total):\s*€?(\d+(?:\.\d{2})?)/i);
          if (totalMatch) {
            total = parseFloat(totalMatch[1]);
          }
          
          // If no items found but total exists, create a generic item
          if (items.length === 0 && total > 0) {
            items.push({
              product: 'Ordine confermato',
              quantity: 1,
              price: total,
              subtotal: total
            });
          }
          
          // Extract delivery date
          let deliveryDate = 'Entro 3-5 giorni lavorativi';
          const deliveryMatch = responseContent.match(/(?:Estimated Delivery|consegna)[^:]*:\s*([^\n]+)/i);
          if (deliveryMatch) {
            deliveryDate = deliveryMatch[1].trim();
          }
          
          // Extract customer address
          let customerAddress = 'Via Pinocco 10, 20100';
          const addressMatch = responseContent.match(/(?:via|address)[^:]*([^\n]+)/i);
          if (addressMatch) {
            customerAddress = addressMatch[1].trim();
          }
          
          orderData = {
            orderNumber,
            status: 'CONFIRMED',
            items: items.length > 0 ? items : [
              { product: 'Prodotti ordinati', quantity: 1, price: total, subtotal: total }
            ],
            total: total,
            currency: 'EUR',
            estimatedDelivery: deliveryDate,
            customerInfo: { 
              name: 'Andrea Gelsomino', 
              address: customerAddress, 
              email: 'cliente@email.com' 
            },
            paymentMethod: 'Pagamento alla consegna',
            shippingMethod: 'Corriere espresso',
            notes: 'Ordine confermato! Riceverai una email di conferma a breve.',
            timestamp: new Date().toISOString()
          };
        }
        
        // Create order object (use extracted data or fallback to mock)
        const orderDetails = orderData || {
          orderNumber: orderNumber,
          status: 'CONFIRMED',
          items: [
            { product: 'Barolo DOCG', quantity: 3, price: 45.00, subtotal: 135.00 }
          ],
          total: 135.00,
          currency: 'EUR',
          estimatedDelivery: 'Entro 3-5 giorni lavorativi',
          customerInfo: { name: 'Andrea Gelsomino', address: 'Via Pinocco 10, 20100', email: 'cliente@email.com' },
          paymentMethod: 'Pagamento alla consegna',
          shippingMethod: 'Corriere espresso',
          notes: 'Ordine confermato! Riceverai una email di conferma a breve.',
          timestamp: new Date().toISOString()
        };
        
        // Decide whether to show toast or modal based on content length and number of items
        const shouldShowModal = responseContent.length > 500 || orderDetails.items.length > 3;
        
        // Show notification after 5 seconds delay
        setTimeout(() => {
          setOrderNotification({
            order: orderDetails,
            showToast: !shouldShowModal,
            showModal: shouldShowModal
          });
          
          // Auto-close toast after 8 seconds (from when it appears)
          if (!shouldShowModal) {
            setTimeout(() => {
              setOrderNotification(prev => prev ? { ...prev, showToast: false } : null);
            }, 8000);
          }
        }, 5000); // 5 seconds delay before showing notification
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message.content || 'Sorry, I could not generate a response.',
        timestamp: new Date().toISOString()
      };

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
      setIsLoading(false);
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
        {/* Chat Interface - Takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2 animate-scale-in">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardContent className="p-0 flex flex-col h-[70vh]">
              {/* Chat header */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
                <div className="flex items-center justify-between">
                  {/* Left side - Bot icon and company name */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-shopme-500 to-shopme-600 flex items-center justify-center text-white font-medium shadow-md">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {profile?.companyName || 'Gusto Italiano'} - Sofia
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-xs text-gray-500">Online</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Center - WhatsApp Info */}
                  {profile?.phoneNumber && (
                    <div className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer group">
                      <FaWhatsapp className="w-5 h-5 text-green-600" />
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-800">
                          {profile.phoneNumber}
                        </div>
                        <div className="text-xs text-green-600 group-hover:text-green-700">
                          WhatsApp Business API not implemented yet.
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Right side - Debug and sparkles */}
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
                          {info.functionCalls && info.functionCalls.length > 0 && (
                            <div className="text-orange-600 mt-1">
                              <div className="font-medium">Functions called:</div>
                              {info.functionCalls.map((call: any, callIndex: number) => (
                                <div key={callIndex} className="ml-2 mt-1">
                                  <span className="font-medium">{call.name}</span>
                                  {call.arguments && (
                                    <div className="text-gray-600 text-xs">
                                      Args: {JSON.stringify(call.arguments)}
                                    </div>
                                  )}
                                  {call.result && (
                                    <div className="text-green-600 text-xs">
                                      Result: {call.result.total || 0} items found
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {info.processingTime && (
                            <div className="text-blue-600 mt-1">
                              Processing time: {info.processingTime}ms
                            </div>
                          )}
                          <div className="text-gray-500 text-xs mt-1">
                            {new Date(info.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-orange-600">No function calls recorded yet. Ask Sofia about products, services, or FAQs!</div>
                  )}
                </div>
              )}
              
              {/* Chat messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
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
                        
                        {/* Display text content with proper markdown rendering */}
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              // Custom styling for markdown elements
                              h1: ({ children }) => (
                                <h1 className="text-xl font-bold mt-4 mb-2 text-gray-900">{children}</h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-lg font-semibold mt-3 mb-2 text-gray-900">{children}</h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-semibold mt-3 mb-1 text-gray-900">{children}</h3>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-none space-y-1 my-2">{children}</ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-1 my-2 ml-2">{children}</ol>
                              ),
                              li: ({ children }) => (
                                <li className="flex items-start">
                                  <span className="mr-2 text-softblue-600 mt-0.5">•</span>
                                  <span className="flex-1">{children}</span>
                                </li>
                              ),
                              p: ({ children }) => (
                                <p className="my-1 leading-relaxed">{children}</p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-gray-900">{children}</strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-700">{children}</em>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-softblue-300 pl-4 my-2 italic text-gray-700">{children}</blockquote>
                              )
                            }}
                          >
                            {message.content || ''}
                          </ReactMarkdown>
                        </div>
                        <div className="text-xs mt-2 text-right text-gray-700 font-medium">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
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
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about our Italian products..."
                    className="flex-1 border-gray-200 focus:border-shopme-500 focus:ring-shopme-500 transition-colors"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={sendMessage} 
                    className="bg-gradient-to-r from-shopme-500 to-shopme-600 hover:from-shopme-600 hover:to-shopme-700 text-white shadow-md hover:shadow-lg transition-all duration-200 px-4"
                    disabled={!inputMessage.trim() || isLoading}
                  >
                    <Send size={18} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Information Panels - Takes 1/3 of the space on large screens */}
        <div className="space-y-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          {/* About Sofia Panel */}
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-shopme-100 to-shopme-200 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-shopme-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">About Sofia</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Your AI Italian assistant
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

          {/* Try Asking Panel */}
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-softblue-100 to-softblue-200 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-softblue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Try Asking</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    Click on any question to start
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "Where is your warehouse?",
                  "Do you have wine less than 20 Euro?",
                  "How long does shipping take?",
                  "What payment methods do you accept?",
                  "Does exist an international delivery document?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputMessage(question);
                      // Auto-send the message
                      setTimeout(() => {
                        const event = new KeyboardEvent('keypress', { key: 'Enter' });
                        document.dispatchEvent(event);
                        sendMessage();
                      }, 100);
                    }}
                    className="w-full text-left p-3 text-sm bg-gray-50 hover:bg-softblue-50 border border-gray-200 hover:border-softblue-300 rounded-lg transition-all duration-200 hover:shadow-sm"
                  >
                    <span className="text-softblue-600 mr-2">💬</span>
                    <span className="text-gray-700">{question}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Functions Panel - REMOVED */}

        </div>
      </div>
      
      {/* Order Notifications */}
      {orderNotification && (
        <>
          <OrderToast
            order={orderNotification.order}
            isVisible={orderNotification.showToast}
            onClose={() => setOrderNotification(prev => prev ? { ...prev, showToast: false } : null)}
          />
          <OrderModal
            order={orderNotification.order}
            isVisible={orderNotification.showModal}
            onClose={() => setOrderNotification(null)}
          />
        </>
      )}
    </div>
  );
};

export default Chatbot;
