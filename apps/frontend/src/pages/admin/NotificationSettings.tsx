 
import {
  notificationsConfigApi,
  notificationTemplatesApi,
  notificationCampaignsApi,
  type IntegrationConfig,
  type NotificationTemplate,
  type NotificationCampaign,
  type NotificationChannel,
} from '@ovds/features/notifications';
import { Save, Send, Bell, Mail, MessageSquare, Loader2, FileText, Users, Edit, Trash2, Plus, Calendar, Tag, X, FileText as FileTextIcon, List } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const NotificationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<IntegrationConfig>({});
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<{ email?: boolean; slack?: boolean; intercom?: boolean }>({});
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newCampaign, setNewCampaign] = useState<Partial<NotificationCampaign> & { templateId?: string }>({});
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', type: 'email' as NotificationChannel, subject: '', body: '', variables: [] as string[] });
  const [activeTab, setActiveTab] = useState<'email' | 'slack' | 'intercom'>('email');

  // Load config on mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const data = await notificationsConfigApi.getConfig();
        setConfig(data);
      } catch {
        toast.error('Failed to load notification settings');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const data = await notificationTemplatesApi.list();
        setTemplates(data);
      } catch {
        toast.error('Failed to load templates');
      } finally {
        setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, []);

  // Load campaigns
  useEffect(() => {
    const loadCampaigns = async () => {
      setLoadingCampaigns(true);
      try {
        const data = await notificationCampaignsApi.list();
        setCampaigns(data);
      } catch {
        toast.error('Failed to load campaigns');
      } finally {
        setLoadingCampaigns(false);
      }
    };
    loadCampaigns();
  }, []);

  const handleTest = async (channel: 'email' | 'slack' | 'intercom') => {
    setTesting(prev => ({ ...prev, [channel]: true }));
    try {
      await notificationsConfigApi.testChannel(channel);
      toast.success(`Test ${channel} sent!`);
    } catch {
      toast.error(`Test failed for ${channel}`);
    } finally {
      setTesting(prev => ({ ...prev, [channel]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await notificationsConfigApi.setConfig(config);
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  // Template handlers
  const handleCreateTemplate = async (form: typeof templateForm) => {
    try {
      await notificationTemplatesApi.create({ ...form, isActive: true });
      toast.success('Template created');
      setShowTemplateModal(false);
      setTemplateForm({ name: '', type: 'email', subject: '', body: '', variables: [] });
      // Reload templates
      const data = await notificationTemplatesApi.list();
      setTemplates(data);
    } catch {
      toast.error('Failed to create template');
    }
  };

  const handleUpdateTemplate = async (id: string) => {
    if (!editingTemplate) return;
    try {
      await notificationTemplatesApi.update(id, templateForm);
      toast.success('Template updated');
      setEditingTemplate(null);
      setShowTemplateModal(false);
      // Reload
      const data = await notificationTemplatesApi.list();
      setTemplates(data);
    } catch {
      toast.error('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    try {
      await notificationTemplatesApi.delete(id);
      toast.success('Template deleted');
      // Reload
      const data = await notificationTemplatesApi.list();
      setTemplates(data);
    } catch {
      toast.error('Failed to delete template');
    }
  };

  const editTemplate = (template: NotificationTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      type: template.type,
      subject: template.subject || '',
      body: template.body,
      variables: template.variables
    });
    setShowTemplateModal(true);
  };

  // Campaign handlers
  const handleCreateCampaign = async () => {
    try {
      await notificationCampaignsApi.create(newCampaign as any);
      toast.success('Campaign created');
      setShowCampaignModal(false);
      setNewCampaign({});
      // Reload
      const data = await notificationCampaignsApi.list();
      setCampaigns(data);
    } catch {
      toast.error('Failed to create campaign');
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm('Send this campaign now?')) return;
    try {
      await notificationCampaignsApi.send(id);
      toast.success('Campaign sent');
      // Reload
      const data = await notificationCampaignsApi.list();
      setCampaigns(data);
    } catch {
      toast.error('Failed to send campaign');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      DRAFT: 'bg-yellow-100 text-yellow-800',
      SCHEDULED: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
      SENT: 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)]',
      FAILED: 'bg-rose-100 text-rose-800'
    };
    return colors[status as keyof typeof colors] || 'bg-slate-100 text-slate-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Bell className="w-8 h-8 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Notification Settings</h1>
          <p className="text-slate-600 mt-1">Configure integrations, templates, and campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Config Tabs - 2/3 width on large */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 p-6">
            {/* Plain tab bar — no @headlessui dependency */}
            <div className="flex border-b border-slate-200 mb-6 gap-1">
              {([
                { id: 'email', label: 'Email (SMTP)', icon: <Mail className="w-4 h-4" /> },
                { id: 'slack', label: 'Slack', icon: <MessageSquare className="w-4 h-4" /> },
                { id: 'intercom', label: 'Intercom', icon: <Bell className="w-4 h-4" /> },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 px-4 text-sm font-semibold rounded-t-xl transition-all ${
                    activeTab === tab.id
                      ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border-b-2 border-[var(--pro-azure)] bg-[var(--pro-azure-50)]/50'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={activeTab === tab.id ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-400'}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
                {activeTab === 'email' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Enable Email Notifications</label>
                      <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!config.email?.active}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            email: { ...prev.email, active: e.target.checked }
                          }))}
                          className="w-5 h-5 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border-slate-300 rounded focus:ring-teal-400"
                        />
                        <span className="text-sm text-slate-900 font-medium">Send notifications via SMTP</span>
                      </label>
                    </div>

                    {config.email?.active && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[var(--pro-azure-50)]/50 rounded-2xl border border-[var(--pro-azure-100)] dark:border-green-800">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">SMTP Host</label>
                          <input
                            type="text"
                            value={config.email?.smtpHost || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              email: { ...(prev.email || { active: false }), smtpHost: e.target.value }
                            }))}
                            placeholder="smtp.gmail.com"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Port</label>
                          <input
                            type="number"
                            value={config.email?.smtpPort || parseInt(import.meta.env.VITE_DEFAULT_SMTP_PORT || '587', 10)}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              email: { ...(prev.email || { active: false }), smtpPort: Number(e.target.value) }
                            }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                            min={25} max={465}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Username</label>
                          <input
                            type="email"
                            value={config.email?.smtpUser || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              email: { ...(prev.email || { active: false }), smtpUser: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">From Email</label>
                          <input
                            type="email"
                            value={config.email?.fromEmail || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              email: { ...(prev.email || { active: false }), fromEmail: e.target.value }
                            }))}
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Password</label>
                          <input
                            type="password"
                            value={config.email?.smtpPass || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              email: { ...(prev.email || { active: false }), smtpPass: e.target.value }
                            }))}
                            placeholder="App password recommended"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all"
                          />
                          <p className="text-xs text-slate-500 mt-1">Use Gmail App Password or SMTP token (not your account password)</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleTest('email')}
                        disabled={!config.email?.active || testing.email}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--pro-azure-dark)] hover:bg-[var(--pro-azure-dark)] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testing.email ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Test Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Slack Tab */}
                {activeTab === 'slack' && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-900 mb-2">Enable Slack Notifications</label>
                      <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!config.slack?.active}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            slack: { ...(prev.slack || { webhookUrl: '', active: false }), active: e.target.checked }
                          }))}
                          className="w-5 h-5 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] border-slate-300 rounded focus:ring-teal-400"
                        />
                        <span className="text-sm text-slate-900 font-medium">Send notifications to Slack</span>
                      </label>
                    </div>

                    {config.slack?.active && (
                      <div className="space-y-5 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Slack Webhook URL</label>
                          <input
                            type="url"
                            value={config.slack?.webhookUrl || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              slack: { ...(prev.slack || { webhookUrl: '', active: false }), webhookUrl: e.target.value }
                            }))}
                            placeholder="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          />
                          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <span>Generate at</span>
                            <a href="https://api.slack.com/messaging/webhooks" target="_blank" className="font-semibold text-purple-600 hover:text-purple-700" rel="noreferrer">
                              slack.com/apps → Incoming Webhooks
                            </a>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-900 mb-2">Channel (optional)</label>
                          <input
                            type="text"
                            value={config.slack?.channel || ''}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              slack: { ...(prev.slack || { webhookUrl: '', active: false }), channel: e.target.value }
                            }))}
                            placeholder="#general or @user"
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                      <button
                        onClick={() => handleTest('slack')}
                        disabled={!config.slack?.active || testing.slack}
                        className="flex items-center gap-2 px-6 py-3 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {testing.slack ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Test to Slack
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Intercom Tab */}
                {activeTab === 'intercom' && (
                  <div className="space-y-5">
                    <div className="flex items-start gap-4 p-4 bg-teal-50 border border-teal-200 rounded-2xl">
                      <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shrink-0">
                        <Bell className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-teal-900 text-sm">Intercom Integration</p>
                        <p className="text-xs text-teal-700 mt-0.5">Connect Ovds with Intercom to deliver in-app notifications and support conversations directly to your users.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                        <div>
                          <p className="text-sm font-bold text-slate-900">Enable Intercom</p>
                          <p className="text-xs text-slate-500 mt-0.5">Send Ovds notifications as Intercom events</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!config.intercom?.active}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              intercom: { ...(prev.intercom || { active: false }), active: e.target.checked }
                            }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-teal-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-teal-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                        </label>
                      </div>

                      {config.intercom?.active && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Intercom App ID</label>
                            <input
                              type="text"
                              value={config.intercom?.appId || ''}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                intercom: { ...(prev.intercom || { active: true }), appId: e.target.value }
                              }))}
                              placeholder="e.g. abc12345"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                            <p className="ovds-caption">Found in Intercom →  → Installation → Your App ID</p>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Identity Verification Secret</label>
                            <input
                              type="password"
                              value={config.intercom?.secret || ''}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                intercom: { ...(prev.intercom || { active: true }), secret: e.target.value }
                              }))}
                              placeholder="••••••••••••••••"
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                            />
                            <p className="ovds-caption">Used to verify  identity. Keep this secret.</p>
                          </div>

                          <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Events to Forward</p>
                            {[
                              { key: 'invoice_paid', label: 'Invoice Paid' },
                              { key: 'invoice_overdue', label: 'Invoice Overdue' },
                              { key: 'payroll_approved', label: 'Payroll Approved' },
                              { key: 'leave_approved', label: 'Leave Approved/Rejected' },
                            ].map(ev => (
                              <label key={ev.key} className="flex items-center gap-3 cursor-pointer">
                                <input
                                  type="checkbox"
                                  defaultChecked
                                  className="w-4 h-4 text-teal-500 border-slate-300 rounded focus:ring-teal-500"
                                />
                                <span className="text-sm text-slate-700">{ev.label}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
          </div>
        </div>

        {/* Save Button for Config */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-4 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Config
              </>
            )}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-4 border border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Templates Tab */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <h2 className="text-xl font-semibold text-slate-900">Notification Templates ({templates.length})</h2>
          </div>
          <button
            onClick={() => {
              setEditingTemplate(null);
              setTemplateForm({ name: '', type: 'email', subject: '', body: '', variables: [] });
              setShowTemplateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white font-semibold rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </div>
        {loadingTemplates ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <FileTextIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates yet</h3>
            <p className="text-slate-500 mb-4">Create your first notification template</p>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(templates) && templates.map((template) => (
              <div key={template.id} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${template.isActive ? 'bg-[var(--pro-azure-100)] text-[var(--pro-azure-dark)] dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${template.type === 'email' ? 'bg-sky-100 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300' : template.type === 'slack' ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300' : 'bg-[var(--pro-azure-100)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-green-300'}`}>
                      {template.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                      onClick={() => editTemplate(template)}
                      className="p-1.5 text-slate-500 hover:text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:bg-[var(--pro-azure-50)] dark:bg-green-950/20 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 truncate">{template.name}</h4>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{template.body}</p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {Array.isArray(template.variables) && template.variables.slice(0, 3).map((varName) => (
                    <span key={varName} className="px-2 py-0.5 bg-slate-200 text-slate-700 text-xs rounded">
                      {`{${varName}}`}
                    </span>
                  ))}
                  {Array.isArray(template.variables) && template.variables.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-xs rounded">+{template.variables.length - 3}</span>
                  )}
                </div>
                {template.subject && (
                  <p className="text-xs text-slate-500 italic mb-4">Subject: {template.subject}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaigns Tab */}
      <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
            <h2 className="text-xl font-semibold text-slate-900">Notification Campaigns ({campaigns.length})</h2>
          </div>
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--pro-azure)] text-white font-semibold rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
        {loadingCampaigns ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <List className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-500 mb-4">Create bulk notification campaigns</p>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--pro-azure)] text-white font-semibold rounded-xl hover:bg-[var(--pro-azure-dark)] transition-all mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-4 px-3 font-semibold text-slate-900 text-sm">Name</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-900 text-sm">Type</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-900 text-sm min-w-[120px]">Status</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-900 text-sm">Targets</th>
                  <th className="text-left py-4 px-3 font-semibold text-slate-900 text-sm">Scheduled</th>
                  <th className="text-right py-4 px-3 font-semibold text-slate-900 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(campaigns) && campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-4 px-3 font-medium text-slate-900">{campaign.name}</td>
                    <td className="py-4 px-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${campaign.type === 'email' ? 'bg-sky-100 dark:bg-sky-950/30 text-sky-800 dark:text-sky-300' : campaign.type === 'slack' ? 'bg-violet-100 dark:bg-violet-950/30 text-violet-800 dark:text-violet-300' : 'bg-[var(--pro-azure-100)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-green-300'}`}>
                        {campaign.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="py-4 px-3 text-sm text-slate-600">{Array.isArray(campaign.targets) ? campaign.targets.length : 0}</td>
                    <td className="py-4 px-3 text-sm text-slate-600">
                      {campaign.scheduledAt ? new Date(campaign.scheduledAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-3 text-right">
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={() => handleSendCampaign(campaign.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-[var(--pro-azure-dark)] transition-all"
                        >
                          <Send className="w-3 h-3" />
                          Send
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {editingTemplate ? 'Edit Template' : 'New Template'}
              </h3>
              <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Name</label>
                <input
                  type="text"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  placeholder="Welcome New Employee"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Channel</label>
                <select
                  value={templateForm.type}
                  onChange={(e) => setTemplateForm({...templateForm, type: e.target.value as NotificationChannel})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="intercom">Intercom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Subject (Email only)</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  placeholder="Your notification subject"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Body</label>
                <textarea
                  rows={6}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({...templateForm, body: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400 resize-vertical"
                  placeholder="Hello {{employeeName}}, your leave request has been {{status}}."
                />
                <p className="text-xs text-slate-500 mt-2">
                  Available variables: <code className="bg-slate-200 px-1 rounded">{'{{employeeName}}'}, {'{{amount}}'}, {'{{date}}'}</code> etc.
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Variables</label>
                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border-2 border-dashed border-slate-300 min-h-[44px]">
                  {templateForm.variables.map((v, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-slate-200 px-2 py-1 rounded-full text-sm">
                      <Tag className="w-3 h-3" />
                      {v}
                      <button
                        type="button"
                        onClick={() => setTemplateForm({
                          ...templateForm,
                          variables: templateForm.variables.filter((_, idx) => idx !== i)
                        })}
                        className="ml-1 hover:bg-slate-300 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="employeeName"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        e.preventDefault();
                        const newVar = e.currentTarget.value.trim();
                        if (!templateForm.variables.includes(newVar)) {
                          setTemplateForm({
                            ...templateForm,
                            variables: [...templateForm.variables, newVar]
                          });
                        }
                        e.currentTarget.value = '';
                      }
                    }}
                    className="flex-1 bg-transparent border-none outline-none text-sm placeholder-slate-500 ml-2"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    if (editingTemplate) {
                      handleUpdateTemplate(editingTemplate.id);
                    } else {
                      handleCreateTemplate(templateForm);
                    }
                  }}
                  disabled={!templateForm.name || !templateForm.body}
                  className="flex-1 px-6 py-3 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
                >
                  <Save className="w-4 h-4" />
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">New Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Name</label>
                <input
                  type="text"
                  value={newCampaign.name || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400"
                  placeholder="Q1 Payroll Reminder"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Channel</label>
                <select
                  value={newCampaign.type || 'email'}
                  onChange={(e) => setNewCampaign({...newCampaign, type: e.target.value as NotificationChannel})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400"
                >
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="intercom">Intercom</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Template</label>
                <select
                  value={newCampaign.templateId || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, templateId: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400"
                >
                  <option value="">Select template...</option>
                  {Array.isArray(templates) && templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Targets</label>
                <input
                  type="text"
                  placeholder="employeeIds comma separated, or 'all-admins'"
                  onChange={(e) => setNewCampaign({...newCampaign, targets: e.target.value.split(',')})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  onChange={(e) => setNewCampaign({...newCampaign, scheduledAt: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={handleCreateCampaign}
                  disabled={!newCampaign.name || !newCampaign.targets}
                  className="flex-1 px-6 py-3 bg-[var(--pro-azure-50)]0 hover:bg-[var(--pro-azure-dark)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2 justify-center"
                >
                  <Calendar className="w-4 h-4" />
                  Create Campaign
                </button>
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-6 py-3 border border-slate-300 text-slate-900 font-semibold rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;








