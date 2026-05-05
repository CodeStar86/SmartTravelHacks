export type FooterCategoryGroup = {
  title: string;
  items: Array<{
    name: string;
    slug: string;
    description: string;
    group: 'where-to-go' | 'plan-your-trip';
  }>;
};

export const TRAVEL_CATEGORY_GROUPS: FooterCategoryGroup[] = [
  {
    title: 'Where To Go',
    items: [
      { name: 'Europe', slug: 'europe', group: 'where-to-go', description: 'Travel guides, routes, and budget tips for Europe.' },
      { name: 'Southeast Asia', slug: 'southeast-asia', group: 'where-to-go', description: 'Backpacking guides, itineraries, and practical tips for Southeast Asia.' },
      { name: 'Central, East, and South Asia', slug: 'central-east-and-south-asia', group: 'where-to-go', description: 'Guides and travel hacks for Central, East, and South Asia.' },
      { name: 'North America', slug: 'north-america', group: 'where-to-go', description: 'Budget travel ideas and destination guides for North America.' },
      { name: 'South America', slug: 'south-america', group: 'where-to-go', description: 'Backpacking routes, city guides, and savings tips for South America.' },
      { name: 'Central America', slug: 'central-america', group: 'where-to-go', description: 'Travel guides and budget tips for Central America.' },
      { name: 'Oceania', slug: 'oceania', group: 'where-to-go', description: 'Travel guides and planning tips for Australia, New Zealand, and the Pacific.' },
      { name: 'Africa', slug: 'africa', group: 'where-to-go', description: 'Destination guides, safety tips, and travel inspiration for Africa.' },
    ],
  },
  {
    title: 'Plan Your Trip',
    items: [
      { name: 'Travel Insurance', slug: 'travel-insurance', group: 'plan-your-trip', description: 'Travel insurance guides, comparisons, and safety advice.' },
      { name: 'The Best Gear', slug: 'the-best-gear', group: 'plan-your-trip', description: 'Packing lists, gear reviews, and travel essentials.' },
      { name: 'Hostel Life 101', slug: 'hostel-life-101', group: 'plan-your-trip', description: 'Hostel tips, etiquette, safety, and budget accommodation advice.' },
      { name: 'Book a Hotel', slug: 'book-a-hotel', group: 'plan-your-trip', description: 'Hotel booking tips, deal strategies, and accommodation guides.' },
      { name: 'Find Cheap Flights', slug: 'find-cheap-flights', group: 'plan-your-trip', description: 'Flight booking strategies, fare alerts, and cheap travel hacks.' },
      { name: 'Budget Backpacking', slug: 'budget-backpacking', group: 'plan-your-trip', description: 'Money-saving guides for backpackers and long-term travelers.' },
      { name: 'Travel Tips', slug: 'travel-tips', group: 'plan-your-trip', description: 'General travel planning tips, hacks, and practical advice.' },
      { name: 'Best Travel Jobs', slug: 'best-travel-jobs', group: 'plan-your-trip', description: 'Remote work, travel jobs, and ways to earn while traveling.' },
    ],
  },
];

export const TRAVEL_CATEGORIES = TRAVEL_CATEGORY_GROUPS.flatMap((group) => group.items);

export function getTravelCategoryBySlug(slug?: string | null) {
  if (!slug) return undefined;
  return TRAVEL_CATEGORIES.find((category) => category.slug === slug);
}
