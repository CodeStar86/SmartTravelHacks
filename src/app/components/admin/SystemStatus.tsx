import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle2, AlertCircle, RefreshCw, Info } from 'lucide-react';
import { performHealthCheck, getLastHealthCheck, type HealthStatus } from '../../lib/health';
import { getVersionString, VERSION_INFO } from '../../lib/version';

import { logger } from '../../lib/logger';
export function SystemStatus() {
  const [health, setHealth] = useState<HealthStatus | null>(getLastHealthCheck());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Load initial health status
    const initialHealth = getLastHealthCheck();
    if (initialHealth) {
      setHealth(initialHealth);
    } else {
      // Perform initial check if none exists
      handleCheck();
    }
  }, []);

  async function handleCheck() {
    setChecking(true);
    try {
      const status = await performHealthCheck();
      setHealth(status);
    } catch (error) {
      logger.error('Health check failed:', error);
    } finally {
      setChecking(false);
    }
  }

  const isHealthy = health && health.backend && health.supabase && health.localStorage;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">System Status</h3>
        <Button
          onClick={handleCheck}
          disabled={checking}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
          Check
        </Button>
      </div>

      {/* Overall Status */}
      <div className={`mb-4 p-4 rounded-lg border ${
        isHealthy 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center gap-2">
          {isHealthy ? (
            <>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">All systems operational</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Issues detected</span>
            </>
          )}
        </div>
      </div>

      {/* Component Health */}
      {health && (
        <div className="space-y-3 mb-4">
          <HealthItem
            label="Backend API"
            healthy={health.backend}
            description="Server connectivity and endpoints"
          />
          <HealthItem
            label="Database"
            healthy={health.supabase}
            description="Supabase connection"
          />
          <HealthItem
            label="Local Storage"
            healthy={health.localStorage}
            description="Browser storage availability"
          />
        </div>
      )}

      {/* Errors */}
      {health && health.errors.length > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm font-medium text-yellow-900 mb-2">Issues:</p>
          <ul className="text-xs text-yellow-800 space-y-1">
            {health.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Version Info */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Info className="w-4 h-4" />
          <span>Version: {getVersionString()}</span>
        </div>
        <div className="text-xs text-gray-500">
          Last updated: {VERSION_INFO.lastUpdate}
        </div>
        {health && (
          <div className="text-xs text-gray-500">
            Last checked: {new Date(health.lastChecked).toLocaleString()}
          </div>
        )}
      </div>
    </Card>
  );
}

function HealthItem({ 
  label, 
  healthy, 
  description 
}: { 
  label: string; 
  healthy: boolean; 
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">
        {healthy ? (
          <CheckCircle2 className="w-4 h-4 text-green-600" />
        ) : (
          <AlertCircle className="w-4 h-4 text-red-600" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          <span className={`text-xs px-2 py-0.5 rounded ${
            healthy 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {healthy ? 'Healthy' : 'Unhealthy'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
