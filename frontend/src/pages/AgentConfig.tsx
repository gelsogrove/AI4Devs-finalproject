import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { AI_MODELS, AgentConfig as IAgentConfig } from '@/types/agentConfig';
import React, { useState } from 'react';

// Mock initial agent configuration
const initialConfig: IAgentConfig = {
  id: '1',
  temperature: 0.7,
  maxTokens: 500,
  topP: 0.9,
  topQ: 0.9,
  model: 'gpt-4-turbo',
  prompt: `You are a friendly, knowledgeable assistant for an Italian specialty foods store called 'Gusto Italiano'.

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
- Our specialty categories: pasta, olive oils, vinegars, cheeses, cured meats, wines, truffles, sauces, pastries
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

Remember: Be helpful, informative, and enthusiastic about Italian cuisine and culture. Create an experience that transports customers to Italy through your knowledge and passion. If you don't know an answer, be honest and suggest contacting our specialty food expert at support@gustoitaliano.com.

Buon appetito!`,
  updatedAt: new Date().toISOString()
};

const AgentConfigPage: React.FC = () => {
  const [config, setConfig] = useState<IAgentConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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

  const handleTopQChange = (value: number[]) => {
    setConfig({
      ...config,
      topQ: value[0]
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
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    toast({
      title: "Settings saved",
      description: "Your agent configuration has been updated.",
    });
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Agent Configuration</h1>
        <p className="text-gray-600">Configure your AI chatbot's behavior and responses</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                This is the prompt that guides your AI assistant's behavior and knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config.prompt}
                onChange={handlePromptChange}
                className="min-h-[600px] font-mono text-sm w-full"
                placeholder="Enter system prompt..."
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Settings</CardTitle>
              <CardDescription>
                Configure the AI model and its parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Select 
                  value={config.model} 
                  onValueChange={handleModelChange}
                >
                  <SelectTrigger>
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
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="temperature">Temperature: {config.temperature.toFixed(1)}</Label>
                </div>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={handleTemperatureChange}
                />
                <p className="text-xs text-gray-500">
                  Controls randomness: Lower values are more focused and deterministic, higher values are more creative.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="top-p">Top P: {config.topP.toFixed(1)}</Label>
                </div>
                <Slider
                  id="top-p"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.topP]}
                  onValueChange={handleTopPChange}
                />
                <p className="text-xs text-gray-500">
                  Nucleus sampling: Only consider tokens with the top P% probability mass.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="top-q">Top Q: {config.topQ.toFixed(1)}</Label>
                </div>
                <Slider
                  id="top-q"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.topQ]}
                  onValueChange={handleTopQChange}
                />
                <p className="text-xs text-gray-500">
                  Quality threshold: Only consider tokens above this quality threshold.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min={1}
                  max={4000}
                  value={config.maxTokens}
                  onChange={handleMaxTokensChange}
                />
                <p className="text-xs text-gray-500">
                  Maximum number of tokens to generate in a response.
                </p>
              </div>
              
              <Button 
                className="w-full bg-shopme-500 hover:bg-shopme-600 mt-4" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AgentConfigPage;
