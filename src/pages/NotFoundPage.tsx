import { useAuth } from '@/hooks/useAuth';
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="space-x-4">
          {isAuthenticated ? (
            <Link 
              to="/projects" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Go to Projects
            </Link>
          ) : (
            <Link 
              to="/" 
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Back to Home
            </Link>
          )}
          <button 
            onClick={() => window.history.back()} 
            className="inline-block px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 