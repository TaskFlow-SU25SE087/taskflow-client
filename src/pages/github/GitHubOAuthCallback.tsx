import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader } from '../../components/ui/loader';
import { useWebhooks } from '../../hooks/useWebhooks';

export default function GitHubOAuthCallback() {
  const { handleOAuthCallback } = useWebhooks();
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    if (errorParam) {
      setError(errorDescription || 'OAuth authentication failed');
      return;
    }

    if (!code || !state) {
      setError('Missing OAuth parameters');
      return;
    }

    const processCallback = async () => {
      try {
        await handleOAuthCallback({ code, state });
        // Success - redirect back to the original page
        // The state parameter should contain the return URL
        const stateData = JSON.parse(decodeURIComponent(state));
        navigate(stateData.returnUrl || '/projects', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process OAuth callback');
      }
    };

    processCallback();
  }, [location, handleOAuthCallback, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Failed</h3>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/projects')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <Loader className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Authentication</h3>
          <p className="text-sm text-gray-600">
            Please wait while we complete the GitHub authentication...
          </p>
        </div>
      </div>
    </div>
  );
} 