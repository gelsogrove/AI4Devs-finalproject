export interface FAQ {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  isActive: boolean;
}

export interface CreateFAQDto {
  question: string;
  answer: string;
  isActive?: boolean;
}

export interface UpdateFAQDto {
  question?: string;
  answer?: string;
  isActive?: boolean;
}

export interface FAQFilters {
  search?: string;
}
