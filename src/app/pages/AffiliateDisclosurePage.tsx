import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { DollarSign, Link2, AlertCircle, CheckCircle, Shield, TrendingUp } from 'lucide-react';

export default function AffiliateDisclosurePage() {
  const disclosures = [
    {
      icon: Link2,
      title: 'Affiliate Links',
      content: [
        'Smart Travel Hacks participates in various affiliate marketing programs, which means we may earn commissions when you click on or make purchases through affiliate links on our site.',
        'When you click on an affiliate link and make a purchase, we may receive a small commission at no additional cost to you. This helps us maintain and improve our content.',
        'Affiliate links are clearly marked and tracked so we can provide you with the best recommendations while supporting our platform.'
      ]
    },
    {
      icon: DollarSign,
      title: 'Google AdSense',
      content: [
        'We participate in the Google AdSense program, which allows us to display advertisements on our website.',
        'We may earn revenue when you view or click on these advertisements. Google uses cookies to serve ads based on your prior visits to our website and other sites.',
        'You can opt out of personalized advertising by visiting Google\'s Ads Settings or by visiting www.aboutads.info.',
        'The ads displayed on our site are managed by Google and may be based on your browsing history and interests.'
      ]
    },
    {
      icon: CheckCircle,
      title: 'Our Promise',
      content: [
        'Editorial Independence: We only recommend products, services, and travel resources that we genuinely believe will add value to our readers. Our editorial content is never influenced by affiliate partnerships or advertising relationships.',
        'Honest Reviews: All product reviews and recommendations are based on thorough research, testing, and honest evaluation. We clearly distinguish between sponsored content and organic content.',
        'Your Trust: We value your trust above all else. If we recommend a product or service, it\'s because we believe it can help you, not just because we earn a commission.',
        'Transparency: We are committed to full transparency about our monetization methods and will always disclose when content contains affiliate links or is sponsored.'
      ]
    },
    {
      icon: TrendingUp,
      title: 'Affiliate Programs We Participate In',
      content: [
        'Amazon Associates: We may earn from qualifying purchases made through Amazon links',
        'Travel Partners: Various travel brands, gear companies, booking services, and platforms whose products we review',
        'Travel Technology Partners: Select planning apps, booking tools, maps, and connectivity services relevant to travelers',
        'Experience Partners: Tours, local experiences, and educational travel resources we may recommend',
        'This list is not exhaustive and may be updated as we partner with additional programs.'
      ]
    },
    {
      icon: AlertCircle,
      title: 'FTC Compliance',
      content: [
        'In accordance with FTC guidelines concerning the use of endorsements and testimonials in advertising, we disclose that we have financial relationships with some of the companies mentioned on this site.',
        'We are required by the Federal Trade Commission to disclose relationships between our site and companies from which we may receive compensation.',
        'This disclosure applies to all forms of compensation including monetary payments, free products, discounts, or any other form of benefit.',
        'We strive to provide honest opinions, findings, beliefs, or experiences on topics related to travel and trip planning.'
      ]
    },
    {
      icon: Shield,
      title: 'Your Rights',
      content: [
        'No Obligation: You are never under any obligation to purchase products or services through our affiliate links',
        'Price Transparency: Using our affiliate links does not increase the price you pay - you pay the same price as going directly to the website',
        'Privacy: Your privacy is important to us. Please review our Privacy Policy to understand how we handle your information',
        'Questions: If you have any questions about our affiliate relationships or disclosure practices, please contact us through our contact form'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <SEOHead title="Affiliate Disclosure" description="Our affiliate disclosure" robotsIndex={false} />
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Affiliate Disclosure</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We believe in full transparency. Here's how we earn revenue and why you can trust our recommendations.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: February 26, 2026</p>
        </div>

        {/* Introduction */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            At <span className="font-semibold text-gray-900">Smart Travel Hacks</span>, we're committed to providing valuable, honest content about travel resources and trip planning. 
            To support our work and keep this platform free for readers, we participate in affiliate marketing programs and display advertisements.
          </p>
          <p className="text-lg text-gray-700 leading-relaxed">
            This page explains our monetization practices in compliance with Federal Trade Commission (FTC) guidelines. 
            <span className="font-semibold text-gray-900"> Your trust is our top priority</span>, and we want you to understand exactly how we operate.
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-8 mb-8 border-2 border-amber-300">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Important Notice</h3>
              <p className="text-gray-700 leading-relaxed">
                Some of the links on this website are affiliate links, and we may also display advertisements through Google AdSense. 
                This means that if you click on certain links or ads and make a purchase or interact with an ad, we may earn a commission 
                at no extra cost to you. This helps us create and maintain high-quality content for you.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {disclosures.map((section, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{section.title}</h2>
              </div>
              <div className="space-y-4 ml-16">
                {section.content.map((item, idx) => (
                  <p key={idx} className="text-gray-700 leading-relaxed">
                    {item.includes(':') ? (
                      <>
                        <span className="font-semibold text-gray-900">{item.split(':')[0]}:</span>
                        {item.split(':').slice(1).join(':')}
                      </>
                    ) : (
                      item
                    )}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mt-8 border border-green-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Thank You for Your Support</h3>
          <p className="text-gray-700 leading-relaxed text-center max-w-3xl mx-auto">
            By using our affiliate links and viewing our advertisements, you help us continue creating valuable content about travel and trip planning. 
            We're grateful for your trust and support, and we're committed to maintaining the highest standards of integrity and transparency.
          </p>
        </div>

        {/* Contact Note */}
        <div className="text-center mt-8 p-6 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-600">
            Have questions about our affiliate partnerships or disclosure practices?{' '}
            <a href="/contact" className="text-green-600 font-semibold hover:text-green-700 underline">
              Contact us
            </a>
          </p>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}