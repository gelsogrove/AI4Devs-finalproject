import bcrypt from 'bcrypt';
import logger from './logger';

// Constants
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePasswords = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  try {
    // Log for debugging
    logger.info(`Comparing password with hash: ${hashedPassword.substring(0, 10)}...`);
    
    const result = await bcrypt.compare(plainPassword, hashedPassword);
    
    logger.info(`Password comparison result: ${result}`);
    return result;
  } catch (error) {
    logger.error(`Password comparison error: ${error}`);
    return false;
  }
};

// For testing only
export const checkTestPassword = async (): Promise<void> => {
  const testPassword = 'password123';
  const testHash = '$2b$10$dWd6JwUQUl47jP.4kUelweOfYTU/7PF8VJZIq5LGiTSLp0og/JwOu';
  
  try {
    const result = await bcrypt.compare(testPassword, testHash);
    logger.info(`Test password check result: ${result}`);
  } catch (error) {
    logger.error(`Test password check error: ${error}`);
  }
}; 