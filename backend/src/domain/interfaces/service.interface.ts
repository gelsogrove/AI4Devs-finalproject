export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
} 