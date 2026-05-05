import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { useEffect } from 'react';
import { startHealthMonitoring } from './lib/health';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';

export default function App() {
  useEffect(() => {
    // Start health monitoring (check every 5 minutes)
    startHealthMonitoring(300000);
    
  }, []);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
      <CookieConsentBanner />
    </ErrorBoundary>
  );
}