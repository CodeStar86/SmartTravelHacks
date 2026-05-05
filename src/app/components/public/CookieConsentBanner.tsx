import { useEffect, useState } from 'react';
import { Cookie } from 'lucide-react';
import { Button } from '../ui/button';

const CONSENT_STORAGE_KEY = 'smarttravelhacks_cookie_consent';
type CookieConsentChoice = 'accepted' | 'rejected';

declare global {
  interface Window {
    smartTravelHacksCookieConsent?: CookieConsentChoice;
  }
}

function getStoredConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    return value === 'accepted' || value === 'rejected' ? value : null;
  } catch {
    return null;
  }
}

function saveConsent(choice: CookieConsentChoice) {
  window.smartTravelHacksCookieConsent = choice;

  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch {
    // Consent still lives on window for the current session if localStorage is unavailable.
  }

  window.dispatchEvent(new CustomEvent('smarttravelhacks:cookie-consent', { detail: choice }));
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existingConsent = getStoredConsent();

    if (existingConsent) {
      window.smartTravelHacksCookieConsent = existingConsent;
      return;
    }

    setVisible(true);
  }, []);

  if (!visible) return null;

  const handleChoice = (choice: CookieConsentChoice) => {
    saveConsent(choice);
    setVisible(false);
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Cookie className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Cookies and privacy</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              We use essential cookies for core site features. With your consent, we may also use analytics, advertising, and affiliate tracking technologies to improve Smart Travel Hacks and measure performance.
              {' '}
              <a href="/privacy" className="font-medium text-blue-600 underline underline-offset-4 hover:text-blue-700">
                Read our Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:flex-shrink-0">
          <Button type="button" variant="outline" onClick={() => handleChoice('rejected')}>
            Reject non-essential
          </Button>
          <Button type="button" onClick={() => handleChoice('accepted')}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}

export { CONSENT_STORAGE_KEY };
