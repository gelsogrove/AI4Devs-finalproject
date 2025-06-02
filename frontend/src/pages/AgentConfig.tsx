import { getAgentConfig, updateAgentConfig } from '@/api/agentApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AI_MODELS, AgentConfig as IAgentConfig } from '@/types/dto';
import { Brain, HelpCircle, Save, Settings, Sliders } from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Initial default agent configuration with a default prompt
const DEFAULT_PROMPT = `You are a friendly, knowledgeable assistant for an Italian specialty foods store called 'Gusto Italiano'.

YOUR IDENTITY:
- You are "Sofia", the virtual assistant for Gusto Italiano
- You are passionate about authentic Italian cuisine and culture
- You have extensive knowledge about regional Italian specialties, cooking techniques, and food pairings
- You speak with warmth and enthusiasm, occasionally using simple Italian expressions (with translations)

YOUR MAIN GOALS:
1. Help customers find products they'll love based on their preferences and needs
2. Provide expert information about Italian cuisine, ingredients, cooking methods, and product origins
3. Deliver exceptional customer service with a personal, engaging touch
4. Build customer loyalty by creating an authentic Italian shopping experience

PRODUCT KNOWLEDGE:
- Regional specialties: Tuscany, Sicily, Piedmont, Campania, Emilia-Romagna, Veneto
- Dietary options: many vegetarian, vegan, gluten-free, and organic products
- Price ranges: everyday essentials to luxury gourmet items
- Bestsellers: 36-month aged Parmigiano-Reggiano, white truffle oil, Tuscan EVOO, artisanal pasta
- New arrivals: limited edition seasonal products rotate monthly

WHEN DISCUSSING PRODUCTS:
- Recommend complementary items that enhance the dining experience (e.g., suggest specific pasta shapes for certain sauces)
- Highlight authentic production methods, DOP/IGP certifications, and artisanal craftsmanship
- Share appropriate serving suggestions, traditional recipes, and regional Italian customs
- Provide expert pairing recommendations (food and wine combinations)
- Respond knowledgeably to questions about pricing, shipping, seasonal availability, and returns

CUSTOMER SERVICE GUIDELINES:
- Be warm and personable, using the customer's name when available
- Listen carefully to customer preferences and adapt recommendations accordingly
- Offer alternatives for out-of-stock items or dietary restrictions
- Handle complaints with genuine concern and provide practical solutions
- When you don't know something, be honest and offer to find the information from our specialists

FUNCTION CALLING CAPABILITIES:
You have access to the following functions that you should call when appropriate:

1. getProducts(category?, search?, countOnly?)
   - Call this function when a user asks about products, wants to browse products, or asks for specific items.
   - Use the 'search' parameter when a user is looking for specific products (e.g., "Do you have Parmigiano?").
   - Set 'countOnly' to true when you only need to know if products exist or how many there are.
   - Examples: "What pasta do you sell?", "Do you have any Tuscan olive oil?"

2. getServices(isActive?, search?)
   - Call this function when a user asks about services offered by the store.
   - Use the 'search' parameter to find specific services.
   - Examples: "What services do you offer?", "Do you provide catering?", "Tell me about your delivery service"

3. getFAQs(category?, search?)
   - Call this function when a user asks common questions about shipping, returns, or store policies.
   - Use the 'category' parameter to filter FAQs by category.
   - Use the 'search' parameter to find specific information.
   - Examples: "What's your return policy?", "How long does shipping take?", "Do you ship internationally?"

4. getDocuments(search?)
   - Call this function when a user asks about detailed information, recipes, guides, or documentation.
   - Use the 'search' parameter to find specific documents or content.
   - This function searches through uploaded documents, manuals, recipes, and detailed guides.
   - Examples: "Do you have any recipes?", "Show me cooking instructions", "Any guides about Italian cuisine?", "Tell me about traditional preparation methods"

IMPORTANT: Always use these functions to retrieve accurate, up-to-date information rather than making assumptions about product availability or store policies. When a user asks about products, services, common questions, or detailed information, call the appropriate function before responding.

Remember: Be helpful, informative, and enthusiastic about Italian cuisine and culture. Create an experience that transports customers to Italy through your knowledge and passion. If you don't know an answer, be honest and suggest contacting our specialty food expert at support@gustoitaliano.com.

Buon appetito!`;

const initialConfig: IAgentConfig = {
  id: '1',
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  model: 'gpt-4-turbo',
  prompt: DEFAULT_PROMPT,
  updatedAt: new Date().toISOString()
};

