import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import { Link, Navigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  // If user is authenticated, redirect to projects page
  if (isAuthenticated) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist or has been moved.</p>
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">Back to Home</Link>
    </div>
  );
};

export default NotFoundPage; 