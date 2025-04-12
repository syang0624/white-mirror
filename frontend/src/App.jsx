import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import Auth from "./pages/Auth";
import ChatPage from "./pages/ChatPage";
import Dashboard from "./pages/Dashboard";

// Check if user is authenticated
const isAuthenticated = () => {
  return localStorage.getItem('authToken') !== null;
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check authentication status on component mount
  useEffect(() => {
    setIsLoggedIn(isAuthenticated());
  }, []);

  // Wrapper component for protected routes
  const ProtectedRoute = ({ children }) => {
    // Check authentication status again when route changes
    const currentAuthStatus = isAuthenticated();
    
    if (!currentAuthStatus) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={isLoggedIn ? <Navigate to="/" replace /> : <Auth onLogin={(value) => {
            setIsLoggedIn(value);
            if (value) localStorage.setItem('authToken', 'your-token');
          }} />} 
        />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        {/* Redirect all other routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;