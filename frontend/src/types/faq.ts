export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
}

export interface CreateFAQDto {
  question: string;
  answer: string;
  category?: string;
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
