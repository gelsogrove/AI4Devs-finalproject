// Export all calling functions
export { getCompanyInfo } from './get-company-info';
export { getDocuments } from './get-documents';
export { getFAQs } from './get-faqs';
export { getProducts } from './get-products';
export { getProfile } from './get-profile';
export { getServices } from './get-services';
export { OrderCompleted } from './order-completed';

// Re-export as availableFunctions object for backward compatibility
import { getCompanyInfo } from './get-company-info';
import { getDocuments } from './get-documents';
import { getFAQs } from './get-faqs';
import { getProducts } from './get-products';
import { getProfile } from './get-profile';
import { getServices } from './get-services';
import { OrderCompleted } from './order-completed';

/**
 * Available functions for the chat agent to call
 * This object maintains backward compatibility with the existing code
 */
export const availableFunctions = {
  getProducts,
  getServices,
  getFAQs,
  getDocuments,
  getProfile,
  getCompanyInfo,
  OrderCompleted
}; 