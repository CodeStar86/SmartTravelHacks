import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Shield, Lock, Eye, Database, Cookie, Mail, UserCheck, FileText, Clock, Globe2 } from 'lucide-react';

const lastUpdated = 'April 27, 2026';

export default function PrivacyPage() {
  const sections = [
    {
      icon: Database,
      title: 'Information We Collect',
      content: [
        'Usage and technical data: IP address, browser type, device information, approximate location, referring URLs, pages viewed, timestamps, diagnostics, and interaction data.',
        'Account, subscription, or contact data: If you create an account, subscribe, comment, or contact us, we may collect details such as your name, email address, message content, and preferences.',
        'Travel search data: We may process travel-related searches, filters, destinations, and page interactions needed to provide app features and improve content.',
        'Cookie data: We may use essential cookies and, only where required with consent, analytics, advertising, and affiliate tracking technologies.',
        'We do not intentionally collect special category data, such as health, biometric, religious, or political information.'
      ]
    },
    {
      icon: Eye,
      title: 'How We Use Your Information',
      content: [
        'To provide, maintain, secure, and improve Smart Travel Hacks.',
        'To publish and personalize travel content, recommendations, offers, and site features.',
        'To respond to contact requests, comments, support questions, and user feedback.',
        'To send newsletters or updates only where you have subscribed or otherwise opted in.',
        'To measure site performance, detect abuse, debug issues, and protect the app from fraud or misuse.',
        'To comply with legal, regulatory, tax, accounting, or security obligations.'
      ]
    },
    {
      icon: FileText,
      title: 'Legal Bases for Processing',
      content: [
        'Consent: Used for non-essential cookies, analytics, marketing emails, and personalised advertising where consent is required.',
        'Contract or pre-contract steps: Used when processing is needed to provide requested features, account functionality, or support.',
        'Legitimate interests: Used to maintain, secure, improve, and measure the website, provided your rights do not override those interests.',
        'Legal obligation: Used where we must keep records or respond to lawful requests.'
      ]
    },
    {
      icon: Cookie,
      title: 'Cookies, Analytics, and Advertising',
      content: [
        'Essential cookies: Required for core site functionality, security, preference storage, and admin features.',
        'Analytics cookies: May be used to understand how visitors use the site. These should not run for EEA/UK users unless consent has been given where required.',
        'Advertising cookies: Google AdSense or similar partners may use cookies to serve and measure ads if enabled on the site.',
        'Affiliate tracking: Some outbound links may use tracking parameters or cookies so partners can attribute referrals or commissions.',
        'Cookie controls: You can accept or reject non-essential cookies using the site banner. You can also clear cookies in your browser settings.'
      ]
    },
    {
      icon: Globe2,
      title: 'Third-Party Services',
      content: [
        'Vercel: Hosting, deployment, performance, and security infrastructure.',
        'Supabase: Authentication, database, storage, and backend services where enabled.',
        'Google Analytics: Website analytics where configured and consented to where required.',
        'Google AdSense: Advertising and ad measurement where enabled.',
        'Affiliate partners: Referral tracking and commission attribution for qualifying outbound links.',
        'Unsplash or media providers: Images and media used in site content.',
        'Each third-party provider processes data under its own privacy terms and data processing arrangements.'
      ]
    },
    {
      icon: Lock,
      title: 'Data Security',
      content: [
        'We use appropriate technical and organisational measures to protect personal data, including HTTPS, access controls, environment variables for secrets, and provider-level security controls.',
        'Admin and backend access should be limited to authorised users only.',
        'No internet transmission or storage system is completely secure, so we cannot guarantee absolute security.'
      ]
    },
    {
      icon: Clock,
      title: 'Data Retention',
      content: [
        'We keep personal data only for as long as needed for the purposes described in this policy, unless a longer retention period is required by law.',
        'Contact messages are kept for as long as needed to respond and maintain business records.',
        'Newsletter data is kept until you unsubscribe or request deletion, subject to legal or security retention needs.',
        'Analytics and log data are retained according to the settings of the relevant provider and should be minimised where possible.'
      ]
    },
    {
      icon: UserCheck,
      title: 'Your Privacy Rights',
      content: [
        'Access: You can ask for a copy of personal data we hold about you.',
        'Correction: You can ask us to correct inaccurate or incomplete personal data.',
        'Deletion: You can ask us to delete your personal data where GDPR allows.',
        'Restriction or objection: You can ask us to restrict processing or object to processing based on legitimate interests.',
        'Portability: You can request a portable copy of data you provided where legally applicable.',
        'Withdraw consent: You can withdraw consent for marketing or non-essential cookies at any time.',
        'Complaint: You may lodge a complaint with your local data protection authority if you believe your rights have been infringed.'
      ]
    },
    {
      icon: Mail,
      title: 'Contact Us',
      content: [
        'For privacy questions, access requests, deletion requests, or cookie concerns, contact us through the contact page or at: privacy@smarttravelhacks.com.',
        'Please include enough information for us to identify and respond to your request. We may need to verify your identity before fulfilling certain requests.'
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <SEOHead title="Privacy Policy" description="Smart Travel Hacks privacy policy and GDPR information" robotsIndex={false} />
      <PublicHeader />
      
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-6 shadow-lg">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            This policy explains how Smart Travel Hacks collects, uses, protects, and shares personal data.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: {lastUpdated}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-200">
          <p className="text-lg text-gray-700 leading-relaxed">
            Smart Travel Hacks (“we”, “us”, “our”) is committed to privacy, transparency, and responsible data handling. This policy is designed to support GDPR and UK GDPR expectations by explaining what we collect, why we collect it, how long we keep it, which third parties may process it, and how you can exercise your rights.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mt-4">
            This policy is provided for general compliance support and should be reviewed with qualified legal counsel before relying on it for a regulated business or high-risk data processing.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <section
              key={index}
              className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <section.icon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{section.title}</h2>
              </div>
              <div className="space-y-4 ml-0 md:ml-16">
                {section.content.map((item, idx) => {
                  const [label, ...rest] = item.split(':');
                  const hasLabel = rest.length > 0 && label.length < 40;
                  return (
                    <p key={idx} className="text-gray-700 leading-relaxed">
                      {hasLabel ? (
                        <>
                          <span className="font-semibold text-gray-900">{label}:</span>
                          {rest.join(':')}
                        </>
                      ) : (
                        item
                      )}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 mt-8 border border-blue-200">
          <h3 className="text-xl font-bold text-gray-900 mb-3">Changes to This Policy</h3>
          <p className="text-gray-700 leading-relaxed">
            We may update this Privacy Policy to reflect legal, technical, or business changes. When we make material changes, we will update the “Last updated” date and, where appropriate, provide additional notice.
          </p>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
}
