import { useEffect, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { affiliateApi } from '../lib/api';
import { AffiliateLink } from '../types';
import { ExternalLink, Globe, Link2, Map as MapIcon, Plane, Shield, Ticket, Car, BedDouble } from 'lucide-react';

import { logger } from '../lib/logger';
function pickIcon(name: string, category?: string) {
  const value = `${name} ${category || ''}`.toLowerCase();
  if (value.includes('flight') || value.includes('avia') || value.includes('air')) return Plane;
  if (value.includes('hotel') || value.includes('stay') || value.includes('booking') || value.includes('trip.com')) return BedDouble;
  if (value.includes('ticket') || value.includes('tiqet') || value.includes('attraction')) return Ticket;
  if (value.includes('insurance') || value.includes('ekta')) return Shield;
  if (value.includes('transfer') || value.includes('pickup') || value.includes('ride') || value.includes('car')) return Car;
  if (value.includes('tour') || value.includes('guide') || value.includes('map') || value.includes('experience')) return MapIcon;
  if (value.includes('resource') || value.includes('travel')) return Globe;
  return Link2;
}


const fallbackResources = [
  {
    id: 'flight-booking-guide',
    name: 'Flight booking tools',
    category: 'Flights',
    notes: 'Compare routes, fares, baggage rules, and flexible date options before booking your next trip.',
  },
  {
    id: 'hotel-stay-guide',
    name: 'Hotel and stay resources',
    category: 'Hotels',
    notes: 'Research locations, guest reviews, cancellation terms, and total trip costs before choosing accommodation.',
  },
  {
    id: 'travel-insurance-guide',
    name: 'Travel insurance checklist',
    category: 'Insurance',
    notes: 'Review medical cover, cancellation protection, delays, baggage cover, and destination-specific requirements.',
  },
  {
    id: 'airport-transfer-guide',
    name: 'Airport transfers and transport',
    category: 'Transfers',
    notes: 'Plan airport pickups, local transport, rideshares, trains, buses, and car hire before you arrive.',
  },
  {
    id: 'ticket-tour-guide',
    name: 'Tickets, tours, and attractions',
    category: 'Activities',
    notes: 'Organize attraction tickets, guided tours, day trips, and skip-the-line options for busy destinations.',
  },
  {
    id: 'packing-budget-guide',
    name: 'Packing and budgeting resources',
    category: 'Planning',
    notes: 'Use packing lists, currency tips, travel apps, and daily budget planning to make trips easier.',
  },
];

function sortAffiliates(affiliates: AffiliateLink[]) {
  return [...affiliates].sort((a, b) => {
    const byCategory = (a.category || '').localeCompare(b.category || '');
    if (byCategory !== 0) return byCategory;
    return a.name.localeCompare(b.name);
  });
}

export default function TravelResourcesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadAffiliates() {
      try {
        const data = await affiliateApi.list();
        if (isMounted) {
          const filtered = (data.affiliates || []).filter((affiliate: AffiliateLink) => Boolean(affiliate.destination_url));
          setAffiliates(sortAffiliates(filtered));
        }
      } catch (error) {
        logger.error('Failed to load travel resources:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAffiliates();
    return () => {
      isMounted = false;
    };
  }, []);

  const featuredResource = affiliates[0];
  const resourcesToShow = affiliates.length > 0 ? affiliates : fallbackResources;
  const hasAdminResources = affiliates.length > 0;


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead
        title="Travel Resources | Smart Travel Hacks"
        description="Browse practical travel resources for booking platforms, flights, hotels, transfers, insurance, tickets, tours, packing, budgeting, and trip planning."
        keywords="travel resources, booking tools, flights, hotels, tickets, transfers, travel insurance"
      />

      <PublicHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Travel Resources</h1>
            <p className="text-xl md:text-2xl opacity-95">
              A curated hub for planning smarter trips, from flights and hotels to insurance, transfers, tours, packing, and budgeting tools.
            </p>
          </div>
        </section>

        {featuredResource ? (
          <section className="py-16">
            <div className="container mx-auto px-4 max-w-6xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-8">Featured resource</h2>
              <Card className="overflow-hidden shadow-xl border-2 border-sky-200">
                <article className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 md:p-10 bg-white">
                  <div>
                    <div className="inline-block bg-sky-100 text-sky-700 px-4 py-1 rounded-full text-sm font-semibold mb-4">
                      {featuredResource.category || 'Travel resource'}
                    </div>
                    <h3 className="text-4xl font-bold mb-3">{featuredResource.name}</h3>
                    <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                      {featuredResource.notes?.trim() || 'Open this travel partner using the direct URL you saved in Admin → Affiliate Links.'}
                    </p>
                    <a href={featuredResource.destination_url} target="_blank" rel="noopener noreferrer sponsored">
                      <Button size="lg">
                        Visit resource
                        <ExternalLink size={18} className="ml-2" />
                      </Button>
                    </a>
                  </div>
                  <div className="flex items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-emerald-500 p-12">
                    {(() => {
                      const Icon = pickIcon(featuredResource.name, featuredResource.category);
                      return <Icon className="text-white opacity-30" size={120} />;
                    })()}
                  </div>
                </article>
              </Card>
            </div>
          </section>
        ) : null}

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">All resources</h2>
                <p className="text-lg text-gray-600">
                  {loading ? 'Loading resources…' : hasAdminResources ? `${affiliates.length} resource${affiliates.length === 1 ? '' : 's'} currently published.` : 'Start here for the main tools and checklists worth reviewing before you book.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
              {resourcesToShow.map((resource) => {
                const Icon = pickIcon(resource.name, resource.category);
                const destinationUrl = 'destination_url' in resource ? resource.destination_url : '';
                return (
                  <Card
                    key={resource.id}
                    className="group h-full overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg"
                  >
                    <div className="flex h-full flex-col">
                      <div className="mb-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="mb-3 inline-flex rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                            {resource.category || 'Travel resource'}
                          </div>
                          <h3 className="text-2xl font-bold leading-tight text-gray-950">{resource.name}</h3>
                        </div>
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 ring-1 ring-sky-100 transition-colors group-hover:bg-sky-100">
                          <Icon size={24} />
                        </div>
                      </div>

                      <p className="mb-5 text-sm leading-6 text-gray-600">
                        {resource.notes?.trim() || 'A practical travel planning resource to review before your next trip.'}
                      </p>

                      {destinationUrl ? (
                        <div className="mt-auto border-t border-gray-100 pt-4">
                          <a
                            href={destinationUrl}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="inline-flex items-center gap-2 text-sm font-bold text-sky-700 transition-colors hover:text-sky-900"
                          >
                            Visit resource
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
