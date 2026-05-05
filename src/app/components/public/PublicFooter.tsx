import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Facebook, Instagram, Youtube } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { fetchSettings } from '../../lib/api';
import { logger } from '../../lib/logger';
import { TRAVEL_CATEGORY_GROUPS } from '../../lib/travel-categories';

function getSocialUrl(settings: any, key: string): string {
  const candidates = [
    settings?.[`social_${key}`],
    settings?.social?.[key],
    settings?.socialLinks?.[key],
    settings?.social_links?.[key],
  ];

  const raw = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  if (!raw) return '';

  const value = raw.trim();
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const { settings } = useSettings();
  const [liveSettings, setLiveSettings] = useState<any | null>(settings);

  useEffect(() => {
    setLiveSettings(settings);
  }, [settings]);

  // Fetch once in the footer as well so public social links update correctly even
  // when the SettingsProvider is still using fallback defaults after an early load.
  useEffect(() => {
    let cancelled = false;
    fetchSettings()
      .then((data) => {
        if (!cancelled && data) setLiveSettings(data);
      })
      .catch((error: any) => {
        logger.warn('Footer social settings unavailable:', error?.message || error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedSettings = liveSettings || settings;
  const socialLinks = useMemo(() => ({
    tiktok: getSocialUrl(resolvedSettings, 'tiktok'),
    instagram: getSocialUrl(resolvedSettings, 'instagram'),
    facebook: getSocialUrl(resolvedSettings, 'facebook'),
    youtube: getSocialUrl(resolvedSettings, 'youtube'),
  }), [resolvedSettings]);

  return (
    <footer className="bg-gray-950 text-gray-300 mt-auto">
      <div className="container mx-auto px-5 py-10 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {resolvedSettings?.site_title && (
              <Link to="/" className="inline-block mb-5">
                <img
                  src="/logo-light.png"
                  alt={resolvedSettings.site_title || 'Smart Travel Hacks'}
                  style={{ width: '190px', height: '40px', objectFit: 'contain' }}
                  className="max-w-full"
                />
              </Link>
            )}
            {resolvedSettings?.site_description && (
              <p className="max-w-sm text-sm leading-6 text-gray-400 mb-5">{resolvedSettings.site_description}</p>
            )}

            <div className="flex gap-3" aria-label="Social media links">
              {socialLinks.tiktok && (
                <a href={socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-black" aria-label="TikTok">
                  <TikTokIcon />
                </a>
              )}
              {socialLinks.instagram && (
                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-pink-600" aria-label="Instagram">
                  <Instagram size={18} />
                </a>
              )}
              {socialLinks.facebook && (
                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-blue-600" aria-label="Facebook">
                  <Facebook size={18} />
                </a>
              )}
              {socialLinks.youtube && (
                <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-red-600" aria-label="YouTube">
                  <Youtube size={18} />
                </a>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-9 lg:col-span-3 lg:grid-cols-3">
            {TRAVEL_CATEGORY_GROUPS.map((group) => (
              <div key={group.title} className="min-w-0">
                <h4 className="mb-4 text-base font-bold tracking-tight text-white sm:text-lg">{group.title}</h4>
                <ul className="space-y-3 text-[15px] leading-5 text-gray-300 sm:text-sm">
                  {group.items.map((item) => (
                    <li key={item.slug}>
                      <Link to={`/category/${item.slug}`} className="block break-words transition hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 border-t border-gray-800 pt-8 lg:col-span-1 lg:border-t-0 lg:pt-0">
              <h4 className="mb-4 text-base font-bold tracking-tight text-white sm:text-lg">Company</h4>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-[15px] leading-5 text-gray-300 sm:block sm:space-y-3 sm:text-sm">
                <li><Link to="/blog" className="block transition hover:text-white">Blog</Link></li>
                <li><Link to="/about" className="block transition hover:text-white">About</Link></li>
                <li><Link to="/contact" className="block transition hover:text-white">Contact</Link></li>
                <li><Link to="/privacy" className="block transition hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/affiliate-disclosure" className="block transition hover:text-white">Affiliate Disclosure</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500 sm:text-sm">
          <p>&copy; {currentYear}{resolvedSettings?.site_title ? ` ${resolvedSettings.site_title}` : ''}. All rights reserved.</p>
          <Link to="/admin" className="inline-block mt-2 text-gray-900 opacity-0 hover:opacity-0 transition text-xs cursor-default">Admin</Link>
        </div>
      </div>
    </footer>
  );
}
