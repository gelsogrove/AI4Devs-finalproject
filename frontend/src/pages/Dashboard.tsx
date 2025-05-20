
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  ShoppingBag, 
  HelpCircle, 
  Settings, 
  MessageSquare, 
  ArrowRight 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import SplashModal from '@/components/dashboard/SplashModal';

const Dashboard: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    faqs: 0,
    chats: 0
  });

  // Mock data fetching
  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setStats({
        products: 12,
        faqs: 8,
        chats: 24
      });
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to ShopMe, your WhatsApp e-commerce solution.</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Products</CardTitle>
            <CardDescription>Total products in your catalog</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-shopme-600">{stats.products}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">FAQs</CardTitle>
            <CardDescription>Questions and answers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-shopme-600">{stats.faqs}</p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Chat Sessions</CardTitle>
            <CardDescription>Recent customer interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-shopme-600">{stats.chats}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/products">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <ShoppingBag className="h-8 w-8 text-shopme-600 mb-2" />
              <CardTitle className="text-lg">Manage Products</CardTitle>
              <CardDescription>Add, edit or remove products</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-start pl-0 text-shopme-600">
                Open Products <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link to="/faqs">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <HelpCircle className="h-8 w-8 text-shopme-600 mb-2" />
              <CardTitle className="text-lg">Manage FAQs</CardTitle>
              <CardDescription>Create and organize FAQs</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-start pl-0 text-shopme-600">
                Open FAQs <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link to="/agent-config">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <Settings className="h-8 w-8 text-shopme-600 mb-2" />
              <CardTitle className="text-lg">Agent Settings</CardTitle>
              <CardDescription>Configure AI chatbot behavior</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-start pl-0 text-shopme-600">
                Configure Agent <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link to="/chatbot">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <MessageSquare className="h-8 w-8 text-shopme-600 mb-2" />
              <CardTitle className="text-lg">Test Chatbot</CardTitle>
              <CardDescription>Try your AI-powered chatbot</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-start pl-0 text-shopme-600">
                Open Chatbot <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </Link>
      </div>

      {/* Latest activity */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Featured Italian Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['Parmigiano Reggiano', 'Extra Virgin Olive Oil', 'Balsamic Vinegar'].map((product, index) => (
          <Card key={index} className="overflow-hidden">
            <div className="h-48 bg-gray-200 relative">
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Product Image
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{product}</CardTitle>
              <CardDescription>Authentic Italian specialty</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-gray-600 line-clamp-2">
                Premium quality imported directly from Italy. Our selection of authentic Italian products brings the taste of Italy to your home.
              </p>
            </CardContent>
            <CardFooter>
              <p className="text-shopme-600 font-bold">€24.99</p>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Splash modal for first-time visitors */}
      <SplashModal isOpen={showSplash} onClose={() => setShowSplash(false)} />
    </>
  );
};

export default Dashboard;
