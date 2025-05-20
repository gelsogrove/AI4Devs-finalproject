
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, 
  ShoppingBag, 
  HelpCircle, 
  Settings, 
  MessageSquare, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';

const MainLayout: React.FC = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const navItems = [
    { icon: <Home size={20} />, text: 'Dashboard', path: '/dashboard' },
    { icon: <ShoppingBag size={20} />, text: 'Products', path: '/products' },
    { icon: <HelpCircle size={20} />, text: 'FAQs', path: '/faqs' },
    { icon: <Settings size={20} />, text: 'Agent Settings', path: '/agent-config' },
    { icon: <MessageSquare size={20} />, text: 'Chatbot', path: '/chatbot' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden mr-2" 
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-xl font-bold text-shopme-600">ShopMe</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden md:inline-block mr-2">
              {auth.user?.name || auth.user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout} 
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut size={18} className="mr-1" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={closeMobileSidebar}
        />
      )}
      
      {/* Sidebar and content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={`
            fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-transform transform 
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-4 md:p-6 flex flex-col h-full">
            <div className="flex justify-between items-center md:hidden">
              <h2 className="font-semibold text-lg text-shopme-600">Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={closeMobileSidebar}
              >
                <X size={18} />
              </Button>
            </div>
            
            <nav className="mt-6 flex flex-col gap-1 flex-1">
              {navItems.map((item, index) => (
                <NavLink
                  key={index}
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3 rounded-md transition-colors
                    ${isActive 
                      ? 'bg-shopme-50 text-shopme-600 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                  onClick={closeMobileSidebar}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </NavLink>
              ))}
            </nav>
            
            <div className="mt-auto pt-4 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                <p>ShopMe MVP Version</p>
                <p>© {new Date().getFullYear()} ShopMe</p>
              </div>
            </div>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <div className="container mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
