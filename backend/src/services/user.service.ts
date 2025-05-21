import { comparePasswords, hashPassword } from '../utils/auth';

interface User {
  id: string;
  email: string;
  password: string;
  firstName: string | null;
  lastName: string | null;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory user store for development
const users: User[] = [
  {
    id: '1',
    email: 'test@example.com',
    password: '$2b$10$dWd6JwUQUl47jP.4kUelweOfYTU/7PF8VJZIq5LGiTSLp0og/JwOu', // password123
    firstName: 'Test',
    lastName: 'User',
    isActive: true,
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface CreateUserData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

class UserService {
  /**
   * Create a new user with hashed password
   */
  async createUser(userData: CreateUserData): Promise<Omit<User, 'password'>> {
    // Check if email already exists
    const existingUser = users.find(user => user.email === userData.email);

    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user
    const newUser = {
      id: (users.length + 1).toString(),
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      isActive: true,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);

    // Return user without password
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  /**
   * Login a user and generate JWT token
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = users.find(user => user.email === email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is inactive');
    }

    // Verify password
    const passwordMatches = await comparePasswords(password, user.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    user.updatedAt = new Date();

    // Generate a simple token for demo
    const token = 'demo-token-' + Date.now();

    // Return user info and token
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Omit<User, 'password'> | null> {
    const user = users.find(user => user.id === id);

    if (!user) {
      return null;
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export default new UserService(); 