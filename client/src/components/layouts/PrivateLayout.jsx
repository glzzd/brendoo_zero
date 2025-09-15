import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';

const PrivateLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);



  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* Main Content */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'md:pl-16' : 'md:pl-80'
      }`}>
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default PrivateLayout;