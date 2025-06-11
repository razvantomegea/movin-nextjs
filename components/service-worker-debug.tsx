'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  debugServiceWorker,
  cleanupServiceWorkers,
  checkPushConfiguration,
  type ServiceWorkerStatus,
  getServiceWorkerStatus,
} from '@/utils/serviceWorkerDebug';
import { Wrench, Trash2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ServiceWorkerDebug() {
  const [status, setStatus] = useState<ServiceWorkerStatus | null>(null);
  const [pushConfig, setPushConfig] = useState<{ configured: boolean; issues: string[] } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const [swStatus, pushStatus] = await Promise.all([
        getServiceWorkerStatus(),
        checkPushConfiguration(),
      ]);
      setStatus(swStatus);
      setPushConfig(pushStatus);
    } catch (error) {
      console.error('Error loading status:', error);
    }
  };

  const handleDebug = async () => {
    await debugServiceWorker();
    await loadStatus();
  };

  const handleCleanup = async () => {
    setLoading(true);
    try {
      const cleaned = await cleanupServiceWorkers();
      console.log(`Cleaned up ${cleaned} registrations`);
      await loadStatus();
    } catch (error) {
      console.error('Cleanup failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  if (!status) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Service Worker Debug
          </CardTitle>
          <CardDescription>Debug service worker and push notification status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Service Worker Status</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Supported</span>
                  {getStatusIcon(status.supported)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Registered</span>
                  {getStatusIcon(status.registered)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Active</span>
                  {getStatusIcon(status.active)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Registrations</span>
                  <Badge variant={status.registrations.length > 1 ? 'destructive' : 'default'}>
                    {status.registrations.length}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Push Notifications</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Push Supported</span>
                  {getStatusIcon(status.pushSupported)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Permission</span>
                  <Badge
                    variant={
                      status.notificationPermission === 'granted'
                        ? 'default'
                        : status.notificationPermission === 'denied'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {status.notificationPermission}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Configured</span>
                  {getStatusIcon(pushConfig?.configured || false)}
                </div>
              </div>
            </div>
          </div>

          {pushConfig && pushConfig.issues.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Issues Found
              </h4>
              <ul className="text-sm space-y-1">
                {pushConfig.issues.map((issue, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <XCircle className="h-3 w-3 text-red-500" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {status.registrations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Registrations</h4>
              <div className="space-y-2">
                {status.registrations.map((reg, index) => (
                  <div key={index} className="text-sm p-2 border rounded">
                    <div className="font-mono text-xs mb-1">
                      {reg.active?.scriptURL || 'No active worker'}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{reg.active?.state || 'inactive'}</Badge>
                      <span className="text-xs text-gray-500">Scope: {reg.scope}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleDebug} variant="outline" size="sm">
              <Wrench className="h-4 w-4 mr-1" />
              Debug to Console
            </Button>

            {status.registrations.length > 1 && (
              <Button onClick={handleCleanup} variant="outline" size="sm" disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" />
                {loading ? 'Cleaning...' : 'Cleanup Duplicates'}
              </Button>
            )}

            <Button onClick={loadStatus} variant="outline" size="sm">
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
