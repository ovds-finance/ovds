/**
 * Helpdesk — support ticket management with replies
 * Ovds style: AppPage · AppKpi · AppTable · reply thread · status workflow
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Ticket, Plus, Edit2, Trash2, RefreshCw, MessageSquare,
  CheckCircle2, User, Send, ChevronRight, Clock, AlertTriangle,
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';

import {
  AppPage, AppTabs, AppKpi, AppTable, AppTh, AppTd, AppTr,
  StatusBadge, Btn, Modal, FormField, Input, Select, Textarea,
  SearchBar, EmptyState, Pagination,
} from '../components/ui';
import { useBusiness } from '../context/businessContext';
import { useApiCrud } from '../hooks/useApiCrud';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../rbac/AuthContext';
import api from '../services/api';
import { confirm } from '../utils/confirm';

// -- Types ---------------------------------------------------------------------
interface HelpdeskTicket {
  id: string; ticketNumber: string; subject: string; description: string;
  category: string; priority: string; status: string;
  requesterName?: string; requesterEmail?: string;
  assignedTo?: string; assigneeName?: string;
  companyId?: string; dueDate?: string; tags?: string;
  createdAt: string; resolvedAt?: string; closedAt?: string;
  _count?: { ticketReply: number };
}
interface TicketReply {
  id: string; ticketId: string; content: string;
  authorId?: string; authorName?: string;
  type: string; isInternal: boolean; createdAt: string;
}

type FilterTab = 'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const CATEGORIES = ['BILLING', 'TECHNICAL', 'HR', 'PAYROLL', 'TAX', 'GENERAL', 'OTHER'];

const PRIORITY_CLS: Record<string, string> = {
  LOW:    'bg-white text-slate-500 border-slate-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-100',
  HIGH:   'bg-orange-50 text-orange-700 border-orange-100',
  URGENT: 'bg-rose-50 text-rose-700 border-rose-100',
};
const PRIORITY_ICON: Record<string, React.ReactNode> = {
  LOW:    <Clock size={9} />,
  MEDIUM: <Clock size={9} />,
  HIGH:   <AlertTriangle size={9} />,
  URGENT: <AlertTriangle size={9} />,
};

// -- Ticket Form ---------------------------------------------------------------
const TicketForm: React.FC<{
  data: Partial<HelpdeskTicket>;
  onChange: (d: Partial<HelpdeskTicket>) => void;
  isEdit?: boolean;
}> = ({ data, onChange, isEdit }) => {
  const set = (k: keyof HelpdeskTicket, v: any) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-3">
      <FormField label="Subject" required>
        <Input value={data.subject ?? ''} onChange={e => set('subject', e.target.value)} placeholder="Brief description of the issue" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Category">
          <Select value={data.category ?? 'GENERAL'} onChange={e => set('category', e)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
          </Select>
        </FormField>
        <FormField label="Priority">
          <Select value={data.priority ?? 'MEDIUM'} onChange={e => set('priority', e)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </Select>
        </FormField>
      </div>
      {isEdit && (
        <FormField label="Status">
          <Select value={data.status ?? 'OPEN'} onChange={e => set('status', e)}>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="WAITING">Waiting</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>
        </FormField>
      )}
      <FormField label="Description" required>
        <Textarea value={data.description ?? ''} onChange={e => set('description', e.target.value)} rows={3} placeholder="Detailed description of the issue…" />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Requester Name">
          <Input value={data.requesterName ?? ''} onChange={e => set('requesterName', e.target.value)} placeholder="Your name" />
        </FormField>
        <FormField label="Requester Email">
          <Input type="email" value={data.requesterEmail ?? ''} onChange={e => set('requesterEmail', e.target.value)} placeholder="your@email.com" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Assigned To">
          <Input value={data.assigneeName ?? ''} onChange={e => set('assigneeName', e.target.value)} placeholder="Agent name" />
        </FormField>
        <FormField label="Due Date">
          <Input type="date" value={data.dueDate?.slice(0, 10) ?? ''} onChange={e => set('dueDate', e.target.value)} />
        </FormField>
      </div>
    </div>
  );
};

// -- Ticket Detail (replies thread) --------------------------------------------
const TicketDetail: React.FC<{
  ticket: HelpdeskTicket;
  onClose: () => void;
  onEdit: () => void;
  canManage: boolean;
}> = ({ ticket, onClose, onEdit, canManage }) => {
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const { data: replies = [], refetch } = useQuery<TicketReply[]>({
    queryKey: ['ticket-replies', ticket.id],
    queryFn: () => api.get(`/helpdesk/${ticket.id}/replies`).then((r: any) => r.data),
  });

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    try {
      await api.post(`/helpdesk/${ticket.id}/replies`, {
        content: replyText.trim(),
        isInternal,
        type: 'REPLY',
      });
      setReplyText('');
      toast.success('Reply sent');
      refetch();
      qc.invalidateQueries({ queryKey: ['helpdesk'] });
    } catch { toast.error('Failed to send reply'); }
    finally { setSendingReply(false); }
  };

  const deleteReply = async (replyId: string) => {
    if (!await confirm({ title: 'Delete this reply?', variant: 'danger' })) return;
    await api.delete(`/helpdesk/replies/${replyId}`);
    toast.success('Reply deleted');
    refetch();
  };

  const changeStatus = async (status: string) => {
    await api.patch(`/helpdesk/${ticket.id}`, { status });
    toast.success(`Ticket ${status.toLowerCase()}`);
    qc.invalidateQueries({ queryKey: ['helpdesk'] });
    onClose();
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-slate-100">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-mono text-slate-400">{ticket.ticketNumber}</span>
            <StatusBadge status={ticket.status} />
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${PRIORITY_CLS[ticket.priority]}`}>
              {PRIORITY_ICON[ticket.priority]}{ticket.priority}
            </span>
            <span className="text-[9px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100">{ticket.category}</span>
          </div>
          <h2 className="text-sm font-bold text-slate-800 line-clamp-2">{ticket.subject}</h2>
          {ticket.requesterName && (
            <p className="ovds-caption mt-0.5 flex items-center gap-1">
              <User size={9} />{ticket.requesterName}{ticket.requesterEmail && ` · ${ticket.requesterEmail}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-3 shrink-0">
          {canManage && <Btn variant="ghost" size="sm" icon={<Edit2 size={11} />} onClick={onEdit}>Edit</Btn>}
          <Btn variant="ghost" size="sm" onClick={onClose}>✕</Btn>
        </div>
      </div>

      {/* Description */}
      <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100">
        <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
      </div>

      {/* Quick actions */}
      {canManage && ticket.status !== 'CLOSED' && (
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100">
          <span className="text-[10px] text-slate-400 font-semibold">Quick:</span>
          {ticket.status !== 'IN_PROGRESS' && (
            <button onClick={() => changeStatus('IN_PROGRESS')} className="text-[10px] font-semibold text-sky-600 hover:underline">→ In Progress</button>
          )}
          {ticket.status !== 'RESOLVED' && (
            <button onClick={() => changeStatus('RESOLVED')} className="text-[10px] font-semibold text-[var(--pro-azure)] hover:underline">→ Resolve</button>
          )}
          {ticket.status !== 'CLOSED' && (
            <button onClick={() => changeStatus('CLOSED')} className="text-[10px] font-semibold text-slate-500 hover:underline">→ Close</button>
          )}
        </div>
      )}

      {/* Replies */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3">
        {replies.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-6">No replies yet. Be the first to respond.</p>
        ) : replies.map(r => (
          <div key={r.id} className={`flex gap-3 group ${r.isInternal ? 'opacity-75' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[var(--pro-azure-100)] flex items-center justify-center shrink-0 mt-0.5">
              <User size={12} className="text-[var(--pro-azure)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-700">{r.authorName ?? 'Agent'}</span>
                <span className="ovds-caption">{new Date(r.createdAt).toLocaleString()}</span>
                {r.isInternal && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Internal</span>}
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3">
                <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-wrap">{r.content}</p>
              </div>
            </div>
            {canManage && (
              <button onClick={() => deleteReply(r.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all mt-0.5">
                <Trash2 size={10} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Reply composer */}
      <div className="p-4 border-t border-slate-100 bg-white">
        <Textarea
          value={replyText}
          onChange={e => setReplyText(e.target.value)}
          rows={2}
          placeholder="Type your reply…"
          className="mb-2"
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendReply(); }}
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded" />
            <span className="text-[10px] text-slate-500 font-semibold">Internal note</span>
          </label>
          <Btn variant="primary" size="sm" icon={<Send size={11} />} loading={sendingReply} onClick={sendReply} disabled={!replyText.trim()}>
            Send Reply
          </Btn>
        </div>
      </div>
    </div>
  );
};

// -- Main Helpdesk Page --------------------------------------------------------
const Helpdesk: React.FC = () => {
  usePageTitle('Helpdesk');
  const { can } = useAuth();
  const { selectedCompanyId } = useBusiness();
  const [tab, setTab]           = useState<FilterTab>('ALL');
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState<HelpdeskTicket | null>(null);
  const [modal, setModal]       = useState<{ open: boolean; data: Partial<HelpdeskTicket> }>({ open: false, data: {} });

  const { rows, total, page, loading, saving, save, remove, refetch, setPage } = useApiCrud<HelpdeskTicket>({
    endpoint: '/helpdesk',
    companyId: selectedCompanyId,
    pageSize: 25,
  });

  const filtered = useMemo(() => {
    let list = rows;
    if (tab !== 'ALL') list = list.filter(t => t.status === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        [t.subject, t.ticketNumber, t.requesterName, t.requesterEmail, t.category]
          .some(v => String(v ?? '').toLowerCase().includes(q))
      );
    }
    return list;
  }, [rows, tab, search]);

  const kpiCells = useMemo(() => [
    { label: 'Total',       value: rows.length,                                                color: 'green' as const },
    { label: 'Open',        value: rows.filter(t => t.status === 'OPEN').length,               color: 'rose' as const },
    { label: 'In Progress', value: rows.filter(t => t.status === 'IN_PROGRESS').length,        color: 'amber' as const },
    { label: 'Resolved',    value: rows.filter(t => t.status === 'RESOLVED').length,           color: 'sky' as const },
    { label: 'Closed',      value: rows.filter(t => t.status === 'CLOSED').length,             color: 'violet' as const },
  ], [rows]);

  const handleSave = useCallback(async () => {
    if (!modal.data.subject?.trim()) { toast.error('Subject is required'); return; }
    if (!modal.data.description?.trim()) { toast.error('Description is required'); return; }
    const payload = {
      ...modal.data,
      status: modal.data.status ?? 'OPEN',
    };
    const result = await save(payload as any);
    if (result) {
      setModal(m => ({ ...m, open: false }));
      if (modal.data.id && selected?.id === modal.data.id) setSelected(result as HelpdeskTicket);
    }
  }, [modal.data, save, selected]);

  const canManage = can('notifications:write');

  return (
    <AppPage
      title="Helpdesk"
      subtitle="Support tickets · Replies · Status tracking"
      icon={<Ticket size={18} />}
      crumbs={[{ label: 'Helpdesk' }]}
      tabs={
        <AppTabs
          tabs={[
            { key: 'ALL',         label: 'All',         count: rows.length },
            { key: 'OPEN',        label: 'Open',        count: rows.filter(t => t.status === 'OPEN').length },
            { key: 'IN_PROGRESS', label: 'In Progress', count: rows.filter(t => t.status === 'IN_PROGRESS').length },
            { key: 'RESOLVED',    label: 'Resolved',    count: rows.filter(t => t.status === 'RESOLVED').length },
            { key: 'CLOSED',      label: 'Closed',      count: rows.filter(t => t.status === 'CLOSED').length },
          ]}
          active={tab}
          onChange={k => setTab(k as FilterTab)}
        />
      }
      actions={
        <>
          <Btn variant="ghost" size="sm" icon={<RefreshCw size={11} />} onClick={refetch}>Refresh</Btn>
          <Btn variant="primary" size="sm" icon={<Plus size={12} />}
            onClick={() => setModal({ open: true, data: { priority: 'MEDIUM', category: 'GENERAL' } })}>
            New Ticket
          </Btn>
        </>
      }
    >
      <AppKpi cells={kpiCells} />

      <div className="flex items-center gap-2 mb-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tickets…" className="w-52" />
        <div className="flex-1" />
        <span className="text-[11px] text-slate-400">{filtered.length} tickets</span>
      </div>

      <div className={`flex gap-4 ${selected ? 'items-start' : ''}`}>
        {/* Table */}
        <div className={selected ? 'flex-1 min-w-0' : 'w-full'}>
          <AppTable>
            <thead><tr>
              <AppTh width="110px">Ticket #</AppTh>
              <AppTh>Subject</AppTh>
              <AppTh>Category</AppTh>
              <AppTh>Priority</AppTh>
              <AppTh>Requester</AppTh>
              <AppTh>Replies</AppTh>
              <AppTh>Status</AppTh>
              <AppTh align="right" width="80px">Actions</AppTh>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="py-12 text-center"><RefreshCw size={16} className="animate-spin text-slate-300 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<Ticket size={18} />} title="No tickets" desc="Submit a support ticket to get help"
                  action={{ label: 'New Ticket', onClick: () => setModal({ open: true, data: { priority: 'MEDIUM', category: 'GENERAL' } }) }} /></td></tr>
              ) : filtered.map(t => {
                const isSelected = selected?.id === t.id;
                return (
                  <AppTr key={t.id} className={isSelected ? 'bg-[var(--pro-azure-50)]/50' : ''}>
                    <AppTd>
                      <button onClick={() => setSelected(isSelected ? null : t)} className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-[var(--pro-azure)]">
                        {t.ticketNumber}
                        <ChevronRight size={9} className={`transition-transform ${isSelected ? 'rotate-90 text-[var(--pro-azure)]' : 'text-slate-300'}`} />
                      </button>
                    </AppTd>
                    <AppTd>
                      <button onClick={() => setSelected(isSelected ? null : t)} className="text-left">
                        <p className="text-[12px] font-semibold text-slate-800 hover:text-[var(--pro-azure)] line-clamp-1">{t.subject}</p>
                        {t.description && <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{t.description}</p>}
                      </button>
                    </AppTd>
                    <AppTd>
                      <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100">
                        {t.category?.replace(/_/g, ' ')}
                      </span>
                    </AppTd>
                    <AppTd>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${PRIORITY_CLS[t.priority ?? 'MEDIUM']}`}>
                        {PRIORITY_ICON[t.priority ?? 'MEDIUM']}{t.priority ?? 'MEDIUM'}
                      </span>
                    </AppTd>
                    <AppTd>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        <User size={9} className="text-slate-300" />
                        {t.requesterName ?? '—'}
                      </div>
                    </AppTd>
                    <AppTd>
                      {(t._count?.ticketReply ?? 0) > 0 ? (
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <MessageSquare size={9} className="text-slate-300" />{t._count?.ticketReply}
                        </span>
                      ) : <span className="text-[10px] text-slate-300">—</span>}
                    </AppTd>
                    <AppTd><StatusBadge status={t.status} /></AppTd>
                    <AppTd align="right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canManage && t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                          <button onClick={async () => {
                            await api.patch(`/helpdesk/${t.id}`, { status: 'RESOLVED' });
                            toast.success('Resolved'); refetch();
                          }} className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-[var(--pro-azure-50)] hover:text-[var(--pro-azure)] transition-all" title="Resolve">
                            <CheckCircle2 size={11} />
                          </button>
                        )}
                        <button onClick={() => setModal({ open: true, data: { ...t } })}
                          className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-sky-50 hover:text-sky-600 transition-all" title="Edit">
                          <Edit2 size={11} />
                        </button>
                        {canManage && (
                          <button onClick={async () => { if (await confirm({ title: `Delete ticket "${t.ticketNumber}"?`, variant: 'danger' })) { remove(t.id); if (selected?.id === t.id) setSelected(null); } }}
                            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all" title="Delete">
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </AppTd>
                  </AppTr>
                );
              })}
            </tbody>
          </AppTable>
          <div className="mt-3"><Pagination page={page} total={total} pageSize={25} onChange={setPage} /></div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-[460px] shrink-0 border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
            <TicketDetail
              ticket={selected}
              onClose={() => setSelected(null)}
              onEdit={() => setModal({ open: true, data: { ...selected } })}
              canManage={canManage}
            />
          </div>
        )}
      </div>

      {/* Create / Edit modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal(m => ({ ...m, open: false }))}
        title={modal.data.id ? `Edit: ${modal.data.ticketNumber}` : 'New Support Ticket'}
        subtitle="Submit an issue for support"
        footer={
          <>
            <Btn variant="secondary" onClick={() => setModal(m => ({ ...m, open: false }))}>Cancel</Btn>
            <Btn variant="primary" loading={saving} onClick={handleSave}>
              {modal.data.id ? 'Save Changes' : 'Submit Ticket'}
            </Btn>
          </>
        }
      >
        <TicketForm data={modal.data} onChange={d => setModal(m => ({ ...m, data: d }))} isEdit={!!modal.data.id} />
      </Modal>
    </AppPage>
  );
};

export default Helpdesk;


