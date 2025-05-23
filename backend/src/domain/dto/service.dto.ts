export interface CreateServiceDto {
  name: string;
  description: string;
  price: number;
  tags?: string[];
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
  isActive?: boolean;
  search?: string;
  tags?: string[];
} 