export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isActive?: boolean;
}

export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  tags: string[];
  isActive?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  price?: number;
  tags?: string[];
  isActive?: boolean;
}

export interface ServiceFilters {
  search?: string;
  tags?: string[];
} 