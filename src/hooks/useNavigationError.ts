import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useNavigationError = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      // Handle navigation errors
      if (event.error?.message?.includes('navigation')) {
        console.error('Navigation error:', event.error);
        navigate('/404', { replace: true });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Handle unhandled promise rejections that might be related to routing
      if (event.reason?.message?.includes('navigation') || 
          event.reason?.message?.includes('route')) {
        console.error('Unhandled promise rejection:', event.reason);
        navigate('/404', { replace: true });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [navigate]);
}; 