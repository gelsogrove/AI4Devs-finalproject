/**
 * Generate embeddings for FAQs
 */
export const generateEmbeddings = async (faqId?: string) => {
  const url = faqId ? `/api/faqs/embeddings/${faqId}` : '/api/faqs/embeddings';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate embeddings');
  }
  
  return response.json();
}; 