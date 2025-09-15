import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { menuItems } from '../../const/menuItems';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  Menu,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
  Settings,
  UserCircle
} from 'lucide-react';

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed
}) => {
  const { logout, user } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (href) => {
    if (href) {
      navigate(href);
    }
  };

  // Calculate active accordion items and active links
  const { activeAccordionItems, isLinkActive } = useMemo(() => {
    const currentPath = location.pathname;
    const activeItems = [];
    
    const checkActive = (href) => {
      return currentPath === href;
    };
    
    // Find which accordion items should be open
    menuItems.forEach((item, index) => {
      if (item.items.length > 0) {
        const hasActiveSubItem = item.items.some(subItem => checkActive(subItem.href));
        if (hasActiveSubItem) {
          activeItems.push(`item-${index}`);
        }
      }
    });
    
    return {
      activeAccordionItems: activeItems,
      isLinkActive: checkActive
    };
  }, [location.pathname]);

  const SidebarContent = ({ mobile = false }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <img src="/brendoo_logo.svg" alt="Brendoo" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">Brendoo</span>
          </div>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <Accordion type="multiple" className="w-full" defaultValue={activeAccordionItems}>
          {menuItems.map((item, index) => {
            if (item.items.length === 0) {
              return (
                <div key={index} className="mb-2">
                  <Button
                    variant="ghost"
                    className={`w-full hover:bg-gray-100 overflow-hidden ${sidebarCollapsed ? 'justify-center px-2' : 'justify-start'} ${
                      isLinkActive(item.href) ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' : ''
                    }`}
                    onClick={() => handleNavigation(item.href)}
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="truncate ml-3">{language === 'az' ? item.title : item.titleEn}</span>}
                  </Button>
                </div>
              );
            }

            if (sidebarCollapsed) {
              return (
                <div key={index} className="mb-2 relative group">
                  <Button
                    variant="ghost"
                    className="w-full justify-center group-hover:bg-transparent hover:bg-gray-100 overflow-hidden px-2"
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0" />
                  </Button>
                  {item.items.length > 0 && (
                    <div className="absolute left-full top-0 ml-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100 text-center">
                          {language === 'az' ? item.title : item.titleEn}
                        </div>
                        {item.items.map((subItem, subIndex) => (
                          <button
                            key={subIndex}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                              isLinkActive(subItem.href) 
                                ? 'bg-blue-50 text-blue-600 font-medium' 
                                : 'text-gray-700 hover:text-gray-900'
                            }`}
                            onClick={() => handleNavigation(subItem.href)}
                          >
                            {language === 'az' ? subItem.title : subItem.titleEn}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <AccordionItem key={index} value={`item-${index}`} className="border-none mb-2">
                <AccordionTrigger className="hover:bg-gray-100 px-3 py-2 rounded-md hover:no-underline">
                  <div className="flex items-center">
                    <item.icon className="h-4 w-4" />
                    <span className="truncate ml-3">{language === 'az' ? item.title : item.titleEn}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-2">
                  <div className="ml-7 space-y-1">
                    {item.items.map((subItem, subIndex) => (
                      <Button
                        key={subIndex}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start text-sm hover:bg-gray-50 overflow-hidden ${
                          isLinkActive(subItem.href)
                            ? 'bg-blue-50 text-blue-600 font-medium border-r-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => handleNavigation(subItem.href)}
                      >
                        <span className="truncate">{language === 'az' ? subItem.title : subItem.titleEn}</span>
                      </Button>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>

      {/* User Section */}
      <div className="p-4 border-t">
        {sidebarCollapsed ? (
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full p-2 justify-center"
              title={t('account', 'Account')}
            >
              <User className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full p-2 justify-center"
              title={t('settings', 'Settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="w-full p-2 justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
              title={t('logout', 'Logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username}
                </p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <UserCircle className="h-4 w-4 mr-3" />
                {t('account', 'Account')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4 mr-3" />
                {t('settings', 'Settings')}
              </Button>
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                {t('logout', 'Logout')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-80">
          <SidebarContent mobile={true} />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-50 md:bg-white md:border-r md:border-gray-200 transition-all duration-300 ${sidebarCollapsed ? 'md:w-16' : 'md:w-80'
        }`}>
        <SidebarContent />
      </aside>
    </>
  );
};

export default Sidebar;