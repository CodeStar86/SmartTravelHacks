import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { getAffiliateRedirectUrl } from '../lib/api';
import { AlertCircle } from 'lucide-react';

import { logger } from '../lib/logger';
export default function AffiliateRedirect() {
  const { slug } = useParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      handleRedirect();
    }
  }, [slug]);

  async function handleRedirect() {
    try {
      const referrer = document.referrer || window.location.href;
      const redirectUrl = getAffiliateRedirectUrl(slug!, referrer);
      window.location.replace(redirectUrl);
    } catch (error: any) {
      logger.error('[AffiliateRedirect] Redirect error:', error);
      
      // Check if it's a 404 (affiliate not found)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setError(`Affiliate link "${slug}" not found. Please create it in the admin dashboard at /admin/affiliates`);
      } else {
        setError(`Failed to redirect: ${error.message || 'Unknown error'}`);
      }
      
      // Redirect to home after 5 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 5000);
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-xl font-bold mb-2 text-gray-900">Redirect Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-left">
            <p className="font-semibold text-blue-900 mb-2">How to fix this:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Go to <code className="bg-blue-100 px-1 rounded">/admin/affiliates</code></li>
              <li>Click "New Link"</li>
              <li>Create a link with slug: <code className="bg-blue-100 px-1 rounded">{slug}</code></li>
              <li>Set the destination URL to your actual affiliate link</li>
            </ol>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            Redirecting to homepage in 5 seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p>Redirecting to {slug}...</p>
        <p className="text-xs text-gray-500 mt-2">Tracking click and preparing redirect...</p>
      </div>
    </div>
  );
}
