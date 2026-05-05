import { useSettings } from '../../context/SettingsContext';

interface AdSenseAdProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
}

export function AdSenseAd(_props: AdSenseAdProps) {
  const { settings } = useSettings();

  // The AdSense publisher/client ID is intentionally not exposed through the public settings API.
  // Ads should be injected by a backend-controlled page/template layer if enabled.
  if (!settings?.adsense_enabled) {
    return null;
  }

  return null;
}

// Helper component for in-article ads
export function InArticleAd() {
  return (
    <div className="my-8 text-center">
      <p className="text-xs text-gray-500 mb-2">Advertisement</p>
      <AdSenseAd slot="1234567890" format="auto" />
    </div>
  );
}