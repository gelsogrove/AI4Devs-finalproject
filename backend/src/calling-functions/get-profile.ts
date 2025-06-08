import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get company profile information
 * Used when customers ask about company location, website, opening hours, etc.
 * Note: Phone number is excluded as it's used for WhatsApp configuration
 */
export const getProfile = async () => {
  try {
    // logger.info('getProfile called');
    
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
      sector: profile.sector
    };
  } catch (error) {
    logger.error('Error getting profile:', error);
    return {
      error: 'Failed to fetch company profile'
    };
  }
}; 