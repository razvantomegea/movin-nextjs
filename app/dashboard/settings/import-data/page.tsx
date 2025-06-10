'use client';

import { useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { ArrowLeft, Upload, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showErrorToast, showSuccessToast } from '@/lib/redux/slices/toastSlice';
import { importUserData } from '@/lib/supabase/importExportUserData';

export default function ImportDataPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = address?.toLowerCase();
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!addressLower) {
      dispatch(showErrorToast({ title: 'Error', description: 'Wallet not connected' }));
      return;
    }
    if (!selectedFile) {
      dispatch(showErrorToast({ title: 'Error', description: 'Please select a file to import.' }));
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Failed to read file.');
        }
        const data = JSON.parse(text);
        await importUserData({ address: addressLower, data });
        dispatch(
          showSuccessToast({
            title: 'Import Successful',
            description: 'Your data has been restored.',
          }),
        );
        router.push('/dashboard/settings');
      } catch (error) {
        console.error('Import failed:', error);
        dispatch(
          showErrorToast({
            title: 'Import Failed',
            description:
              error instanceof Error
                ? error.message
                : 'Invalid JSON file or unknown error occurred.',
          }),
        );
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  return (
    <div className="p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-4">Import Your Data</h1>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload Your Data File
            </CardTitle>
            <CardDescription>
              Import your data from a previously exported JSON file. This will restore your profile,
              activities, and other data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800/50">
                <strong>Warning:</strong> Importing data will overwrite any existing data for your
                account. This action cannot be undone.
              </p>
              <div>
                <Input type="file" accept=".json" onChange={handleFileChange} />
              </div>
              <Button
                onClick={handleImport}
                className="w-full"
                disabled={isImporting || !selectedFile}
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload and Import Data
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
