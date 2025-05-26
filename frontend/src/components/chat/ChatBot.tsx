import { zodResolver } from "@hookform/resolvers/zod";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { chatApi, ChatApiResponse, SimpleChatMessage } from "../../api/chatApi";
import { faqApi } from "../../api/faqApi";
import { ChatMessage } from "../../types/chat";
import { FAQ } from "../../types/faq";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { MarkdownViewer } from "../ui/markdown-viewer";

const formSchema = z.object({
  message: z.string().min(1).max(1000),
});

interface ChatBotProps {
  className?: string;
}

export default function ChatBot({ className }: ChatBotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi there! I'm your virtual assistant. How can I help you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [relatedFaqs, setRelatedFaqs] = useState<FAQ[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // This function searches for related FAQs using semantic search
  const searchFAQs = async (query: string) => {
    try {
      // Use semantic search only
      const semanticResults = await faqApi.searchFAQSemanticly(query);
      return semanticResults;
    } catch (error) {
      console.error("Error searching FAQs:", error);
      return [];
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const userMessage: ChatMessage = {
      role: "user",
      content: data.message,
      timestamp: new Date().toISOString(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    form.reset();
    setLoading(true);

    try {
      // Find related FAQs based on user's message (just for display purposes)
      const faqs = await searchFAQs(data.message);
      setRelatedFaqs(faqs);
      
      // Always use the chat API for responses
      try {
        // Format messages for the API - ensure all required fields are preserved
        const apiMessages: SimpleChatMessage[] = [...messages, userMessage].map(msg => {
          // Base message
          const formattedMsg: SimpleChatMessage = {
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
        
        // Filter out messages with invalid roles
        const validRoles = ['user', 'assistant', 'system', 'function', 'tool'];
        const validMessages = apiMessages.filter(msg => validRoles.includes(msg.role));
        
        // Log any invalid messages that are being filtered out
        apiMessages.forEach((msg, i) => {
          if (!validRoles.includes(msg.role)) {
            console.warn(`Message at index ${i} has invalid role and will be filtered:`, msg);
          }
        });
        
        const response: ChatApiResponse = await chatApi.sendMessage({ messages: validMessages });
        
        console.log("API response:", response);
        
        // Create a new message with the response
        // La risposta arriva con un wrapper 'message' che contiene il messaggio effettivo dell'assistente
        let assistantMessage: ChatMessage;
        
        if (response && response.message) {
          assistantMessage = {
            role: "assistant",
            content: response.message.content || "I'm sorry, I couldn't generate a response.",
            timestamp: new Date().toISOString(),
            // Copy other fields if they exist
            ...(response.message.function_call && { function_call: response.message.function_call }),
            ...(response.message.tool_calls && { tool_calls: response.message.tool_calls })
          };
        } else {
          // Fallback
          assistantMessage = {
            role: "assistant",
            content: "I'm sorry, I couldn't generate a response.",
            timestamp: new Date().toISOString(),
          };
        }
        
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Chat API error:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date().toISOString(),
        isError: true,
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`flex max-w-[80%] ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              } rounded-lg p-3 ${message.isError ? "bg-red-100 text-red-800" : ""}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 mr-2" />
              )}
              <div>
                <MarkdownViewer content={message.content} />
                {message.source && (
                  <div className="text-xs text-gray-500 mt-1">
                    Source: {message.source}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Related FAQs */}
      {relatedFaqs.length > 0 && (
        <div className="p-4 border-t">
          <h3 className="text-sm font-medium mb-2">Related Questions:</h3>
          <div className="space-y-2">
            {relatedFaqs.map((faq) => (
              <div
                key={faq.id}
                className="bg-gray-50 p-2 rounded-md cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  // Creare un messaggio utente con la domanda della FAQ
                  const userFaqMessage: ChatMessage = {
                    role: "user",
                    content: faq.question,
                    timestamp: new Date().toISOString(),
                  };
                  
                  // Aggiungere il messaggio e resettare le FAQ correlate
                  setMessages((prev) => [...prev, userFaqMessage]);
                  setRelatedFaqs([]);
                  
                  // Inviare la domanda attraverso l'API standard
                  form.setValue("message", "");
                  form.handleSubmit((data) => onSubmit({...data, message: faq.question}))();
                }}
              >
                <p className="text-sm font-medium">{faq.question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="border-t p-4 flex items-center space-x-2"
      >
        <Input
          {...form.register("message")}
          placeholder="Type your message..."
          className="flex-1"
          disabled={loading}
        />
        <Button type="submit" size="icon" disabled={loading}>
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
} 