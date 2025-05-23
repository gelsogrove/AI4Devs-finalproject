import SplashModal from '@/components/dashboard/SplashModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowRight,
    HelpCircle,
    Server,
    Settings,
    ShoppingBag
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { faqApi } from '../api/faqApi';
import { productApi } from '../api/productApi';
import { serviceApi } from '../api/serviceApi';

const Dashboard: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    faqs: 0,
    services: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Fetch data from APIs
        const [productsResult, faqsResult, servicesResult] = await Promise.all([
          productApi.getProducts(),
          faqApi.getFAQs(),
          serviceApi.getServices()
        ]);
        
        // Update stats
        setStats({
          products: productsResult.data.length,
          faqs: faqsResult.data.length,
          services: servicesResult.data.length
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to ShopMe, your Italian food e-commerce solution.</p>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Products</CardTitle>
            <CardDescription>Total products in your catalog</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-4xl font-bold text-shopme-600">{stats.products}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">FAQs</CardTitle>
            <CardDescription>Questions and answers</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-4xl font-bold text-shopme-600">{stats.faqs}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Services</CardTitle>
            <CardDescription>Available delivery services</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-10 w-16 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <p className="text-4xl font-bold text-shopme-600">{stats.services}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div className="flex overflow-x-auto gap-4 mb-8 pb-2">
        <Link to="/products" className="flex-shrink-0 w-64">
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

        <Link to="/faqs" className="flex-shrink-0 w-64">
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

        <Link to="/services" className="flex-shrink-0 w-64">
          <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <Server className="h-8 w-8 text-shopme-600 mb-2" />
              <CardTitle className="text-lg">Manage Services</CardTitle>
              <CardDescription>Create and manage services</CardDescription>
            </CardHeader>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full justify-start pl-0 text-shopme-600">
                Open Services <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </Link>

        <Link to="/agent-config" className="flex-shrink-0 w-64">
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
      </div>

      {/* Splash modal for first-time visitors */}
      <SplashModal isOpen={showSplash} onClose={() => setShowSplash(false)} />
    </>
  );
};

export default Dashboard;
