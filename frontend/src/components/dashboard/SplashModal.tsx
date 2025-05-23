
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import React from 'react';

interface SplashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SplashModal: React.FC<SplashModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-shopme-600 text-2xl">Welcome to ShopMe MVP!</DialogTitle>
          <DialogDescription>
            Turn WhatsApp into your complete sales channel
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          <p>
            ShopMe is a SaaS platform that transforms WhatsApp into a powerful sales channel with AI-powered chatbots. 
            Our MVP demonstrates key features to showcase the platform's capabilities.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-md border border-gray-100">
            <h4 className="font-semibold mb-2">About This Demo</h4>
            <ul className="space-y-2 text-sm">
              
              <li className="flex gap-2">
                <span className="text-shopme-600">•</span>
                <span>Create and organize Prodcut Service and FAQ content</span>
              </li>
              <li className="flex gap-2">
                <span className="text-shopme-600">•</span>
                <span>Configure AI agent behavior and responses</span>
              </li>
              <li className="flex gap-2">
                <span className="text-shopme-600">•</span>
                <span>Test the chatbot with function calling capabilities</span>
              </li>
              <li className="flex gap-2">
                <span className="text-shopme-600">•</span>
                <span>Test the chatbot with embedding search</span>
              </li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            This MVP demonstrates how ShopMe integrates with WhatsApp to create a seamless shopping experience. 
            The actual WhatsApp integration is simulated in this demo.
          </p>
        </div>
        
        <DialogFooter className="mt-4">
          <Button onClick={onClose} className="w-full bg-shopme-500 hover:bg-shopme-600">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SplashModal;
