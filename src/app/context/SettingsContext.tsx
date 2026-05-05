import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchSettings } from '../lib/api';
import { normalizeSettings, getDefaultSettings } from '../lib/migrations';

import { logger } from '../lib/logger';
interface Settings {
  site_name?: string;
  site_title?: string;
  site_description: string;
  site_url: string;
  logo_url?: string;
  logo_width?: number;
  logo_height?: number;
  adsense_enabled?: boolean;
  gsc_verification?: string;
  social_tiktok?: string;
  social_instagram?: string;
  social_facebook?: string;
  social_youtube?: string;
}

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  refreshSettings: () => Promise<void>;
  isLoaded: boolean; // Track if settings have been loaded from backend (vs defaults)
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(getDefaultSettings());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadSettings = async () => {
    try {
      setError(null);
      const data = await fetchSettings();
      
      // Normalize settings to ensure backward compatibility
      const normalized = normalizeSettings(data);
      setSettings(normalized);
      setIsLoaded(true); // Mark as loaded from backend
    } catch (error: any) {
      // Silently use default settings if backend isn't available
      // This allows the app to work even if the server hasn't been deployed yet
      logger.warn('Settings not available from backend, using defaults:', error.message);
      setError(null); // Don't show error to user
      
      // Use default settings as fallback (for SEO)
      setSettings(getDefaultSettings());
      setIsLoaded(false); // Mark as NOT loaded from backend
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, error, refreshSettings: loadSettings, isLoaded }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}