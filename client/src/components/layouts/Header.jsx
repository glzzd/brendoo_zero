import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  LogOut,
  User,
  Bell,
  Search,
  Globe,
  Settings,
  UserCircle
} from 'lucide-react';

const Header = ({ sidebarCollapsed }) => {
  const { logout, user } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-4 md:px-6 ml-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">{t('dashboard')}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Bell className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-2"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-medium">{language === 'az' ? 'AZ' : 'EN'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem 
                onClick={() => language !== 'az' && toggleLanguage()}
                className={`cursor-pointer ${language === 'az' ? 'bg-accent' : ''}`}
              >
                <span className="flex items-center space-x-2">
                  <span>🇦🇿</span>
                  <span>Azərbaycan</span>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => language !== 'en' && toggleLanguage()}
                className={`cursor-pointer ${language === 'en' ? 'bg-accent' : ''}`}
              >
                <span className="flex items-center space-x-2">
                  <span>🇺🇸</span>
                  <span>English</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email || t('username')}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserCircle className="h-4 w-4 mr-2" />
                {t('profile')}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;