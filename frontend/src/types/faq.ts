export interface FAQ {
  id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
}

export interface CreateFAQDto {
  question: string;
  answer: string;
}

export interface UpdateFAQDto {
  question?: string;
  answer?: string;
}

export interface FAQFilters {
  search?: string;
}
