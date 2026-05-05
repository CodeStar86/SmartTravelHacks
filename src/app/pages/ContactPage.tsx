import { PublicHeader } from '../components/public/PublicHeader';
import { PublicFooter } from '../components/public/PublicFooter';
import { SEOHead } from '../components/public/SEOHead';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Mail, MessageSquare, Send, Clock, MapPin, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { API_BASE, SUPABASE_ANON_KEY } from '../lib/env';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Contact Us" description="Get in touch with Smart Travel Hacks" robotsIndex={false} />
      <PublicHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white py-20">
          <div className="container mx-auto px-4 text-center max-w-4xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <MessageSquare size={40} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Get In Touch
            </h1>
            <p className="text-xl md:text-2xl opacity-90">
              Have a question or feedback? We'd love to hear from you.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Contact Info Cards */}
              <Card className="p-6 text-center hover:shadow-lg transition">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-100 rounded-full mb-4">
                  <Clock className="text-purple-600" size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">Response Time</h3>
                <p className="text-gray-600 text-sm">
                  Within 24-48 hours
                </p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-full mb-4">
                  <MapPin className="text-indigo-600" size={28} />
                </div>
                <h3 className="text-lg font-bold mb-2">Location</h3>
                <p className="text-gray-600 text-sm">
                  Available Worldwide
                </p>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="max-w-3xl mx-auto">
              <Card className="p-8 md:p-12 shadow-xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-3">Send Us a Message</h2>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                        Name *
                      </Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        className="h-12 text-base"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                        Email *
                      </Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        className="h-12 text-base"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-base font-semibold mb-2 block">
                      Subject *
                    </Label>
                    <Input 
                      id="subject" 
                      placeholder="What is this about?" 
                      className="h-12 text-base"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-base font-semibold mb-2 block">
                      Message *
                    </Label>
                    <Textarea 
                      id="message" 
                      placeholder="Tell us what's on your mind..." 
                      rows={8}
                      className="text-base"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start gap-3">
                      <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="text-green-700 font-semibold">Message sent successfully!</p>
                        <p className="text-green-600 text-sm mt-1">We'll get back to you within 24-48 hours.</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full md:w-auto px-12 text-lg font-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.928l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Send className="mr-2" size={20} />
                    )}
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <Card className="p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-2">How quickly will I receive a response?</h3>
                <p className="text-gray-600">
                  We aim to respond to all inquiries within 24-48 hours during business days.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-2">Do you accept guest posts?</h3>
                <p className="text-gray-600">
                  Yes! We welcome high-quality guest contributions. Please include "Guest Post" in your subject line with a brief pitch.
                </p>
              </Card>

              <Card className="p-6 hover:shadow-lg transition">
                <h3 className="text-xl font-bold mb-2">Can I advertise on your site?</h3>
                <p className="text-gray-600">
                  We offer various advertising opportunities. Contact us with "Advertising Inquiry" in the subject for more details.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}