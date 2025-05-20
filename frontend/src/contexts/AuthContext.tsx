
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthState, LoginCredentials, User } from '@/types/auth';
import { useToast } from '@/components/ui/use-toast';

interface AuthContextType {
  auth: AuthState;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API for demo purposes
const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Demo credentials check
  if (credentials.email === 'demo@shopme.com' && credentials.password === 'password') {
    return {
      user: {
        id: '1',
        email: 'demo@shopme.com',
        name: 'Demo User'
      },
      token: 'mock-jwt-token'
    };
  }
  
  throw new Error('Invalid credentials');
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    token: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuth({
          user,
          token: storedToken,
          isAuthenticated: true
        });
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { user, token } = await mockLogin(credentials);
      
      // Save to state
      setAuth({
        user,
        token,
        isAuthenticated: true
      });
      
      // Save to localStorage for persistence
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name || user.email}!`,
      });
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Invalid email or password.",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear state
    setAuth({
      user: null,
      token: null,
      isAuthenticated: false
    });
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    toast({
      title: "Logged out",
      description: "You have been successfully logged out."
    });
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
