import { Link } from 'react-router';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { settings, isLoaded } = useSettings();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center">
            {isLoaded && settings?.site_title ? (
              <img
                src="/logo-dark.png"
                alt={settings.site_title || 'Smart Travel Hacks'}
                className="h-14 w-auto max-w-[250px] object-contain sm:h-16"
              />
            ) : null}
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-700">
            <Link to="/" className="transition hover:text-sky-700">Home</Link>
            <Link to="/blog" className="transition hover:text-sky-700">Destinations</Link>
            <Link to="/travel-resources" className="transition hover:text-sky-700">Travel Resources</Link>
            <Link to="/about" className="transition hover:text-sky-700">About</Link>
            <Link to="/contact" className="transition hover:text-sky-700">Contact</Link>
          </nav>

          <button
            className="md:hidden p-2 text-slate-700"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t border-slate-200">
            <div className="flex flex-col gap-4 pb-2 text-slate-700">
              <Link to="/" className="transition hover:text-sky-700" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link to="/blog" className="transition hover:text-sky-700" onClick={() => setMobileMenuOpen(false)}>Destinations</Link>
              <Link to="/travel-resources" className="transition hover:text-sky-700" onClick={() => setMobileMenuOpen(false)}>Travel Resources</Link>
              <Link to="/about" className="transition hover:text-sky-700" onClick={() => setMobileMenuOpen(false)}>About</Link>
              <Link to="/contact" className="transition hover:text-sky-700" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
