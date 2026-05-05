import { useState } from 'react';
import { MapPin, Compass, Plane, WalletCards } from 'lucide-react';
import { toast } from 'sonner';
import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { API_BASE, SUPABASE_ANON_KEY } from '../lib/env';

export default function AboutPage() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    setSubscribing(true);
    try {
      const response = await fetch(`${API_BASE}/subscribers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ email }),
      });
      if (!response.ok && response.status !== 409) throw new Error();
      toast.success('You are subscribed. Thanks for joining Smart Travel Hacks.');
      setEmail('');
    } catch {
      toast.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  }

  const highlights = [
    {
      icon: MapPin,
      title: 'Destination Guides',
      text: 'In-depth destination guides covering top places to visit, best areas to stay, transportation options, and must-see attractions.',
    },
    {
      icon: Compass,
      title: 'Travel Planning Tips',
      text: 'Step-by-step travel planning advice for itineraries, packing strategies, timing decisions, and smoother trips.',
    },
    {
      icon: WalletCards,
      title: 'Budget Travel Strategies',
      text: 'Smart ways to reduce travel expenses on flights, accommodation, transportation, and daily spending.',
    },
    {
      icon: Plane,
      title: 'Practical Travel Advice',
      text: 'Real-world travel tips designed to help travelers avoid common mistakes and make better decisions before and during every trip.',
    },
  ];
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <SEOHead
        title="Smart Travel Hacks: Practical Travel Tips, Guides & Planning Advice"
        description="Smart Travel Hacks provides practical travel tips, destination guides, and travel planning advice to help travelers save money, avoid mistakes, and travel smarter."
        keywords="travel tips, destination guides, travel planning advice, budget travel, smart travel, travel hacks, trip planning, travel resources"
        canonical="https://www.smarttravelhacks.com/about"
        ogTitle="Smart Travel Hacks: Practical Travel Tips, Guides & Planning Advice"
        ogDescription="Discover smarter ways to travel with practical travel tips, destination guides, and planning strategies designed to save time, reduce costs, and improve every trip."
        schema={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About Smart Travel Hacks',
          url: 'https://www.smarttravelhacks.com/about',
          description: 'Smart Travel Hacks is a travel platform focused on practical travel tips, destination guides, budget travel strategies, and smarter travel planning advice.',
          about: {
            '@type': 'Organization',
            name: 'Smart Travel Hacks',
            url: 'https://www.smarttravelhacks.com',
          },
        }}
      />
      <PublicHeader />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-emerald-600 to-sky-600 text-white py-20 md:py-24">
          <div className="container mx-auto px-4 max-w-5xl text-center">
            <p className="uppercase tracking-[0.28em] text-sm mb-4 text-emerald-100">About</p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Smart Travel Hacks: Practical Travel Tips, Guides & Planning Advice
            </h1>
            <p className="text-lg md:text-2xl opacity-95 max-w-4xl mx-auto">
              Discover smarter ways to travel with expert travel tips, destination guides, and practical planning strategies designed to save time, reduce costs, and improve every trip.
            </p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Travel Tips, Destination Guides, and Smarter Planning</h2>
                  <div className="space-y-5 text-gray-700 text-lg leading-8">
                    <p>
                      Smart Travel Hacks is a travel platform focused on delivering practical travel tips, detailed destination guides, and effective travel planning strategies. The goal is to help travelers make informed decisions, avoid common mistakes, and get more value from every trip—whether traveling locally or internationally.
                    </p>
                    <p>
                      Unlike generic travel blogs, Smart Travel Hacks prioritizes clear, actionable advice that travelers can apply immediately.
                    </p>
                    <p>
                      From budget travel tips to detailed destination breakdowns, every piece of content is created to be practical, relevant, and easy to follow.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">A Practical Approach to Travel Advice</h2>
                  <div className="space-y-5 text-gray-700 text-lg leading-8">
                    <p>
                      Smart Travel Hacks focuses on delivering reliable and practical travel information rather than vague or overly generalized advice.
                    </p>
                    <p>
                      Content is structured to be clear, concise, and useful, allowing travelers to quickly find what they need and apply it to real-world travel situations.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {highlights.map((item) => (
                  <Card key={item.title} className="p-6 rounded-3xl shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center shrink-0">
                        <item.icon className="text-sky-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                        <p className="text-gray-600 leading-7">{item.text}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <Card className="p-8 md:p-10 rounded-3xl shadow-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-5">Who Smart Travel Hacks Is For</h2>
              <div className="space-y-5 text-gray-700 text-lg leading-8">
                <p>
                  Smart Travel Hacks is designed for travelers who want efficient, well-organized, and realistic travel advice.
                </p>
                <p>
                  Whether planning a weekend getaway, a business trip, or an international vacation, the platform provides resources to make travel easier, more affordable, and more enjoyable.
                </p>
              </div>
            </Card>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Stay in the loop</h2>
            <p className="text-gray-600 text-lg mb-8">
              Subscribe for destination ideas, practical travel tips, and smarter planning advice.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 h-12 rounded-md border border-gray-300 px-4"
              />
              <Button type="submit" disabled={subscribing} className="h-12 px-6">
                {subscribing ? 'Subscribing...' : 'Join the newsletter'}
              </Button>
            </form>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
