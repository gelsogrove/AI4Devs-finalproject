export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  category: string;
  tags?: string[];
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  tags?: string[];
}

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  countOnly?: boolean;
} 