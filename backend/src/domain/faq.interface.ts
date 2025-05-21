export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFAQDto {
  question: string;
  answer: string;
  category?: string;
  isPublished?: boolean;
}

export interface UpdateFAQDto {
  question?: string;
  answer?: string;
  category?: string;
  isPublished?: boolean;
}

export interface FAQFilters {
  category?: string;
  isPublished?: boolean;
  search?: string;
} 