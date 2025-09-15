import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PublicLayout from './components/layouts/PublicLayout';
import PrivateLayout from './components/layouts/PrivateLayout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import StoreList from './pages/stores/StoreList';
import AddStore from './pages/stores/AddStore';
import ScraperList from './pages/scrapers/ScraperList';
import ScraperProducts from './pages/scrapers/ScraperProducts';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; // or a proper loading component
  }
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};



function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <PublicLayout>
                  <Login />
                </PublicLayout>
              </PublicRoute>
            }
          />
          
          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <Dashboard />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/stores/list"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <StoreList />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/stores/new"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <AddStore />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/scrapers/list"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <ScraperList />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/scrapers/:scraperId/products"
            element={
              <ProtectedRoute>
                <PrivateLayout>
                  <ScraperProducts />
                </PrivateLayout>
              </ProtectedRoute>
            }
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          

        </Routes>
        </Router>
      </AuthProvider>
      <Toaster position="top-right" richColors />
    </LanguageProvider>
  );
}

export default App;
