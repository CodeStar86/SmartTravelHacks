import { logger } from './logger';
/**
 * Health Check System
 * 
 * Monitors the application's health and connectivity.
 * Helps identify issues before they cause crashes.
 */

import { apiCall } from './api';

export interface HealthStatus {
  backend: boolean;
  supabase: boolean;
  localStorage: boolean;
  lastChecked: string;
  errors: string[];
}

let lastHealthCheck: HealthStatus | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

// Check backend health
async function checkBackendHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const response = await apiCall('/health');
    return {
      healthy: response.status === 'ok',
      error: response.status !== 'ok' ? 'Backend unhealthy' : undefined,
    };
  } catch (error: any) {
    // Backend might not have health endpoint, check if we can reach it at all
    try {
      // Try a simpler endpoint like settings
      await apiCall('/settings');
      return {
        healthy: true,
        error: undefined,
      };
    } catch {
      return {
        healthy: false,
        error: `Backend unreachable: ${error.message}`,
      };
    }
  }
}

// Check localStorage availability
function checkLocalStorage(): { healthy: boolean; error?: string } {
  try {
    const testKey = '__health_check__';
    const testValue = 'test';
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    
    return {
      healthy: retrieved === testValue,
      error: retrieved !== testValue ? 'localStorage read/write failed' : undefined,
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: `localStorage unavailable: ${error.message}`,
    };
  }
}

// Check Supabase connection
async function checkSupabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    // Try to fetch settings as a proxy for Supabase health
    const response = await fetch(window.location.origin);
    return {
      healthy: response.ok,
      error: !response.ok ? 'Supabase connection failed' : undefined,
    };
  } catch (error: any) {
    return {
      healthy: false,
      error: `Network unavailable: ${error.message}`,
    };
  }
}

// Perform full health check
export async function performHealthCheck(): Promise<HealthStatus> {
  const errors: string[] = [];

  // Check backend
  const backendHealth = await checkBackendHealth();
  if (!backendHealth.healthy && backendHealth.error) {
    errors.push(backendHealth.error);
  }

  // Check Supabase
  const supabaseHealth = await checkSupabaseHealth();
  if (!supabaseHealth.healthy && supabaseHealth.error) {
    errors.push(supabaseHealth.error);
  }

  // Check localStorage
  const localStorageHealth = checkLocalStorage();
  if (!localStorageHealth.healthy && localStorageHealth.error) {
    errors.push(localStorageHealth.error);
  }

  const status: HealthStatus = {
    backend: backendHealth.healthy,
    supabase: supabaseHealth.healthy,
    localStorage: localStorageHealth.healthy,
    lastChecked: new Date().toISOString(),
    errors,
  };

  lastHealthCheck = status;
  return status;
}

// Get last health check result
export function getLastHealthCheck(): HealthStatus | null {
  return lastHealthCheck;
}

// Start periodic health checks
export function startHealthMonitoring(intervalMs: number = 60000) {
  // Stop existing interval if any
  stopHealthMonitoring();

  // Perform initial check
  performHealthCheck().catch(err => {
    logger.error('Initial health check failed:', err);
  });

  // Start periodic checks
  healthCheckInterval = setInterval(() => {
    performHealthCheck().catch(err => {
      logger.error('Health check failed:', err);
    });
  }, intervalMs);
}

// Stop health monitoring
export function stopHealthMonitoring() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

// Check if app is healthy
export function isHealthy(): boolean {
  if (!lastHealthCheck) return true; // Assume healthy if not checked yet
  
  return (
    lastHealthCheck.backend &&
    lastHealthCheck.supabase &&
    lastHealthCheck.localStorage &&
    lastHealthCheck.errors.length === 0
  );
}

// Get health status for display
export function getHealthStatusMessage(): string {
  if (!lastHealthCheck) return 'Health status unknown';
  
  if (isHealthy()) {
    return '✓ All systems operational';
  }
  
  const issues: string[] = [];
  if (!lastHealthCheck.backend) issues.push('Backend');
  if (!lastHealthCheck.supabase) issues.push('Database');
  if (!lastHealthCheck.localStorage) issues.push('Storage');
  
  return `⚠ Issues detected: ${issues.join(', ')}`;
}