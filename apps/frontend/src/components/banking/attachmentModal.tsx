import { Button } from '@ovds/ui';
import { X, Upload, Download, Trash2, Eye } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';

import api from '../../services/api';


interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  description?: string;
}

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxRateId: string;
  attachments: Attachment[];
  onSuccess: () => void;
}

const AttachmentModal: React.FC<AttachmentModalProps> = ({ 
  isOpen, 
  onClose, 
  taxRateId, 
  attachments = [], 
  onSuccess 
}) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachableId', taxRateId);
    formData.append('attachableType', 'TaxRate');
    formData.append('description', description);

    try {
      await api.post('/ovds/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Attachment uploaded');
      onSuccess();
      setFile(null);
      setDescription('');
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this attachment?')) return;
    try {
      await api.delete(`/ovds/attachments/${id}`);
      toast.success('Attachment deleted');
      onSuccess();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const res = await api.get(`/ovds/attachments/${attachment.id}`);
      const data = res.data?.data ?? res.data;
      const fileData: string = data?.fileData ?? '';
      if (!fileData) { toast.error('No file data available'); return; }
      // fileData is base64 — decode and trigger download
      const byteChars = atob(fileData.includes(',') ? fileData.split(',')[1] : fileData);
      const byteArr = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i);
      const blob = new Blob([byteArr], { type: attachment.mimeType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = attachment.filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success(`Downloaded ${attachment.filename}`);
    } catch {
      toast.error('Download failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Tax Rate Attachments</h3>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={20} />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Upload Form */}
          <div className="border rounded-lg p-4 border-slate-200 dark:border-slate-700">
            <h4 className="font-medium mb-3">Upload New Attachment</h4>
            <div className="space-y-3">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--pro-azure-50)] file:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:file:bg-[var(--pro-azure-100)] dark:file:bg-slate-700 dark:file:text-slate-100"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-teal-400 dark:bg-slate-800 dark:text-slate-100"
              />
              <Button 
                onClick={handleUpload} 
                disabled={!file || uploading} 
                className="w-full"
              >
                {uploading ? 'Uploading...' : <><Upload size={16} className="mr-2" />Upload</>}
              </Button>
            </div>
          </div>

          {/* Attachments List */}
          <div>
            <h4 className="font-medium mb-3">Attached Files ({attachments.length})</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {attachments.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No attachments</p>
              ) : (
                attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[var(--pro-azure)] to-[var(--pro-azure-dark)] rounded-lg flex items-center justify-center">
                        <Eye size={16} className="text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{attachment.filename}</p>
                        <p className="ovds-caption">{attachment.description || 'No description'}</p>
                        <p className="text-xs text-slate-400">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDownload(attachment)}
                        className="h-8 w-8 p-0"
                      >
                        <Download size={14} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700"
                        onClick={() => handleDelete(attachment.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;




