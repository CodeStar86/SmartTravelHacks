import { ExternalLink } from 'lucide-react';
import { getAffiliateRedirectUrl } from '../../lib/api';

interface AffiliateLinkProps {
  slug: string;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
}

export function AffiliateLink({ slug, children, className = '', showIcon = true }: AffiliateLinkProps) {
  const href = getAffiliateRedirectUrl(slug, typeof document !== 'undefined' ? document.referrer || window.location.href : undefined);

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline font-medium ${className}`}
      rel="noopener sponsored"
    >
      {children}
      {showIcon && <ExternalLink size={14} className="inline" />}
    </a>
  );
}
