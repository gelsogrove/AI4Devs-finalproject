export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  tags: string[];
  stock?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  tags: string[];
  stock?: number;
}

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  tags?: string[];
  stock?: number;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  stock?: number;
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
}
