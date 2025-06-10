'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import { exportUserData } from '@/lib/supabase/importExportUserData';

export default function ExportDataPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!addressLower) {
      dispatch(showErrorToast({ title: 'Error', description: 'Wallet not connected' }));
      return;
    }

    setIsExporting(true);
    try {
      const data = await exportUserData({ address: addressLower });
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `movin-data-export-${addressLower}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      dispatch(
        showSuccessToast({
          title: 'Export Successful',
          description: 'Your data has been downloaded.',
        }),
      );
    } catch (error) {
      console.error('Export failed:', error);
      dispatch(
        showErrorToast({
          title: 'Export Failed',
          description:
            error instanceof Error ? error.message : 'An unknown error occurred.',
        }),
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-4">Export Your Data</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2" />
              Download Your Data
            </CardTitle>
            <CardDescription>
              Export all your personal and activity data in a single JSON file. This includes your
              profile, activities, rewards, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Click the button below to start the export process. The file will be generated and
              downloaded to your device. Keep this file in a safe place if you plan to import it
              later.
            </p>
            <Button onClick={handleExport} className="w-full" disabled={isExporting}>
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
