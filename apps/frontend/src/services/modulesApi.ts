/**
 * modulesApi — typed client for backend modules that don't have dedicated frontend services.
 *
 * Covers: Manufacturing, Procurement, Projects, Security, Cost Centers, Fiscal,
 * Helpdesk, Leaves, Licensing, Loyalty, Nodes, Payroll, Periods, Shifts,
 * Expense Claims, Disaster Fund, Infrastructure, Biometrics, Business Registration
 */
import api from './api';

// -- Manufacturing --
export const manufacturingApi = {
  getOrders: () => api.get('/manufacturing/orders'),
  getOrder: (id: string) => api.get(`/manufacturing/orders/${id}`),
  createOrder: (data: any) => api.post('/manufacturing/orders', data),
  updateOrder: (id: string, data: any) => api.put(`/manufacturing/orders/${id}`, data),
  deleteOrder: (id: string) => api.delete(`/manufacturing/orders/${id}`),
  getBoms: () => api.get('/manufacturing/boms'),
  getReports: () => api.get('/manufacturing/reports'),
};

// -- Procurement --
export const procurementApi = {
  getRequests: () => api.get('/procurement/requests'),
  getRequest: (id: string) => api.get(`/procurement/requests/${id}`),
  createRequest: (data: any) => api.post('/procurement/requests', data),
  approveRequest: (id: string) => api.post(`/procurement/approvals/${id}`),
  getVendors: () => api.get('/procurement/vendors'),
};

// -- Projects --
export const projectsApi = {
  getProjects: () => api.get('/projects'),
  getProject: (id: string) => api.get(`/projects/${id}`),
  createProject: (data: any) => api.post('/projects', data),
  updateProject: (id: string, data: any) => api.put(`/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/projects/${id}`),
  getTasks: (projectId: string) => api.get(`/projects/${projectId}/tasks`),
  getMembers: (projectId: string) => api.get(`/projects/${projectId}/members`),
  getReports: () => api.get('/projects/reports'),
};

// -- Security --
export const securityApi = {
  getLogs: () => api.get('/security/logs'),
  getEvents: () => api.get('/security/events'),
  getAlerts: () => api.get('/security/alerts'),
};

// -- Cost Centers --
export const costCentersApi = {
  getAll: () => api.get('/cost-centers'),
  getById: (id: string) => api.get(`/cost-centers/${id}`),
  create: (data: any) => api.post('/cost-centers', data),
  update: (id: string, data: any) => api.put(`/cost-centers/${id}`, data),
  remove: (id: string) => api.delete(`/cost-centers/${id}`),
};

// -- Fiscal --
export const fiscalApi = {
  getPeriods: () => api.get('/fiscal/periods'),
  getCurrentPeriod: () => api.get('/fiscal/year'),
  closePeriod: (id: string) => api.post(`/fiscal/close/${id}`),
};

// -- Helpdesk --
export const helpdeskApi = {
  getTickets: () => api.get('/helpdesk/tickets'),
  getTicket: (id: string) => api.get(`/helpdesk/tickets/${id}`),
  createTicket: (data: any) => api.post('/helpdesk/tickets', data),
  getKnowledgeBase: () => api.get('/helpdesk/knowledge-base'),
  getReports: () => api.get('/helpdesk/reports'),
};

// -- Leaves --
export const leavesApi = {
  getTypes: () => api.get('/leaves/types'),
  getRequests: () => api.get('/leaves/requests'),
  getRequest: (id: string) => api.get(`/leaves/requests/${id}`),
  createRequest: (data: any) => api.post('/leaves/requests', data),
  approveRequest: (id: string) => api.post(`/leaves/requests/${id}/approve`),
  getBalances: () => api.get('/leaves/balances'),
};

// -- Licensing --
export const licensingApi = {
  getPlans: () => api.get('/licensing/plans'),
  getLicenses: () => api.get('/licensing/licenses'),
  activate: (data: any) => api.post('/licensing/activation', data),
};

// -- Loyalty --
export const loyaltyApi = {
  getPrograms: () => api.get('/loyalty/programs'),
  getPoints: () => api.get('/loyalty/points'),
  getRewards: () => api.get('/loyalty/rewards'),
  redeemReward: (id: string) => api.post(`/loyalty/rewards/${id}/redeem`),
};

// -- Payroll --
export const payrollApi = {
  getRuns: () => api.get('/payroll/runs'),
  getEmployees: () => api.get('/payroll/employees'),
  getReports: () => api.get('/payroll/reports'),
  runPayroll: (data: any) => api.post('/payroll/runs', data),
};

// -- Periods --
export const periodsApi = {
  getAll: () => api.get('/periods'),
  getCurrent: () => api.get('/periods/current'),
  close: (id: string) => api.post(`/periods/close/${id}`),
};

// -- Shifts --
export const shiftsApi = {
  getSchedules: () => api.get('/shifts/schedules'),
  getAssignments: () => api.get('/shifts/assignments'),
  getReports: () => api.get('/shifts/reports'),
};

// -- Expense Claims --
export const expenseClaimsApi = {
  getAll: () => api.get('/expense-claims'),
  getById: (id: string) => api.get(`/expense-claims/${id}`),
  create: (data: any) => api.post('/expense-claims', data),
  approve: (id: string) => api.post(`/expense-claims/approvals/${id}`),
};

// -- Disaster Fund --
export const disasterFundApi = {
  getAll: () => api.get('/disaster-fund'),
  getById: (id: string) => api.get(`/disaster-fund/${id}`),
  create: (data: any) => api.post('/disaster-fund', data),
  getRequests: () => api.get('/disaster-fund/requests'),
};

// -- Infrastructure --
export const infrastructureApi = {
  getServers: () => api.get('/infrastructure/servers'),
  getNetworks: () => api.get('/infrastructure/networks'),
  getServices: () => api.get('/infrastructure/services'),
};

// -- Biometrics --
export const biometricsApi = {
  getStatus: () => api.get('/biometrics/status'),
  verify: (data: any) => api.post('/biometrics/verify', data),
  getConfig: () => api.get('/biometrics/config'),
};

// -- Business Registration --
export const businessRegistrationApi = {
  get: () => api.get('/business-registration'),
  getStatus: () => api.get('/business-registration/status'),
  create: (data: any) => api.post('/business-registration', data),
};

// -- Nodes --
export const nodesApi = {
  getAll: () => api.get('/nodes'),
  getById: (id: string) => api.get(`/nodes/${id}`),
  getStatus: () => api.get('/nodes/status'),
  heartbeat: () => api.post('/nodes/heartbeat'),
};

// -- Currency --
export const currencyApi = {
  getRates: () => api.get('/currency/rates'),
  getBase: () => api.get('/currency/base'),
};