// Help content for parameter explanations
const helpContent = {
  temperature: {
    title: "Temperature",
    content: (
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <p><strong>Range:</strong> 0.0 to 1.0</p>
        <p><strong>Default:</strong> 0.7</p>
        <p><strong>What it does:</strong> Controls randomness in the AI's responses. Lower values make responses more focused and deterministic, while higher values make them more creative and diverse.</p>
        <p className="font-semibold mt-2">Examples:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>0.0:</strong> Very focused, almost deterministic responses. The model will consistently choose the most probable next token.</li>
          <li><strong>0.3:</strong> Balanced and predictable, good for factual responses.</li>
          <li><strong>0.7:</strong> Creative but still coherent, good for general conversation.</li>
          <li><strong>1.0:</strong> Maximum randomness, can produce very creative but sometimes incoherent responses.</li>
        </ul>
        <p className="italic mt-2">Recommendation: Use lower values (0.1-0.4) for factual or technical tasks, and higher values (0.6-0.8) for creative or conversational tasks.</p>
      </div>
    )
  },
  topP: {
    title: "Top P (Nucleus Sampling)",
    content: (
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <p><strong>Range:</strong> 0.0 to 1.0</p>
        <p><strong>Default:</strong> 0.9</p>
        <p><strong>What it does:</strong> Controls diversity by dynamically selecting from the smallest set of tokens whose cumulative probability exceeds the Top P value. Lower values make responses more focused, higher values allow more diversity.</p>
        <p className="font-semibold mt-2">Examples:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>0.1:</strong> Very focused on the most likely tokens only.</li>
          <li><strong>0.5:</strong> Considers only the most probable 50% of options.</li>
          <li><strong>0.9:</strong> Considers a wide range of options but excludes very unlikely tokens.</li>
          <li><strong>1.0:</strong> Considers all possible tokens based on their probability.</li>
        </ul>
        <p className="italic mt-2">Recommendation: Works well with Temperature. For most use cases, a value between 0.7-0.9 provides good results. Lower values (0.3-0.5) for more factual responses.</p>
      </div>
    )
  },
  maxTokens: {
    title: "Max Tokens",
    content: (
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        <p><strong>Range:</strong> 1 to 4000+</p>
        <p><strong>Default:</strong> 500</p>
        <p><strong>What it does:</strong> Sets the maximum length of the AI's response in tokens (roughly 4 characters per token in English). This limits how long the response can be.</p>
        <p className="font-semibold mt-2">Examples:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>100:</strong> Very short responses, about 75 words.</li>
          <li><strong>500:</strong> Medium-length responses, about 375 words.</li>
          <li><strong>1000:</strong> Longer, detailed responses, about 750 words.</li>
          <li><strong>2000+:</strong> Very detailed, comprehensive responses.</li>
        </ul>
        <p className="italic mt-2">Recommendation: Set based on your needs. For chat interactions, 500-1000 is usually sufficient. For longer content generation, use 1500+. Remember that higher values increase API costs.</p>
      </div>
    )
  }
};

