import { useState, useEffect } from 'react';
import { Mail, Download, Trash2, Users, Search, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';
import { API_BASE } from '../../lib/env';
import { getAccessToken } from '../../lib/supabase';
import { supabase } from '../../lib/supabase';

import { logger } from '../../lib/logger';
interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  status: string;
}

export default function Subscribers() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [filteredSubscribers, setFilteredSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  useEffect(() => {
    // Filter subscribers based on search query
    if (searchQuery.trim() === '') {
      setFilteredSubscribers(subscribers);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredSubscribers(
        subscribers.filter(sub => 
          sub.email.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, subscribers]);

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE}/subscribers`,
        {
          headers: {
            'Authorization': `Bearer ${await getAccessToken() || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch subscribers');

      const data = await response.json();
      setSubscribers(data.subscribers || []);
      setFilteredSubscribers(data.subscribers || []);
    } catch (error: any) {
      logger.error('Error fetching subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to delete subscriber: ${email}?`)) {
      return;
    }

    try {
      setDeleting(id);

      const response = await fetch(
        `${API_BASE}/subscribers/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${await getAccessToken() || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to delete subscriber');

      toast.success('Subscriber deleted successfully');
      fetchSubscribers(); // Refresh list
    } catch (error: any) {
      logger.error('Error deleting subscriber:', error);
      toast.error('Failed to delete subscriber');
    } finally {
      setDeleting(null);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/subscribers/export/csv`,
        {
          headers: {
            'Authorization': `Bearer ${await getAccessToken() || ''}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to export subscribers');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Subscribers exported successfully');
    } catch (error: any) {
      logger.error('Error exporting subscribers:', error);
      toast.error('Failed to export subscribers');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-600 mt-1">
            Manage your email subscribers and export lists
          </p>
        </div>
        <Button onClick={handleExportCSV} className="gap-2">
          <Download size={18} />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Subscribers</p>
              <p className="text-3xl font-bold mt-1">{subscribers.length}</p>
            </div>
            <Users className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Subscribers</p>
              <p className="text-3xl font-bold mt-1">
                {subscribers.filter(s => s.status === 'active').length}
              </p>
            </div>
            <Mail className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">This Month</p>
              <p className="text-3xl font-bold mt-1">
                {subscribers.filter(s => {
                  const subDate = new Date(s.subscribed_at);
                  const now = new Date();
                  return subDate.getMonth() === now.getMonth() && 
                         subDate.getFullYear() === now.getFullYear();
                }).length}
              </p>
            </div>
            <Calendar className="w-12 h-12 text-purple-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <p className="text-sm text-gray-600">
          Showing {filteredSubscribers.length} of {subscribers.length} subscribers
        </p>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredSubscribers.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {searchQuery ? 'No subscribers found matching your search' : 'No subscribers yet'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {!searchQuery && 'Subscribers will appear here when they sign up through your website'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscribed Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubscribers.map((subscriber) => (
                  <tr key={subscriber.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="text-gray-400 mr-3" size={18} />
                        <span className="text-sm font-medium text-gray-900">
                          {subscriber.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(subscriber.subscribed_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {subscriber.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subscriber.id, subscriber.email)}
                        disabled={deleting === subscriber.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deleting === subscriber.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <Trash2 size={16} className="mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Managing Subscribers</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Export your subscriber list as CSV to use with email marketing tools</li>
          <li>• Subscribers are automatically added when they sign up on your website</li>
          <li>• Delete subscribers to remove them from your list permanently</li>
          <li>• Use the search to quickly find specific email addresses</li>
        </ul>
      </div>
    </div>
  );
}