import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get company information (alias for getProfile)
 * Used when customers ask about company name, phone, email, address, timing, business sector, description
 */
export const getCompanyInfo = async () => {
  try {
    logger.info('getCompanyInfo called (alias for getProfile)');
    
    const profile = await prisma.profile.findFirst();
    
    if (!profile) {
      logger.warn('No profile found in database');
      return {
        error: 'Company profile not found'
      };
    }
    
    // Return profile information excluding phone number for privacy
    return {
      companyName: profile.companyName,
      description: profile.description,
      website: profile.website,
      email: profile.email,
      openingTime: profile.openingTime,
      address: profile.address,
      sector: profile.sector,
      total: 1 // For consistency with other functions
    };
  } catch (error) {
    logger.error('Error getting company info:', error);
    return {
      error: 'Failed to fetch company information',
      total: 0
    };
  }
}; 