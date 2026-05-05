import { Link } from 'react-router';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Button } from '../components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="404 - Page Not Found" description="Page not found" robotsIndex={false} />
      <PublicHeader />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">404</h1>
          <p className="text-2xl mb-8">Page not found</p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