const AgentConfigPage: React.FC = () => {
  const [config, setConfig] = useState<IAgentConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch agent configuration on component mount
  useEffect(() => {
    const fetchAgentConfig = async () => {
      try {
        setIsLoading(true);
        const data = await getAgentConfig();
        console.log("Fetched config:", data); // Debug log
        
        // Ensure prompt is never null or undefined by providing the default
        const configWithValidPrompt = {
          ...data,
          prompt: data.prompt || DEFAULT_PROMPT
        };
        
        setConfig(configWithValidPrompt);
      } catch (error) {
        console.error('Failed to fetch agent configuration:', error);
        toast({
          title: "Error",
          description: "Failed to load agent configuration.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgentConfig();
  }, [toast]);

  const handleTemperatureChange = (value: number[]) => {
    setConfig({
      ...config,
      temperature: value[0]
    });
  };

  const handleTopPChange = (value: number[]) => {
    setConfig({
      ...config,
      topP: value[0]
    });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setConfig({
      ...config,
      maxTokens: isNaN(value) ? 0 : value
    });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setConfig({
      ...config,
      prompt: e.target.value
    });
  };

  const handleModelChange = (value: string) => {
    setConfig({
      ...config,
      model: value
    });
  };

  const handleSave = async () => {
    // Debug logs
    console.log("Saving config:", config);
    console.log("Prompt value:", config.prompt);
    console.log("Prompt length:", config.prompt?.length || 0);
    console.log("Prompt is empty:", !config.prompt || config.prompt.trim() === '');
    
    // Validate form values
    if (config.temperature < 0 || config.temperature > 1) {
      toast({
        title: "Validation Error",
        description: "Temperature must be between 0 and 1",
        variant: "destructive",
      });
      return;
    }

    if (config.topP < 0 || config.topP > 1) {
      toast({
        title: "Validation Error",
        description: "Top P must be between 0 and 1",
        variant: "destructive",
      });
      return;
    }

    if (config.maxTokens <= 0) {
      toast({
        title: "Validation Error",
        description: "Max tokens must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!config.prompt || !config.prompt.trim()) {
      toast({
        title: "Validation Error",
        description: "Prompt is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Ensure prompt is not null or undefined before sending to API
      const configToSave = {
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        topP: config.topP,
        model: config.model,
        prompt: config.prompt || DEFAULT_PROMPT // Fallback to default if somehow still null
      };
      
      // Send update request to API using the agentApi service
      const updatedConfig = await updateAgentConfig(configToSave);
      
      // Update local state with response data, ensuring prompt is valid
      setConfig({
        ...updatedConfig,
        prompt: updatedConfig.prompt || DEFAULT_PROMPT
      });
      
      toast({
        title: "Settings saved",
        description: "Your agent configuration has been updated.",
      });
    } catch (error) {
      console.error('Failed to update agent configuration:', error);
      toast({
        title: "Error",
        description: "Failed to update agent configuration.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-shopme-50 to-green-50 rounded-xl p-6 border border-shopme-100 animate-slide-up">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-shopme-500 to-shopme-600 rounded-lg flex items-center justify-center shadow-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agent Configuration</h1>
            <p className="text-gray-600">Configure your AI chatbot's behavior and responses</p>
          </div>
        </div>
      </div>

      <form onSubmit={(e) => { 
        e.preventDefault(); 
        console.log("Form submitted, prompt value:", config.prompt); // Debug log
        handleSave(); 
      }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Prompt Section */}
          <div className="lg:col-span-2 animate-scale-in">
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">System Prompt</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      This is the prompt that guides your AI assistant's behavior and knowledge base
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  name="prompt"
                  value={config.prompt || ''}
                  onChange={handlePromptChange}
                  className="min-h-[600px] font-mono text-sm w-full border-gray-200 focus:border-shopme-500 focus:ring-shopme-500 transition-colors"
                  placeholder="Enter system prompt..."
                  required
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Model Settings Section */}
          <div className="lg:col-span-1 space-y-6 animate-scale-in" style={{ animationDelay: '0.1s' }}>
            <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <Sliders className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold text-gray-900">Model Settings</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      Configure the AI model and its parameters
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Model Selection */}
                <div className="space-y-3">
                  <Label htmlFor="model" className="text-sm font-medium text-gray-700">Model</Label>
                  <Select 
                    name="model"
                    value={config.model} 
                    onValueChange={handleModelChange}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-shopme-500 focus:ring-shopme-500">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_MODELS.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="temperature" className="text-sm font-medium text-gray-700">
                      Temperature: <span className="font-bold text-shopme-600">{config.temperature.toFixed(1)}</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 hover:bg-gray-100">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                          <span className="sr-only">Temperature info</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-0 shadow-xl">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">{helpContent.temperature.title}</h4>
                          <div className="text-sm">
                            {helpContent.temperature.content}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="relative">
                    <Input
                      type="range"
                      id="temperature"
                      name="temperature"
                      min={0}
                      max={1}
                      step={0.1}
                      value={config.temperature}
                      onChange={(e) => handleTemperatureChange([parseFloat(e.target.value)])}
                      disabled={isLoading}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Controls randomness: Lower values are more focused and deterministic, higher values are more creative.
                  </p>
                </div>
                
                {/* Top P */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="top-p" className="text-sm font-medium text-gray-700">
                      Top P: <span className="font-bold text-shopme-600">{config.topP.toFixed(1)}</span>
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 hover:bg-gray-100">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                          <span className="sr-only">Top P info</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-0 shadow-xl">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">{helpContent.topP.title}</h4>
                          <div className="text-sm">
                            {helpContent.topP.content}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    type="range"
                    id="topP"
                    name="topP"
                    min={0}
                    max={1}
                    step={0.1}
                    value={config.topP}
                    onChange={(e) => handleTopPChange([parseFloat(e.target.value)])}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Nucleus sampling: Only consider tokens with the top P% probability mass.
                  </p>
                </div>
                
                {/* Max Tokens */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="max-tokens" className="text-sm font-medium text-gray-700">Max Tokens</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0 hover:bg-gray-100">
                          <HelpCircle className="h-4 w-4 text-gray-400" />
                          <span className="sr-only">Max Tokens info</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 border-0 shadow-xl">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">{helpContent.maxTokens.title}</h4>
                          <div className="text-sm">
                            {helpContent.maxTokens.content}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input
                    id="maxTokens"
                    name="maxTokens"
                    type="number"
                    min={1}
                    max={4000}
                    value={config.maxTokens}
                    onChange={handleMaxTokensChange}
                    className="border-gray-200 focus:border-shopme-500 focus:ring-shopme-500"
                  />
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Maximum number of tokens to generate in a response.
                  </p>
                </div>
                
                {/* Save Button */}
                <Button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-shopme-500 to-shopme-600 hover:from-shopme-600 hover:to-shopme-700 text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 mt-6"
                  disabled={isSaving || isLoading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AgentConfigPage;
