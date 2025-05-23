export interface CreateFAQDto {
  question: string;
  answer: string;
  category: string;
  tags?: string[];
}

export interface UpdateFAQDto {
  question?: string;
  answer?: string;
  category?: string;
  tags?: string[];
}

export interface FAQFilters {
  category?: string;
  search?: string;
  tags?: string[];
} 