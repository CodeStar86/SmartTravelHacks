import { useState } from 'react';
import { supabase, getAccessToken } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { API_BASE } from '../../lib/env';

export default function TestAuth() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function testSession() {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      setResult({
        type: 'Session Check',
        success: !error,
        session: data.session ? {
          access_token_length: data.session.access_token?.length,
          expires_at: data.session.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
          user_id: data.session.user?.id,
          user_email: data.session.user?.email,
        } : null,
        error: error?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function testTokenValidation() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      
      if (!token) {
        setResult({ type: 'Token Validation', success: false, error: 'No token available' });
        return;
      }

      const response = await fetch(
        `${API_BASE}/health`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setResult({
        type: 'Authenticated Health Check',
        status: response.status,
        ...data,
      });
    } finally {
      setLoading(false);
    }
  }

  async function testAPI() {
    setLoading(true);
    try {
      const token = await getAccessToken();
      
      const response = await fetch(
        `${API_BASE}/posts`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token || ''}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      setResult({
        type: 'Posts API Test',
        status: response.status,
        statusText: response.statusText,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : undefined,
        data: Array.isArray(data) ? data.slice(0, 2) : data,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <Card className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>
        
        <div className="space-y-4 mb-6">
          <Button onClick={testSession} disabled={loading}>
            Test Session
          </Button>
          <Button onClick={testTokenValidation} disabled={loading} className="ml-2">
            Test Token Validation
          </Button>
          <Button onClick={testAPI} disabled={loading} className="ml-2">
            Test Posts API
          </Button>
        </div>

        {result && (
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto">
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </Card>
    </div>
  );
}
