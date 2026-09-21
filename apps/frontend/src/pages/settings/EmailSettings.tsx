import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail, Save, Send, RefreshCw, CheckCircle2,
} from 'lucide-react';
import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import { usePageTitle } from '../../hooks/usePageTitle';
import { BEARER_PREFIX } from '../../utils/constants';

type EmailSettingsData = {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  mail_from_name: string;
  mail_from_address: string;
  mail_engine: string;
};

const EmailSettings: React.FC = () => {
  usePageTitle('Email Settings');
  const qc = useQueryClient();
  const [form, setForm] = useState<EmailSettingsData>({
    smtp_host: '',
    smtp_port: import.meta.env.VITE_DEFAULT_SMTP_PORT || '587',
    smtp_username: '',
    smtp_password: '',
    smtp_encryption: 'tls',
    mail_from_name: 'OVDS',
    mail_from_address: 'noreply@ovds.com.et',
    mail_engine: 'smtp',
  });
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const query = useQuery({
    queryKey: ['settings', 'email'],
    queryFn: async () => {
      const res = await fetch('/api/settings/email', {
        headers: { Authorization: `${BEARER_PREFIX}${localStorage.getItem('ovds_token') || ''}` },
      });
      if (!res.ok) throw new Error('Failed to load email settings');
      return res.json() as Promise<EmailSettingsData>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch('/api/settings/email', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${BEARER_PREFIX}${localStorage.getItem('ovds_token') || ''}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to update email settings');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Email settings saved');
      qc.invalidateQueries({ queryKey: ['settings', 'email'] });
    },
    onError: (err: any) => toast.error(err?.message ?? 'Failed to save email settings'),
  });

  React.useEffect(() => {
    if (query.data) {
      setForm(prev => ({ ...prev, ...query.data }));
    }
  }, [query.data]);

  const handleChange = useCallback((key: keyof EmailSettingsData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync(form);
  }, [form, updateMutation]);

  const handleTest = useCallback(async () => {
    if (!testEmail) {
      toast.error('Enter a recipient email address');
      return;
    }
    setSendingTest(true);
    try {
      const res = await fetch('/api/settings/email/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${BEARER_PREFIX}${localStorage.getItem('ovds_token') || ''}`,
        },
        body: JSON.stringify({ to: testEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        toast.success(`Test email sent to ${testEmail}`);
      } else {
        toast.error(json?.message || 'Failed to send test email');
      }
    } catch {
      toast.error('Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  }, [testEmail]);

  const isDirty = updateMutation.isPending;

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Email & SMTP Settings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure your outgoing mail server so invoices, reminders, and alerts are delivered reliably.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isDirty}
          className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50"
        >
          <Save size={13} />
          {isDirty ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {query.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="ovds-widget-card p-6 space-y-4">
          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Mail Engine</p>
              <p className="text-xs text-slate-400 mt-0.5">Method used to send emails</p>
            </div>
            <select
              className="ovds-input max-w-xs"
              value={form.mail_engine}
              onChange={e => handleChange('mail_engine', e.target.value)}
            >
              <option value="smtp">SMTP</option>
              <option value="php_mail">PHP Mail</option>
              <option value="mailgun">Mailgun</option>
              <option value="sendgrid">SendGrid</option>
            </select>
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">SMTP Host</p>
              <p className="text-xs text-slate-400 mt-0.5">e.g., smtp.mailtrap.io or smtp.gmail.com</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              value={form.smtp_host}
              onChange={e => handleChange('smtp_host', e.target.value)}
              placeholder="smtp.mailtrap.io"
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">SMTP Port</p>
              <p className="text-xs text-slate-400 mt-0.5">Usually 587 for TLS, 465 for SSL</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              value={form.smtp_port}
              onChange={e => handleChange('smtp_port', e.target.value)}
              placeholder="587"
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Encryption</p>
              <p className="text-xs text-slate-400 mt-0.5">TLS or SSL encryption for SMTP</p>
            </div>
            <select
              className="ovds-input max-w-xs"
              value={form.smtp_encryption}
              onChange={e => handleChange('smtp_encryption', e.target.value)}
            >
              <option value="none">None</option>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
            </select>
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">SMTP Username</p>
              <p className="text-xs text-slate-400 mt-0.5">Your SMTP authentication username</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              value={form.smtp_username}
              onChange={e => handleChange('smtp_username', e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">SMTP Password</p>
              <p className="text-xs text-slate-400 mt-0.5">Your SMTP authentication password</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              type="password"
              value={form.smtp_password}
              onChange={e => handleChange('smtp_password', e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">From Name</p>
              <p className="text-xs text-slate-400 mt-0.5">Display name in outgoing emails</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              value={form.mail_from_name}
              onChange={e => handleChange('mail_from_name', e.target.value)}
              placeholder="OVDS"
            />
          </div>

          <div className="grid grid-cols-[200px_1fr] items-start gap-4 py-4">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">From Address</p>
              <p className="text-xs text-slate-400 mt-0.5">Email address used as the sender</p>
            </div>
            <input
              className="ovds-input w-full max-w-xs"
              value={form.mail_from_address}
              onChange={e => handleChange('mail_from_address', e.target.value)}
              placeholder="noreply@ovds.com.et"
            />
          </div>
        </div>
      )}

      <div className="ovds-widget-card p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Test Configuration</h3>
        <p className="text-xs text-slate-500 mb-3">Send a test email to verify your SMTP settings are working.</p>
        <div className="flex items-center gap-3">
          <input
            className="ovds-input w-full max-w-sm"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="recipient@example.com"
          />
          <button
            onClick={handleTest}
            disabled={sendingTest}
            className="ovds-btn-primary flex items-center gap-1.5 disabled:opacity-50"
          >
            <Send size={13} />
            {sendingTest ? 'Sending…' : 'Send Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;
