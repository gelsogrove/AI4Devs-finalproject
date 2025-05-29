import { TechStackChecklist } from '@/components/slashpage/TechStackChecklist';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';

interface SplashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SplashModal: React.FC<SplashModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-shopme-600 text-3xl font-bold text-center">
            Welcome to ShopMefy MVP!
          </DialogTitle>
          <DialogDescription className="text-center text-lg text-gray-600">
            Your complete Italian food e-commerce platform is ready! 
            This MVP showcases all the essential features for managing products, 
            services, FAQs, and AI-powered customer support.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column - Main Content (70%) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-gradient-to-r from-green-50 to-shopme-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🇮🇹</span>
                About ShopMefy
              </h3>
              <p className="text-gray-700 leading-relaxed">
                <strong>ShopMefy</strong> is a complete e-commerce platform for authentic Italian food products
                featuring an AI-powered chatbot, comprehensive product management, 
                and seamless customer experience. Built with modern technologies 
                and designed for scalability.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  AI Assistant
                </h4>
                <p className="text-blue-800 text-sm">
                  Sofia, your AI assistant, can search products, answer FAQs, 
                  and provide personalized recommendations using advanced language models.
                </p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <span className="text-lg">📱</span>
                  WhatsApp Integration
                </h4>
                <p className="text-purple-800 text-sm">
                  This MVP demonstrates how <strong>ShopMefy</strong> integrates with WhatsApp to create
                  a seamless omnichannel customer experience.
                </p>
              </div>
            </div>
            
            <div className="bg-green-50 p-5 rounded-xl border border-green-200">
              <h4 className="font-bold mb-3 text-green-700 flex items-center gap-2">
                ✅ Production Ready
              </h4>
              <p className="text-sm text-green-600 leading-relaxed">
                This MVP demonstrates how <strong>ShopMefy</strong> integrates with WhatsApp to create 
                a seamless shopping experience. The platform features complete testing, modern architecture, 
                and is ready for production deployment.
              </p>
            </div>

            {/* Get Started Button - Centered */}
            <div className="pt-4 border-t border-gray-200 flex justify-center">
              <Button 
                onClick={onClose} 
                className="bg-gradient-to-r from-green-500 to-shopme-600 hover:from-green-600 hover:to-shopme-700 text-white font-semibold py-3 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                🚀 Get Started - Explore the Platform
              </Button>
            </div>
          </div>

          {/* Right Column - Tech Stack */}
          <div className="lg:col-span-3">
            <TechStackChecklist />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SplashModal;
