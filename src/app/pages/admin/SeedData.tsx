import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { categoryApi, tagApi } from '../../lib/api';

export default function SeedData() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const seedCategories = async () => {
    setLoading(true);
    setSuccess([]);
    setErrors([]);

    const defaultCategories = [
      {
        name: 'Destinations',
        slug: 'destinations',
        description: 'Destination guides, hotel ideas, and must-see highlights',
      },
      {
        name: 'Itineraries',
        slug: 'itineraries',
        description: 'Day-by-day trip plans for city breaks, road trips, and longer holidays',
      },
      {
        name: 'Travel Tips',
        slug: 'travel-tips',
        description: 'Packing, budgeting, transport, and practical planning advice',
      },
      {
        name: 'Reviews',
        slug: 'reviews',
        description: 'Travel gear, hotels, tours, and booking resource reviews',
      },
    ];

    for (const category of defaultCategories) {
      try {
        // Check if category already exists
        const existing = await categoryApi.list();
        const exists = existing.find((c: any) => c.slug === category.slug);
        
        if (exists) {
          setSuccess(prev => [...prev, `✓ Category "${category.name}" already exists`]);
        } else {
          await categoryApi.create(category);
          setSuccess(prev => [...prev, `✓ Created category "${category.name}"`]);
        }
      } catch (error: any) {
        setErrors(prev => [...prev, `✗ Failed to create "${category.name}": ${error.message}`]);
      }
    }

    setLoading(false);
  };

  const seedTags = async () => {
    setLoading(true);
    setSuccess([]);
    setErrors([]);

    const defaultTags = [
      { name: 'Europe', slug: 'europe' },
      { name: 'Asia', slug: 'asia' },
      { name: 'Weekend Trips', slug: 'weekend-trips' },
      { name: 'Budget Travel', slug: 'budget-travel' },
      { name: 'Luxury Travel', slug: 'luxury-travel' },
      { name: 'Solo Travel', slug: 'solo-travel' },
      { name: 'Food Guides', slug: 'food-guides' },
      { name: 'Travel Tips', slug: 'travel-tips' },
    ];

    for (const tag of defaultTags) {
      try {
        const existing = await tagApi.list();
        const exists = existing.find((t: any) => t.slug === tag.slug);
        
        if (exists) {
          setSuccess(prev => [...prev, `✓ Tag "${tag.name}" already exists`]);
        } else {
          await tagApi.create(tag);
          setSuccess(prev => [...prev, `✓ Created tag "${tag.name}"`]);
        }
      } catch (error: any) {
        setErrors(prev => [...prev, `✗ Failed to create "${tag.name}": ${error.message}`]);
      }
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Seed Database</h1>
        <p className="text-gray-600 mt-1">
          Initialize your database with default categories and tags
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Default Categories</h2>
          <p className="text-gray-600 text-sm mb-4">
            Creates 4 default categories: Destinations, Itineraries, Travel Tips, and Reviews
          </p>
          <Button 
            onClick={seedCategories} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Categories'
            )}
          </Button>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Default Tags</h2>
          <p className="text-gray-600 text-sm mb-4">
            Creates 8 default tags for common travel topics
          </p>
          <Button 
            onClick={seedTags} 
            disabled={loading}
            className="w-full"
            variant="outline"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Tags'
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {(success.length > 0 || errors.length > 0) && (
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-semibold text-lg">Results</h3>
          
          {success.length > 0 && (
            <div className="space-y-2">
              {success.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-green-700">
                  <CheckCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{msg}</span>
                </div>
              ))}
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              {errors.map((msg, idx) => (
                <div key={idx} className="flex items-start gap-2 text-red-700">
                  <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">About Database Seeding</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• This tool creates default categories and tags for your blog</li>
          <li>• If categories/tags already exist, they won't be duplicated</li>
          <li>• You can customize these categories and tags later from their respective pages</li>
          <li>• Run this once when setting up your blog for the first time</li>
        </ul>
      </div>
    </div>
  );
}
