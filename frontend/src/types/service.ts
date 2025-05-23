export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  tags: string[];
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  tags?: string[];
}

export interface ServiceFilters {
  search?: string;
  tags?: string[];
} 