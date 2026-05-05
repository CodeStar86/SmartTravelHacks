import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { mediaApi } from '../../lib/api';

import { logger } from '../../lib/logger';
interface MediaFile {
  id: string;
  filename: string;
  url: string;
  alt_text: string;
  created_at: string;
}

export default function Media() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadMedia();
  }, []);

  async function loadMedia() {
    try {
      setLoading(true);
      const data = await mediaApi.list();
      setFiles(data || []);
    } catch (error: any) {
      logger.error('Failed to load media:', error);
      toast.error('Failed to load media');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        await mediaApi.upload(file);
      }
      
      toast.success('Files uploaded successfully');
      loadMedia();
    } catch (error: any) {
      logger.error('Upload error:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(id: string, filename: string) {
    if (!confirm(`Delete "${filename}"?`)) return;

    try {
      await mediaApi.delete(id);
      toast.success('File deleted');
      loadMedia();
    } catch (error: any) {
      logger.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete file');
    }
  }

  function copyUrl(url: string) {
    // Fallback method that works even when Clipboard API is blocked
    try {
      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          () => toast.success('URL copied to clipboard'),
          () => fallbackCopy(url)
        );
      } else {
        fallbackCopy(url);
      }
    } catch (error) {
      fallbackCopy(url);
    }
    
    function fallbackCopy(text: string) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('URL copied to clipboard');
      } catch (error) {
        toast.error('Failed to copy URL');
      }
      document.body.removeChild(textArea);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage images
          </p>
        </div>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload size={16} className="mr-2" />
              {uploading ? 'Uploading...' : 'Upload Images'}
            </label>
          </Button>
        </div>
      </div>

      {files.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No media files yet</p>
          <Button asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload size={16} className="mr-2" />
              Upload First Image
            </label>
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => (
            <Card key={file.id} className="overflow-hidden group">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={file.url}
                  alt={file.alt_text || file.filename}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(file.id, file.filename)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{file.filename}</p>
                <button
                  onClick={() => copyUrl(file.url)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Copy URL
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}