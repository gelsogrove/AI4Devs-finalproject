
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock FAQ data
const mockFAQs = [
  {
    id: '1',
    question: 'How long does shipping take?',
    answer: 'Standard shipping takes 3-5 business days within Europe and 7-10 business days for international orders. Express shipping options are available at checkout.',
    category: 'Shipping',
    isPublished: true,
    createdAt: '2023-05-10T10:00:00Z',
    updatedAt: '2023-05-10T10:00:00Z'
  },
  {
    id: '2',
    question: 'What is your return policy?',
    answer: 'We accept returns within 30 days of delivery. The product must be unused, in its original packaging, and in the same condition you received it. Please contact our customer service to initiate a return.',
    category: 'Returns',
    isPublished: true,
    createdAt: '2023-05-11T10:00:00Z',
    updatedAt: '2023-05-11T10:00:00Z'
  },
  {
    id: '3',
    question: 'Do you ship internationally?',
    answer: 'Yes, we ship to most countries worldwide. Shipping costs and delivery times vary by location. You can see the exact shipping cost at checkout before completing your purchase.',
    category: 'Shipping',
    isPublished: true,
    createdAt: '2023-05-12T10:00:00Z',
    updatedAt: '2023-05-12T10:00:00Z'
  },
  {
    id: '4',
    question: 'Are your products authentic Italian?',
    answer: 'Yes, all our products are authentic and imported directly from Italy. We work directly with small producers and cooperatives to ensure the highest quality and authenticity.',
    category: 'Products',
    isPublished: true,
    createdAt: '2023-05-13T10:00:00Z',
    updatedAt: '2023-05-13T10:00:00Z'
  },
  {
    id: '5',
    question: 'How do I track my order?',
    answer: 'Once your order is shipped, you will receive a confirmation email with a tracking number and link. You can use this to monitor the status of your delivery.',
    category: 'Shipping',
    isPublished: true,
    createdAt: '2023-05-14T10:00:00Z',
    updatedAt: '2023-05-14T10:00:00Z'
  },
  {
    id: '6',
    question: 'How can I contact customer service?',
    answer: 'You can reach our customer service team via email at support@shopme.com or through WhatsApp at +39 123 456 7890. Our service hours are Monday to Friday, 9 AM to 6 PM CET.',
    category: 'Support',
    isPublished: false,
    createdAt: '2023-05-15T10:00:00Z',
    updatedAt: '2023-05-15T10:00:00Z'
  }
];

// Category colors
const categoryColors: Record<string, string> = {
  'Shipping': 'bg-blue-100 text-blue-800',
  'Returns': 'bg-amber-100 text-amber-800',
  'Products': 'bg-green-100 text-green-800',
  'Support': 'bg-purple-100 text-purple-800',
  'default': 'bg-gray-100 text-gray-800'
};

const FAQs: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [faqs, setFaqs] = useState(mockFAQs);

  const filteredFAQs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (faq.category && faq.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FAQs</h1>
          <p className="text-gray-600">Manage frequently asked questions</p>
        </div>
        <Button className="bg-shopme-500 hover:bg-shopme-600">
          <Plus size={16} className="mr-2" />
          Add FAQ
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Sort</Button>
          </div>
        </div>
      </div>

      {filteredFAQs.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredFAQs.map(faq => (
            <Card key={faq.id} className={`${!faq.isPublished ? 'opacity-70' : ''}`}>
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    {faq.category && (
                      <Badge className={categoryColors[faq.category] || categoryColors.default}>
                        {faq.category}
                      </Badge>
                    )}
                    {!faq.isPublished && (
                      <Badge variant="outline" className="border-gray-300 text-gray-500">
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Edit</Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No FAQs found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </>
  );
};

export default FAQs;
