
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category?: string;
  isPublished: boolean;
}
