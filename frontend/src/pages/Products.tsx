import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';

// Mock product data
const mockProducts = [
  {
    id: '1',
    name: 'Parmigiano Reggiano',
    description: 'Authentic Parmigiano Reggiano aged 24 months. Imported directly from Parma, Italy.',
    price: 29.99,
    imageUrl: 'https://images.unsplash.com/photo-1634487359989-3e90c9432133?q=80&w=300&auto=format',
    category: 'Cheese',
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Extra Virgin Olive Oil',
    description: 'Cold-pressed olive oil from Tuscany. Perfect for salads and finishing dishes.',
    price: 19.99,
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=300&auto=format',
    category: 'Oils',
    createdAt: '2023-05-16T09:15:00Z',
    updatedAt: '2023-05-16T09:15:00Z'
  },
  {
    id: '3',
    name: 'Balsamic Vinegar of Modena',
    description: 'Traditional balsamic vinegar aged in wooden barrels for 12 years.',
    price: 24.99,
    imageUrl: 'https://images.unsplash.com/photo-1613163433070-231c3f1bd070?q=80&w=300&auto=format',
    category: 'Vinegars',
    createdAt: '2023-05-17T14:45:00Z',
    updatedAt: '2023-05-17T14:45:00Z'
  },
  {
    id: '4',
    name: 'Truffle Pasta',
    description: 'Handmade egg pasta with black truffle. Made in small batches in Umbria.',
    price: 15.99,
    imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=300&auto=format',
    category: 'Pasta',
    createdAt: '2023-05-18T11:20:00Z',
    updatedAt: '2023-05-18T11:20:00Z'
  },
  {
    id: '5',
    name: 'San Marzano Tomatoes',
    description: 'D.O.P certified whole peeled San Marzano tomatoes from Campania.',
    price: 8.99,
    imageUrl: 'https://images.unsplash.com/photo-1582284540020-8acbe03f4924?q=80&w=300&auto=format',
    category: 'Canned Goods',
    createdAt: '2023-05-19T16:10:00Z',
    updatedAt: '2023-05-19T16:10:00Z'
  },
  {
    id: '6',
    name: 'Pecorino Romano',
    description: "Sharp, salty sheep's milk cheese from Lazio. Perfect for pasta dishes.",
    price: 22.99,
    imageUrl: 'https://images.unsplash.com/photo-1528747045269-390fe33c19f2?q=80&w=300&auto=format',
    category: 'Cheese',
    createdAt: '2023-05-20T13:25:00Z',
    updatedAt: '2023-05-20T13:25:00Z'
  }
];

const Products: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState(mockProducts);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Products</h1>
          <p className="text-gray-600">Manage your Italian specialty product catalog</p>
        </div>
        <Button className="bg-shopme-500 hover:bg-shopme-600">
          <Plus size={16} className="mr-2" />
          Add Product
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products..."
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

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden">
              <div className="h-48 bg-gray-100 relative">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <CardDescription>{product.category}</CardDescription>
                  </div>
                  <div className="text-shopme-600 font-bold">
                    €{product.price.toFixed(2)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-gray-600 line-clamp-3">{product.description}</p>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button variant="outline" size="sm">View</Button>
                <Button variant="outline" size="sm">Edit</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filters.</p>
        </div>
      )}
    </>
  );
};

export default Products;
