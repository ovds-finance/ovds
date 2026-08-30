import type { SecurityAssessment, SecurityScan, SecurityFinding, SecuritySummary } from '../types';

const API_BASE = '/api/security-assessment';

async function fetchAssessments(query?: { page?: number; limit?: number; status?: string }) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.status) params.set('status', query.status);

  const res = await fetch(`${API_BASE}/assessments?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch assessments');
  return res.json() as Promise<{ data: SecurityAssessment[]; total: number; page: number; limit: number; totalPages: number }>;
}

async function fetchAssessment(id: string) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch assessment');
  return res.json() as Promise<SecurityAssessment>;
}

async function createAssessment(data: Partial<SecurityAssessment>) {
  const res = await fetch(`${API_BASE}/assessments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create assessment');
  return res.json() as Promise<SecurityAssessment>;
}

async function updateAssessment(id: string, data: Partial<SecurityAssessment>) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update assessment');
  return res.json() as Promise<SecurityAssessment>;
}

async function deleteAssessment(id: string) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete assessment');
  return res.json();
}

async function startAssessment(id: string) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}/start`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start assessment');
  return res.json() as Promise<SecurityAssessment>;
}

async function completeAssessment(id: string) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(id)}/complete`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to complete assessment');
  return res.json() as Promise<SecurityAssessment>;
}

async function fetchScans(assessmentId: string) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(assessmentId)}/scans`);
  if (!res.ok) throw new Error('Failed to fetch scans');
  return res.json() as Promise<SecurityScan[]>;
}

async function createScan(assessmentId: string, data: Partial<SecurityScan>) {
  const res = await fetch(`${API_BASE}/assessments/${encodeURIComponent(assessmentId)}/scans`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create scan');
  return res.json() as Promise<SecurityScan>;
}

async function updateScan(id: string, data: Partial<SecurityScan>) {
  const res = await fetch(`${API_BASE}/scans/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update scan');
  return res.json() as Promise<SecurityScan>;
}

async function fetchFindings(query?: { page?: number; limit?: number; severity?: string; status?: string; category?: string; assessmentId?: string }) {
  const params = new URLSearchParams();
  if (query?.page) params.set('page', String(query.page));
  if (query?.limit) params.set('limit', String(query.limit));
  if (query?.severity) params.set('severity', query.severity);
  if (query?.status) params.set('status', query.status);
  if (query?.category) params.set('category', query.category);
  if (query?.assessmentId) params.set('assessmentId', query.assessmentId);

  const res = await fetch(`${API_BASE}/findings?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch findings');
  return res.json() as Promise<{ data: SecurityFinding[]; total: number; page: number; limit: number; totalPages: number }>;
}

async function fetchFinding(id: string) {
  const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error('Failed to fetch finding');
  return res.json() as Promise<SecurityFinding>;
}

async function updateFinding(id: string, data: Partial<SecurityFinding>) {
  const res = await fetch(`${API_BASE}/findings/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update finding');
  return res.json() as Promise<SecurityFinding>;
}

async function fetchSummary() {
  const res = await fetch(`${API_BASE}/summary`);
  if (!res.ok) throw new Error('Failed to fetch summary');
  return res.json() as Promise<SecuritySummary>;
}

export const securityAssessmentApi = {
  fetchAssessments,
  fetchAssessment,
  createAssessment,
  updateAssessment,
  deleteAssessment,
  startAssessment,
  completeAssessment,
  fetchScans,
  createScan,
  updateScan,
  fetchFindings,
  fetchFinding,
  updateFinding,
  fetchSummary,
};

export { fetchAssessments, fetchAssessment, createAssessment, updateAssessment, deleteAssessment, startAssessment, completeAssessment, fetchScans, createScan, updateScan, fetchFindings, fetchFinding, updateFinding, fetchSummary };
