import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTable, AppTh, AppTd, AppTr,
  Btn, Icon, Modal, FormField, Input, Select,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import api from '../services/api';

interface NodeRecord {
  nodeId: string;
  cloudAccountId: string;
  privilegeLevel: 'READ_ONLY' | 'STANDARD' | 'ADMIN';
  registrationTimestamp: string;
  lastSeenTimestamp: string;
  revoked: boolean;
}

const PRIVILEGE_CLS: Record<string, string> = {
  READ_ONLY: 'text-slate-700 bg-slate-100 border-slate-200',
  STANDARD: 'text-[var(--pro-azure-dark)] bg-[var(--pro-azure-50)] border-[var(--pro-azure-100)]',
  ADMIN: 'text-violet-700 bg-violet-50 border-violet-200',
};

const fmtDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-ET');
};

const ConnectedNodes: React.FC = () => {
  const { selectedCompanyId } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<NodeRecord[]>([]);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ cloudAccountId: '', privilegeLevel: 'STANDARD' });

  const companyId = selectedCompanyId || undefined;

  const fetchNodes = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await api.get(`/nodes?accountId=${companyId}`, {
        headers: { 'x-background': '1' },
      });
      setNodes(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error('Failed to load connected nodes');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  const handleRegister = async () => {
    if (!form.cloudAccountId.trim()) {
      toast.error('Cloud Account ID is required');
      return;
    }
    setSaving(true);
    try {
      await api.post('/nodes/register', {
        cloudAccountId: form.cloudAccountId.trim(),
        privilegeLevel: form.privilegeLevel,
      });
      toast.success('Node registered successfully');
      setRegisterOpen(false);
      setForm({ cloudAccountId: '', privilegeLevel: 'STANDARD' });
      fetchNodes();
    } catch {
      toast.error('Failed to register node');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (nodeId: string) => {
    if (!confirm(`Revoke node ${nodeId}? The local client will be locked on next sync.`)) return;
    setSaving(true);
    try {
      await api.delete(`/nodes/${nodeId}`);
      toast.success('Node revoked');
      fetchNodes();
    } catch {
      toast.error('Failed to revoke node');
    } finally {
      setSaving(false);
    }
  };

  const handleHeartbeat = async (nodeId: string) => {
    try {
      await api.put(`/nodes/${nodeId}/heartbeat`);
      toast.success('Heartbeat sent');
      fetchNodes();
    } catch {
      toast.error('Heartbeat failed');
    }
  };

  const activeNodes = nodes.filter((n) => !n.revoked);
  const revokedNodes = nodes.filter((n) => n.revoked);

  return (
    <AppPage
      title="Connected Nodes"
      subtitle="Local invoice-module installations registered under this account"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <Btn variant="primary" size="sm" onClick={() => setRegisterOpen(true)} icon={<Icon name="PLUS" size={11} />}>
            Register Node
          </Btn>
          <Btn variant="secondary" size="sm" onClick={fetchNodes} icon={<Icon name="REFRESH_CW" size={11} />}>
            Refresh
          </Btn>
        </div>
      }
    >
      {!companyId ? (
        <div className="text-center py-10 text-sm text-slate-400">
          Please select a company to manage nodes.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <div className="ovds-grid-layout cols-3 gap-sm">
            {[
              { label: 'Active Nodes', value: activeNodes.length, color: 'text-[var(--pro-azure)]' },
              { label: 'Revoked', value: revokedNodes.length, color: 'text-rose-600' },
              { label: 'Total', value: nodes.length, color: 'text-slate-700' },
            ].map((k, i) => (
              <div key={i} className="ovds-widget-card p-4">
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
                {loading ? (
                  <div className="h-7 w-16 bg-slate-200 rounded animate-pulse" />
                ) : (
                  <p className={`text-xl font-bold tabular-nums ${k.color}`}>{k.value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Active Nodes */}
          <div className="ovds-widget-card overflow-hidden">
            <div className="ovds-widget-header">
              <p className="ovds-card-title">Active Nodes</p>
            </div>
            <AppTable>
              <thead>
                <tr>
                  <AppTh>Node ID</AppTh>
                  <AppTh>Cloud Account</AppTh>
                  <AppTh>Privilege</AppTh>
                  <AppTh>Registered</AppTh>
                  <AppTh>Last Seen</AppTh>
                  <AppTh align="right">Actions</AppTh>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : activeNodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                      No active nodes. Register a local invoice-module installation to get started.
                    </td>
                  </tr>
                ) : (
                  activeNodes.map((n) => (
                    <AppTr key={n.nodeId}>
                      <AppTd>
                        <span className="text-[12px] font-mono text-slate-600 dark:text-slate-300">{n.nodeId}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[12px] text-slate-600 dark:text-slate-300">{n.cloudAccountId}</span>
                      </AppTd>
                      <AppTd>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIVILEGE_CLS[n.privilegeLevel] ?? PRIVILEGE_CLS.STANDARD}`}>
                          {n.privilegeLevel}
                        </span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{fmtDate(n.registrationTimestamp)}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-500">{fmtDate(n.lastSeenTimestamp)}</span>
                      </AppTd>
                      <AppTd align="right">
                        <div className="flex items-center gap-1 justify-end">
                          <Btn variant="ghost" size="sm" onClick={() => handleHeartbeat(n.nodeId)} icon={<Icon name="REFRESH_CW" size={11} />} />
                          <Btn variant="ghost" size="sm" onClick={() => handleRevoke(n.nodeId)} icon={<Icon name="TRASH_2" size={11} />} />
                        </div>
                      </AppTd>
                    </AppTr>
                  ))
                )}
              </tbody>
            </AppTable>
          </div>

          {/* Revoked Nodes */}
          {revokedNodes.length > 0 && (
            <div className="ovds-widget-card overflow-hidden">
              <div className="ovds-widget-header">
                <p className="ovds-card-title">Revoked Nodes</p>
              </div>
              <AppTable>
                <thead>
                  <tr>
                    <AppTh>Node ID</AppTh>
                    <AppTh>Cloud Account</AppTh>
                    <AppTh>Privilege</AppTh>
                    <AppTh>Last Seen</AppTh>
                  </tr>
                </thead>
                <tbody>
                  {revokedNodes.map((n) => (
                    <AppTr key={n.nodeId}>
                      <AppTd>
                        <span className="text-[12px] font-mono text-slate-400 line-through">{n.nodeId}</span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[12px] text-slate-400">{n.cloudAccountId}</span>
                      </AppTd>
                      <AppTd>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIVILEGE_CLS[n.privilegeLevel] ?? ''}`}>
                          {n.privilegeLevel}
                        </span>
                      </AppTd>
                      <AppTd>
                        <span className="text-[11px] text-slate-400">{fmtDate(n.lastSeenTimestamp)}</span>
                      </AppTd>
                    </AppTr>
                  ))}
                </tbody>
              </AppTable>
            </div>
          )}
        </div>
      )}

      {/* Register Modal */}
      {registerOpen && (
        <Modal
          open={registerOpen}
          onClose={() => setRegisterOpen(false)}
          title="Register New Node"
          footer={
            <div className="flex items-center gap-2">
              <Btn variant="secondary" size="sm" onClick={() => setRegisterOpen(false)}>Cancel</Btn>
              <Btn variant="primary" size="sm" onClick={handleRegister} loading={saving}>
                Register
              </Btn>
            </div>
          }
        >
          <div className="space-y-3">
            <FormField label="Cloud Account ID" required>
              <Input
                value={form.cloudAccountId}
                onChange={(e) => setForm((f) => ({ ...f, cloudAccountId: e.target.value }))}
                placeholder="Enter cloud account ID"
              />
            </FormField>
            <FormField label="Privilege Level">
              <Select
                value={form.privilegeLevel}
                onChange={(e) => setForm((f) => ({ ...f, privilegeLevel: e }))}
              >
                <option value="READ_ONLY">Read Only</option>
                <option value="STANDARD">Standard</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </FormField>
          </div>
        </Modal>
      )}
    </AppPage>
  );
};

export default ConnectedNodes;

