import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { redirectApi } from '../../lib/api';

import { logger } from '../../lib/logger';
export default function RedirectHandler({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    async function checkRedirect() {
      try {
        // Don't check redirects for admin pages, assets, or special pages
        if (
          location.pathname.startsWith('/admin') ||
          location.pathname.startsWith('/go/') ||
          location.pathname.endsWith('.xml') ||
          location.pathname.endsWith('.txt')
        ) {
          return;
        }

        // Check if there's a redirect for this path
        const result = await redirectApi.check(location.pathname);
        
        if (result.redirect && result.to_path) {
          // If it's an external URL, use window.location
          if (result.to_path.startsWith('http')) {
            window.location.href = result.to_path;
          } else {
            // Internal redirect - use React Router
            navigate(result.to_path, { replace: true });
          }
        }
      } catch (error) {
        // Silently ignore redirect check errors if backend isn't available
        // This allows the app to work even if the server hasn't been deployed yet
        logger.warn('Redirect check skipped (backend not available):', error);
      }
    }

    checkRedirect();
  }, [location.pathname, navigate]);

  return <>{children}</>;
}