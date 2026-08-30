import React, { useState } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import {
  Code,
  Book,
  Terminal,
  Layers,
  Settings,
  Shield,
  Zap,
  Globe,
  Package,
  ChevronDown,
  ChevronRight,
  Copy,
  CheckCheck,
  ExternalLink,
  Users,
  Database,
  Lock,
  GitBranch,
  Cpu,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight,
  Star,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { FRONTEND_URL, API_URL } from '../utils/constants';

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

const DOC_SECTIONS: DocSection[] = [
  { id: 'readme',       title: 'Read Me',                icon: React.createElement(Book, { size: 15 }),     color: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'hierarchy',    title: 'Understanding Hierarchy', icon: React.createElement(Layers, { size: 15 }),   color: 'text-violet-600' },
  { id: 'modules',      title: 'Modules',                icon: React.createElement(Package, { size: 15 }),  color: 'text-emerald-600' },
  { id: 'menu',         title: 'Menu & Navigation',      icon: React.createElement(Globe, { size: 15 }),    color: 'text-teal-600' },
  { id: 'settings',     title: 'Settings',               icon: React.createElement(Settings, { size: 15 }), color: 'text-amber-600' },
  { id: 'permissions',  title: 'Permissions & RBAC',     icon: React.createElement(Shield, { size: 15 }),   color: 'text-rose-600' },
  { id: 'bulk-actions', title: 'Bulk Actions',           icon: React.createElement(Zap, { size: 15 }),      color: 'text-orange-600' },
  { id: 'search',       title: 'Search String',          icon: React.createElement(Terminal, { size: 15 }), color: 'text-cyan-600' },
  { id: 'overriding',   title: 'Overriding Output',      icon: React.createElement(Code, { size: 15 }),     color: 'text-emerald-600' },
  { id: 'hooking',      title: 'Hooking Models',         icon: React.createElement(GitBranch, { size: 15 }),color: 'text-pink-600' },
  { id: 'api',          title: 'RESTful API',            icon: React.createElement(Database, { size: 15 }), color: 'text-sky-600' },
  { id: 'beyond-crud',  title: 'Beyond CRUD',            icon: React.createElement(Cpu, { size: 15 }),      color: 'text-lime-600' },
  { id: 'payment',      title: 'Payment Methods',        icon: React.createElement(Lock, { size: 15 }),     color: 'text-purple-600' },
  { id: 'versioning',   title: 'Version Compatibility',  icon: React.createElement(GitBranch, { size: 15 }),color: 'text-slate-600' },
  { id: 'become-dev',   title: 'Become a Developer',     icon: React.createElement(Star, { size: 15 }),     color: 'text-yellow-600' },
  { id: 'faq',          title: 'FAQ & Troubleshooting',  icon: React.createElement(AlertCircle, { size: 15 }), color: 'text-rose-500' },
  { id: 'testing',      title: 'Testing',                icon: React.createElement(CheckCircle, { size: 15 }), color: 'text-emerald-500' },
  { id: 'i18n',         title: 'Internationalization',   icon: React.createElement(Globe, { size: 15 }),       color: 'text-teal-500' },
  { id: 'platform',     title: 'Platform Reference',     icon: React.createElement(Layers, { size: 15 }),      color: 'text-emerald-600 dark:text-emerald-400' },
];

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
  POST:   'bg-emerald-50 text-emerald-600 dark:text-emerald-400 border border-emerald-200',
  PATCH:  'bg-amber-50 text-amber-700 border border-amber-200',
  DELETE: 'bg-rose-50 text-rose-700 border border-rose-200',
  PUT:    'bg-purple-50 text-purple-700 border border-purple-200',
};

const versionRows = [
  { module: '1.3.6', ovdsReleased: '2.1.9',  userVersion: '2.1.9',  gets: '1.3.6' },
  { module: '1.3.7', ovdsReleased: '2.1.10', userVersion: '2.1.10', gets: '1.3.7' },
  { module: '—',     ovdsReleased: '2.1.11', userVersion: '2.1.11', gets: '1.3.7' },
  { module: '1.3.8', ovdsReleased: '2.1.12', userVersion: '2.1.12', gets: '1.3.8' },
  { module: '1.3.9', ovdsReleased: '2.1.13', userVersion: '2.1.12', gets: '1.3.8' },
];

const rbacRoles = [
  { role: 'SPURADMIN',  weight: 200, scope: 'Full system — bypasses all policies',         color: 'bg-rose-100 text-rose-700' },
  { role: 'SUPERADMIN', weight: 190, scope: 'Company super admin — full access',           color: 'bg-rose-100 text-rose-700' },
  { role: 'DEVELOPER',  weight: 150, scope: 'Full API + system, read-only audit',          color: 'bg-orange-100 text-orange-700' },
  { role: 'ADMIN',      weight: 100, scope: 'Full operations, read ovds/HR',            color: 'bg-violet-100 text-violet-700' },
  { role: 'OVDS',       weight: 60,  scope: 'Full OVDS, VAT, payroll approve',         color: 'bg-emerald-100 text-emerald-700' },
  { role: 'ACCOUNTING', weight: 55,  scope: 'Bookkeeping, bank reconciliation, VAT calc',  color: 'bg-teal-100 text-teal-700' },
  { role: 'HR',         weight: 50,  scope: 'Full HRIS, payroll generate',                 color: 'bg-indigo-100 text-indigo-700' },
  { role: 'AUDITOR',    weight: 30,  scope: 'Read-only all domains + annotate audit logs', color: 'bg-slate-100 text-slate-700' },
  { role: 'EMPLOYEE',   weight: 10,  scope: 'Self-service: leaves, payslips, expenses',    color: 'bg-sky-100 text-sky-700' },
  { role: 'CRM',        weight: 25,  scope: 'Customer management, invoice read',           color: 'bg-pink-100 text-pink-700' },
];

const apiEndpoints = [
  { method: 'POST',  path: '/api/auth/login',        desc: 'JWT login (rate: 10/min)' },
  { method: 'POST',  path: '/api/auth/signup',       desc: 'Self-registration (rate: 5/min)' },
  { method: 'GET',   path: '/api/auth/me',           desc: 'Current user info' },
  { method: 'POST',  path: '/api/auth/logout',       desc: 'Logout + audit log' },
  { method: 'GET',   path: '/api/employees',         desc: 'List employees (paginated)' },
  { method: 'POST',  path: '/api/employees',         desc: 'Create employee' },
  { method: 'GET',   path: '/api/invoices',          desc: 'List invoices (paginated)' },
  { method: 'POST',  path: '/api/invoices',          desc: 'Create invoice' },
  { method: 'GET',   path: '/api/payroll',           desc: 'Payroll summaries' },
  { method: 'GET',   path: '/api/ovds/accounts',  desc: 'Chart of accounts' },
  { method: 'GET',   path: '/api/vat/dashboard',     desc: 'VAT dashboard KPIs' },
  { method: 'GET',   path: '/api/dashboard/stats',   desc: 'Dashboard stats' },
  { method: 'GET',   path: '/api/health/detailed',   desc: 'System health check' },
];

// --- Sub-components -----------------------------------------------------------

const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'typescript' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 dark:bg-slate-900">
        <span className="text-xs text-slate-400 font-mono">{language}</span>
        <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors" aria-label="Copy code">
          {copied ? <CheckCheck size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="bg-slate-800 dark:bg-slate-900 text-slate-100 text-xs p-4 overflow-x-auto leading-relaxed font-mono whitespace-pre-wrap">{code}</pre>
    </div>
  );
};

const InfoBox: React.FC<{ type?: 'info' | 'warning' | 'success'; children: React.ReactNode }> = ({ type = 'info', children }) => {
  const styles = {
    info:    'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-600 dark:text-emerald-300',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-300',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-600 dark:text-emerald-300',
  };
  const icons = {
    info:    <Info size={15} className="shrink-0 mt-0.5" />,
    warning: <AlertCircle size={15} className="shrink-0 mt-0.5" />,
    success: <CheckCircle size={15} className="shrink-0 mt-0.5" />,
  };
  return (
    <div className={`flex gap-2 rounded-lg border p-3 text-sm my-3 ${styles[type]}`}>
      {icons[type]}
      <div>{children}</div>
    </div>
  );
};

const SectionHeading: React.FC<{ id: string; icon: React.ReactNode; title: string; color?: string }> = ({ id, icon, title, color = 'text-emerald-600 dark:text-emerald-400' }) => (
  <div id={id} className="flex items-center gap-2 mb-4 pt-2 scroll-mt-20">
    <span className={color}>{icon}</span>
    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
  </div>
);

const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200 mt-5 mb-2">{children}</h3>
);

const Paragraph: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-3">{children}</p>
);

const Divider = () => <hr className="my-8 border-slate-200 dark:border-slate-700" />;

const Badge: React.FC<{ label: string; color?: string }> = ({ label, color = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{label}</span>
);

// --- Collapsible section ------------------------------------------------------

const Collapsible: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg mb-3 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
        {open ? <ChevronDown size={15} className="text-slate-500" /> : <ChevronRight size={15} className="text-slate-500" />}
      </button>
      {open && (
        <div className="px-4 py-3 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-400">
          {children}
        </div>
      )}
    </div>
  );
};

// --- Main page component ------------------------------------------------------

const Developers: React.FC = () => {
  usePageTitle('Developer Hub');
  const [activeSection, setActiveSection] = useState('readme');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', github: '', country: '',
    teamType: 'lone-wolf', nestjsExp: '', reactExp: '', prismaExp: '',
    background: '', hasModuleExp: 'no', publicProjects: '', appIdea: '',
    appCount: '', heardFrom: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    toast.success('Application submitted! We will review it shortly.');
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      {/* -- Left sidebar -- */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 h-screen overflow-y-auto">
        <div className="px-4 py-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <Code size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Developer Hub</p>
              <p className="ovds-caption">OVDS ERP v2.0</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="Documentation sections">
          {DOC_SECTIONS.map(sec => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeSection === sec.id
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span className={activeSection === sec.id ? 'text-emerald-600 dark:text-emerald-400' : sec.color}>{sec.icon}</span>
              {sec.title}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700">
          <a
            href={`${import.meta.env.VITE_API_URL ?? '/api'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <ExternalLink size={12} />
            Swagger API Docs
          </a>
        </div>
      </aside>

      {/* -- Main content -- */}
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-8 py-8 overflow-y-auto">

        {/* Hero */}
        <div className="mb-8 relative rounded-2xl overflow-hidden border border-emerald-500/20 bg-white dark:bg-gradient-to-r dark:from-emerald-950/60 dark:via-slate-900 dark:to-slate-900 p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 w-64 h-px bg-gradient-to-r from-emerald-500/60 to-transparent" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-slate-200 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/10">
              <Code size={24} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="ovds-hero-title text-white">OVDS Developer Hub</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200 uppercase tracking-wider">v2.0</span>
              </div>
              <p className="text-emerald-400/70 text-sm leading-relaxed">
                Build modules, extend the API, and integrate with the OVDS ERP platform.
                OVDS is a production-ready, multi-tenant ERP for Ethiopian businesses — built on
                NestJS 11 + React 18 + Prisma 7 + MySQL/MariaDB.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge label="NestJS 11" color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200" />
                <Badge label="React 18" color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200" />
                <Badge label="Prisma 7" color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200" />
                <Badge label="TypeScript" color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200" />
                <Badge label="MySQL/MariaDB" color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-slate-200" />
              </div>
            </div>
          </div>
        </div>

        {/* -- READ ME -- */}
        <SectionHeading id="readme" icon={<Book size={20} />} title="Read Me" color="text-emerald-600 dark:text-emerald-400" />
        <Paragraph>
          OVDS (Online VAT Declaration System) is a production-ready, multi-tenant ERP platform built for Ethiopian
          businesses. It provides full HR, payroll, accounting, tax compliance (VAT/ERCA), invoice, CRM, and business
          management in a single system. From invoice to expense tracking to accounting, OVDS has all the basic tools
          to manage money online.
        </Paragraph>
        <Paragraph>
          Instead of creating bloated software by adding all features to the core, OVDS uses a modular structure so it
          can be extended easily. OVDS provides an App Store for users and creates an income channel for React developers
          worldwide. A module is a kind of React package — it has routes, views, controllers, and models.
        </Paragraph>

        <InfoBox type="info">
          <strong>Module vs App:</strong> While technically called a <em>Module</em>, it is named <em>App</em> in the UI
          for end-users, as that is what they are familiar with.
        </InfoBox>

        <SubHeading>Install OVDS</SubHeading>
        <CodeBlock language="bash" code={`# 1. Clone the repository
git clone https://github.com/ovds/ovds.git
cd ovds

# 2. Install dependencies
npm install
npm install --prefix frontend

# 3. Copy environment file and configure
cp .env.example .env
# Edit .env — set PRISMA_DATABASE_URL

# 4. Push schema and seed demo data
npm run db:push
npm run seed

# 5. Start everything
npm run dev:all`} />

        <Paragraph>
          After startup: Frontend at <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{FRONTEND_URL}</code>,
          Backend API at <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{API_URL}</code>,
          Swagger docs at <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{API_URL}/docs</code>.
        </Paragraph>

        <SubHeading>Common Dev Commands</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Command</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['npm run dev:all',                    'Start backend (watch) + frontend (Vite) concurrently'],
                ['npm run start:dev',                  'Backend only — NestJS watch mode'],
                ['npm run dev --prefix frontend',      `Frontend only — Vite dev server → ${FRONTEND_URL}`],
                ['npm run build',                      'Compile NestJS backend'],
                ['npm run build --prefix frontend',    'Build frontend for production → ./public'],
                ['npm run db:push',                    'Apply Prisma schema changes to database'],
                ['npx prisma generate',                'Regenerate Prisma client after schema change'],
                ['npm run db:studio',                  'Open Prisma Studio GUI → localhost:5555'],
                ['npm run seed',                       'Seed demo data and default users'],
                ['npm run db:reset',                   '⚠ Drop + recreate all tables + reseed (dev only)'],
                ['npm run test',                       'Run Jest unit tests'],
                ['npm run test:e2e',                   'Run end-to-end tests'],
              ].map(([cmd, desc]) => (
                <tr key={cmd} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{cmd}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Default Login Credentials</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Role</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Username</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Password</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['SPURADMIN',  'superadmin@ovds.com', 'SuperAdmin@2026!',  'bg-rose-100 text-rose-700'],
                ['ADMIN',      'admin@ovds.com',      'changeme123',       'bg-violet-100 text-violet-700'],
                ['HR',         'hr@ovds.com',         'hr_pass_2026',      'bg-indigo-100 text-indigo-700'],
                ['OVDS', 'ovds@ovds.com',    'fin_pass_2026',     'bg-emerald-100 text-emerald-700'],
                ['ACCOUNTING', 'selam@ovds.com',      'acct_pass_2026',    'bg-teal-100 text-teal-700'],
                ['AUDITOR',    'bereket@ovds.com',    'audit_pass_2026',   'bg-slate-100 text-slate-700'],
                ['EMPLOYEE',   'employee@ovds.com',   'emp_pass_2026',     'bg-sky-100 text-sky-700'],
                ['CRM',        'crm@ovds.com',        'crm_pass_2026',     'bg-pink-100 text-pink-700'],
              ].map(([role, user, pass, color]) => (
                <tr key={role} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${color}`}>{role}</span>
                  </td>
                  <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{user}</td>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{pass}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <InfoBox type="warning">
          Run <code>npm run seed</code> to create all users. <strong>SPURADMIN</strong> bypasses all RBAC route
          policies — use it to test any page regardless of role restrictions.
        </InfoBox>

        <SubHeading>Port Reference</SubHeading>
        <div className="flex flex-wrap gap-3 my-3">
          {[
            { port: '5173', service: 'Vite dev server',  fix: 'Kill stale node processes' },
            { port: '3000', service: 'NestJS API',        fix: 'npx kill-port 3000' },
            { port: '3306', service: 'MySQL / MariaDB',   fix: 'Start XAMPP MySQL service' },
            { port: '5555', service: 'Prisma Studio',     fix: 'npx kill-port 5555' },
          ].map(p => (
            <div key={p.port} className="flex-1 min-w-[160px] rounded-lg border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900">
              <p className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">{p.port}</p>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{p.service}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.fix}</p>
            </div>
          ))}
        </div>

        <Divider />

        {/* -- HIERARCHY -- */}
        <SectionHeading id="hierarchy" icon={<Layers size={20} />} title="Understanding the Hierarchy" color="text-violet-600" />
        <Paragraph>
          OVDS is built around three core concepts that nest inside each other. Understanding this
          hierarchy is essential before building any module.
        </Paragraph>

        <div className="ovds-grid-layout cols-3 my-4">
          {[
            { icon: <Users size={20} />, title: 'Users', desc: 'Located at the top of the OVDS pyramid. Each user has a single role that determines their access across all companies they belong to.', color: 'border-violet-200 bg-violet-50 dark:bg-violet-900/20' },
            { icon: <Database size={20} />, title: 'Companies', desc: 'A company (business) is where accounting records such as invoices, customers, employees, and payroll live. Multi-tenant isolation enforced via CompanyGuard.', color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <Package size={20} />, title: 'Modules / Apps', desc: 'Extend OVDS with custom modules. Each module has routes, services, controllers, and models. Installed per company via the App Store.', color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' },
          ].map(item => (
            <div key={item.title} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="text-slate-600 dark:text-slate-300 mb-2">{item.icon}</div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{item.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <InfoBox type="info">
          <strong>Multi-tenancy:</strong> Every request is scoped to a company via <code>CompanyGuard</code>. All Prisma
          queries must include <code>where: {"{ companyId }"}</code>. SPURADMIN can operate across all companies; all
          other roles are strictly tenant-scoped.
        </InfoBox>

        <SubHeading>Data Flow</SubHeading>
        <Paragraph>
          Understanding how a request flows through the system helps you place your code in the right layer.
        </Paragraph>
        <CodeBlock language="text" code={`HTTP Request
  → ThrottlerGuard        (rate limiting — 600 req/min global)
  → AnyAuthGuard          (validates JWT — HS256 local or RS256 Auth0)
  → CompanyGuard          (injects req.companyId from JWT)
  → RBACGuard             (checks @Roles() decorator; SPURADMIN bypasses)
  → Controller method     (validates DTO with class-validator)
  → Service method        (business logic + Prisma queries)
  → TransformInterceptor  (wraps response: { statusCode, message, data, success })
  → HTTP Response`} />

        <SubHeading>Key Relationships</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Entity</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Belongs to</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Key field</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['User',        'Company (optional)',  'companyId — null for SPURADMIN'],
                ['Employee',    'Company',             'companyId — required'],
                ['Invoice',     'Company',             'companyId — required'],
                ['PayrollRecord','Employee + Company', 'employeeId + companyId'],
                ['JournalEntry','Company',             'companyId — required'],
                ['VatFiling',   'Company',             'companyId — required'],
                ['AuditLog',    'User + Company',      'userId + companyId'],
                ['Notification','Employee + Company',  'employeeId + companyId'],
              ].map(([entity, belongs, key]) => (
                <tr key={entity} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{entity}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{belongs}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Adding a New Tenant-Scoped Entity</SubHeading>
        <CodeBlock language="typescript" code={`// 1. Prisma model — always include companyId + index
model MyEntity {
  id        String   @id @default(cuid())
  name      String
  companyId String                        // ← tenant isolation
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([companyId])                    // ← query performance
}

// 2. Service — always filter by companyId
async findAll(companyId: string) {
  return this.prisma.myEntity.findMany({
    where: { companyId },                 // ← never omit this
  });
}

// 3. Controller — inject companyId from CompanyGuard
@Get()
@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
findAll(@Req() req: Request) {
  return this.service.findAll(req['companyId']);
}`} />

        <Divider />

        {/* -- MODULES -- */}
        <SectionHeading id="modules" icon={<Package size={20} />} title="Modules" color="text-emerald-600" />
        <Paragraph>
          OVDS ships with core accounting tools needed to manage money. It also has a modular structure so you can extend
          it. A module is like a NestJS feature module combined with a React page — it has routes, views, controllers,
          and models.
        </Paragraph>

        <SubHeading>Folder Structure</SubHeading>
        <CodeBlock language="text" code={`src/
  my-module/
    my-module.module.ts         # NestJS module definition
    my-module.controller.ts     # REST endpoints
    my-module.service.ts        # Business logic
    my-module.service.spec.ts   # Unit tests
    dto/
      create-my-module.dto.ts
      update-my-module.dto.ts
      my-module-query.dto.ts    # extends PaginationQueryDto

frontend/src/
  pages/
    MyModule.tsx                # React page component
  components/
    MyModule/
      MyModuleModal.tsx         # Create / edit modal
      MyModuleCard.tsx          # List item card`} />

        <SubHeading>Creating a Module (Backend)</SubHeading>
        <CodeBlock language="bash" code={`# Generate NestJS module scaffold
nest g module my-module
nest g controller my-module
nest g service my-module

# Then apply your Prisma model
npm run db:push
npx prisma generate`} />

        <SubHeading>NestJS Module File</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.module.ts
import { Module } from '@nestjs/common';
import { MyModuleController } from './my-module.controller';
import { MyModuleService }    from './my-module.service';
import { PrismaModule }       from '../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],       // always import PrismaModule
  controllers: [MyModuleController],
  providers:   [MyModuleService],
  exports:     [MyModuleService],    // export if other modules need it
})
export class MyModule {}`} />

        <SubHeading>DTO Patterns</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/dto/create-my-module.dto.ts
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional }            from '@nestjs/swagger';

export class CreateMyModuleDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
}

// Update DTO — all fields optional via PartialType
import { PartialType } from '@nestjs/swagger';
export class UpdateMyModuleDto extends PartialType(CreateMyModuleDto) {}`} />

        <SubHeading>Prisma Model</SubHeading>
        <CodeBlock language="text" code={`// prisma/schema.prisma — add your model
model MyModuleRecord {
  id          String   @id @default(cuid())
  name        String
  description String?
  amount      Decimal  @default(0) @db.Decimal(15, 2)
  status      String   @default("ACTIVE")
  companyId   String                         // tenant isolation — required
  createdBy   String?                        // userId who created it
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([companyId])                       // always index companyId
  @@index([companyId, status])               // compound index for filtered lists
}`} />

        <SubHeading>Module Registration</SubHeading>
        <CodeBlock language="typescript" code={`// src/app.module.ts — add to imports array
import { MyModule } from './my-module/my-module.module';

@Module({
  imports: [
    // ... existing modules
    MyModule,
  ],
})
export class AppModule {}`} />

        <SubHeading>Module Checklist</SubHeading>
        <div className="space-y-1.5 my-3">
          {[
            'Create module + controller + service + DTO files',
            'Register in src/app.module.ts imports array',
            'Add CompanyGuard if tenant-scoped',
            'Inject AuditLogService for write operations',
            'Add Prisma model with companyId + @@index([companyId])',
            'Run npm run db:push + npx prisma generate',
            'Create React page in frontend/src/pages/',
            'Add lazy import and route in App.tsx',
            'Add nav entry in sidebar/index.tsx with RBAC permission',
            'Add to ROUTE_POLICY in rbac.ts',
            'Add to routeTitleMap in Layout.tsx',
            'Add to ROUTE_BREADCRUMBS in Header.tsx',
            'Add i18n keys to all 3 sections in i18n.json',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <SubHeading>Publishing to the App Store</SubHeading>
        <Paragraph>
          Once your module is ready, publish it to the OVDS App Store so other companies can install it.
        </Paragraph>
        <CodeBlock language="typescript" code={`// The App model tracks your published module
// POST /api/app-store  (ADMIN / SPURADMIN)
{
  "name":        "My Module",
  "slug":        "my-module",           // auto-generated from name
  "description": "What it does",
  "version":     "1.0.0",
  "category":    "ovds",
  "price":       0,                     // 0 = free
  "isActive":    true
}

// Users install via System Administration → App Store → Install
// Each install increments App.downloads
// Users can leave reviews (1–5 stars) — App.rating is recomputed automatically`} />

        <InfoBox type="info">
          The <code>slug</code> field is the unique identifier for your module across all OVDS installations.
          Choose it carefully — it cannot be changed after the first install.
        </InfoBox>

        <Divider />

        {/* -- MENU -- */}
        <SectionHeading id="menu" icon={<Globe size={20} />} title="Menu & Navigation" color="text-teal-600" />
        <Paragraph>
          The left sidebar organizes navigation into 12 domains. Each nav item is filtered by RBAC at render time —
          items the user cannot access are hidden entirely. The sidebar supports favorites, live notification badges,
          keyboard shortcuts, and a search filter.
        </Paragraph>

        <SubHeading>NavItem Shape</SubHeading>
        <CodeBlock language="typescript" code={`// All fields available on a nav item in sidebar/index.tsx
interface NavItem {
  to: string;                    // route path — e.g. '/my-module'
  icon: React.ReactNode;         // lucide-react icon
  label: string;                 // display text (use t() for i18n)
  key: string;                   // unique key — used for favorites + visited tracking
  roles?: AppRole[];             // restrict to specific roles (SPURADMIN bypasses)
  writePermission?: Permission;  // shows Eye icon if user only has :read
  businessTypes?: string[];      // restrict to specific company types
  isNew?: boolean;               // shows "New" badge
  badge?: number;                // numeric badge (e.g. unread count)
  shortcut?: string;             // keyboard shortcut hint shown in tooltip
  external?: boolean;            // opens in new tab
  action?: () => void;           // renders as button instead of NavLink
}`} />

        <SubHeading>Adding a Nav Item</SubHeading>
        <Paragraph>
          Add your page to the appropriate domain array in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/components/sidebar/index.tsx</code>.
          Choose the domain that best fits your module's purpose:
        </Paragraph>
        <CodeBlock language="typescript" code={`// Example: add to the ovds domain
{
  to: '/my-module',
  icon: <MyIcon size={16} />,
  label: t('nav.my_module'),
  key: 'my_module',
  roles: ['ADMIN', 'OVDS'],          // restrict to specific roles
  writePermission: 'my_module:write',   // shows Eye icon if read-only
  isNew: true,                          // shows "New" badge
  shortcut: 'G M',                      // keyboard shortcut hint
}`} />

        <SubHeading>Sidebar Domains</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Domain key</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Color</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Typical pages</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['dashboard',        'sky',     'Dashboard, AccountingDashboard'],
                ['hr',               'indigo',  'Employees, Attendance, Leaves, Shifts, Holidays'],
                ['payroll',          'violet',  'Payroll, PayrollAdministration'],
                ['sales',            'teal',    'Invoices, Customers, Items'],
                ['purchases',        'rose',    'Bills, Vendors, PurchaseOrders'],
                ['banking_treasury', 'emerald', 'BankAccounts, FundTransfers, BankStatementImport'],
                ['accounting',       'cyan',    'ChartOfAccounts, JournalEntries, PeriodClose'],
                ['tax_compliance',   'orange',  'VatAdministration, DisasterFund, TaxFiling'],
                ['crm_domain',       'purple',  'CRM, CustomerSummary, Partnerships'],
                ['financial_reports','violet',  'Reports, AuditLogs, AuditOutsourcing'],
                ['system',           'slate',   'Users, Settings, RolePermissions, AppStore'],
              ].map(([key, color, pages]) => (
                <tr key={key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{key}</td>
                  <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <Badge label={color} color="bg-slate-100 text-slate-600" />
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{pages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Dynamic Menu Items</SubHeading>
        <Paragraph>
          ADMIN users can create dynamic nav items via the UI without a code change. These are stored as{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">AdminCreatedMenuItem</code> records and
          fetched from <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">GET /admin-menu-items?isActive=true</code>.
          They appear appended to the system domain.
        </Paragraph>

        <SubHeading>Breadcrumbs & Page Title</SubHeading>
        <Paragraph>
          Every route needs two additional registrations so the header breadcrumb and browser tab title work correctly:
        </Paragraph>
        <CodeBlock language="typescript" code={`// 1. Page title — frontend/src/components/Layout.tsx
const routeTitleMap: Record<string, string> = {
  // ... existing entries
  '/my-module': 'My Module',
};

// 2. Breadcrumb — frontend/src/components/Header.tsx
const ROUTE_BREADCRUMBS: Record<string, { domain: string; label: string }> = {
  // ... existing entries
  '/my-module': { domain: 'ovds', label: 'My Module' },
  // Nested breadcrumb with › separator:
  '/my-module/detail': { domain: 'ovds › My Module', label: 'Detail' },
};`} />

        <SubHeading>Icons</SubHeading>
        <Paragraph>
          OVDS uses <strong>lucide-react</strong> exclusively. Browse all icons at{' '}
          <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
            lucide.dev/icons <ExternalLink size={11} />
          </a>. Import directly from the package:
        </Paragraph>
        <CodeBlock language="typescript" code={`import { FileText, TrendingUp, AlertTriangle } from 'lucide-react';

// Use at 16px in nav items, 20px in section headings, 24px in hero areas
<FileText size={16} className="text-slate-500" />`} />

        <Divider />

        {/* -- SETTINGS -- */}
        <SectionHeading id="settings" icon={<Settings size={20} />} title="Settings" color="text-amber-600" />
        <Paragraph>
          All system settings are stored in the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">SystemSetting</code> table
          as key-value pairs. Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">SettingsService</code> to read and write them.
          Settings are global per installation — not per company. For per-company config, store values on the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Company</code> model instead.
        </Paragraph>

        <SubHeading>Reading and Writing Settings</SubHeading>
        <CodeBlock language="typescript" code={`// Inject SettingsService into your module's service
constructor(private settingsService: SettingsService) {}

// Read a single setting (returns string | null)
const radius = await this.settingsService.getSetting('geofence_radius'); // '500'
const parsed = parseInt(radius ?? '500', 10);

// Read all settings as a flat object
const all = await this.settingsService.getAllSettings();
// { geofence_radius: '500', vat_rate: '15', ... }

// Upsert a single setting
await this.settingsService.updateSetting('my_module_enabled', 'true');

// Upsert multiple settings atomically
await this.settingsService.updateMany({
  'my_module_api_key':  'sk_live_...',
  'my_module_enabled':  'true',
  'my_module_max_items': '100',
});`} />

        <SubHeading>Module-Specific Settings</SubHeading>
        <Paragraph>
          Use a consistent key prefix for your module's settings to avoid collisions with core keys.
          Convention: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{'module_{slug}_{field}'}</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.service.ts
async getConfig() {
  const [enabled, apiKey, maxItems] = await Promise.all([
    this.settingsService.getSetting('module_my_module_enabled'),
    this.settingsService.getSetting('module_my_module_api_key'),
    this.settingsService.getSetting('module_my_module_max_items'),
  ]);
  return {
    enabled:  enabled  === 'true',
    apiKey:   apiKey   ?? '',
    maxItems: parseInt(maxItems ?? '50', 10),
  };
}

async saveConfig(dto: MyModuleConfigDto) {
  await this.settingsService.updateMany({
    'module_my_module_enabled':   String(dto.enabled),
    'module_my_module_api_key':   dto.apiKey,
    'module_my_module_max_items': String(dto.maxItems),
  });
}`} />

        <SubHeading>Settings Page in the UI</SubHeading>
        <Paragraph>
          Add a settings panel for your module under <strong>Settings → [Your Module]</strong>.
          Use the same pattern as the core notification settings page.
        </Paragraph>
        <CodeBlock language="typescript" code={`// frontend/src/components/MyModule/MyModuleSettings.tsx
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '../../services/api';
import { Can } from '../can';
import toast from 'react-hot-toast';

export const MyModuleSettings: React.FC = () => {
  const [config, setConfig] = useState({ enabled: false, apiKey: '', maxItems: 50 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet('/my-module/config').then(r => setConfig(r.data ?? r));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPost('/my-module/config', config);
      toast.success('Settings saved');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Can permission="settings:write" fallback={<p className="text-sm text-slate-500">Read-only</p>}>
      <div className="space-y-4 max-w-lg">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Enable My Module</span>
        </label>
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
          <input
            type="password"
            value={config.apiKey}
            onChange={e => setConfig(c => ({ ...c, apiKey: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
            placeholder="sk_live_..."
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </Can>
  );
};`} />

        <SubHeading>Common Setting Keys</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Key</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Default</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Used By</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['geofence_radius',      '500',                 'AttendanceService'],
                ['late_threshold',       '15',                  'AttendanceService'],
                ['standard_work_hours',  '8',                   'AttendanceService'],
                ['work_days',            'Mon,Tue,Wed,Thu,Fri', 'Attendance cron'],
                ['vat_rate',             '15',                  'Invoice VAT auto-calc'],
                ['drrf_rate',            '1',                   'DRRF levy auto-calc'],
                ['fiscal_year_start',    '7',                   'Ethiopian fiscal year (July)'],
                ['invoice_prefix',       'INV-',                'Invoice number generation'],
                ['default_currency',     'ETB',                 'ovds / Invoice'],
                ['timezone',             'Africa/Addis_Ababa',  'Date/time display'],
                ['notifications_config', '{}',                  'NotificationsService (JSON blob)'],
                ['company_logo_url',     '—',                   'Invoice PDFs + payslips'],
              ].map(([key, def, used]) => (
                <tr key={key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{key}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{def}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{used}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <InfoBox type="info">
          Settings values are always stored as <strong>strings</strong>. Parse them explicitly:
          use <code>parseInt()</code> for numbers, <code>=== 'true'</code> for booleans,
          and <code>JSON.parse()</code> for JSON blobs like <code>notifications_config</code>.
        </InfoBox>

        <Divider />

        {/* -- PERMISSIONS -- */}
        <SectionHeading id="permissions" icon={<Shield size={20} />} title="Permissions & RBAC" color="text-rose-600" />
        <Paragraph>
          OVDS provides a powerful RBAC system with 15 roles across 6 groups. Roles define privileges; users inherit
          permissions through their assigned role. The system is deny-by-default — no access unless explicitly granted.
        </Paragraph>

        <SubHeading>Role Hierarchy</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Role</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Weight</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Scope</th>
              </tr>
            </thead>
            <tbody>
              {rbacRoles.map(r => (
                <tr key={r.role} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${r.color}`}>{r.role}</span>
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{r.weight}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{r.scope}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Assigning Permissions to a Controller</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AnyAuthGuard } from '../auth/guards/any-auth.guard';
import { RBACGuard } from '../auth/guards/rbac.guard';
import { CompanyGuard } from '../auth/guards/company.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('MyModule')
@Controller('my-module')
export class MyModuleController {
  @Get()
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN')
  @ApiBearerAuth()
  findAll(@CurrentUser('id') userId: string, @Req() req: Request) {
    return this.service.findAll(req['companyId']);
  }
}`} />

        <SubHeading>Checking Permissions in React</SubHeading>
        <CodeBlock language="typescript" code={`// Always import from the barrel — never directly from rbac.ts
import { useRbac, Can } from '../rbac';

// Hook-based check
const { can, is, canCrud } = useRbac();
if (can('invoices:write')) { /* show edit button */ }
if (is('ovds', 'ADMIN')) { /* ovds-only UI */ }
if (canCrud('employees', 'delete')) { /* delete button */ }

// Declarative gate
<Can permission="payroll:approve" fallback={<ReadOnly />}>
  <ApproveButton />
</Can>

// Hierarchy check
  <Can atLeast="OVDS">
  <ovdsWidget />
</Can>

// MFA step-up gate
<Can permission="settings:write" requireMfa>
  <DangerousSettings />
</Can>`} />

        <SubHeading>Adding a New Permission</SubHeading>
        <div className="space-y-1.5 my-3">
          {[
            'Add permission string to ROLE_PERMISSIONS in frontend/src/rbac/rbac.ts',
            'Assign to appropriate roles in ROLE_PERMISSIONS',
            'Add to ROUTE_POLICY if it gates a route',
            'Add to RESOURCE_DOMAINS if it belongs to a resource domain',
            'Add to PERMISSION_GROUPS for UI grouping in Role Permissions page',
            'Add @Roles() decorator on backend controller using the new permission',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <ArrowRight size={14} className="text-rose-500 shrink-0 mt-0.5" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <InfoBox type="warning">
          OVDS does <strong>not</strong> support runtime role customization. Roles and permissions are compile-time
          constants in <code>frontend/src/rbac/rbac.ts</code> and enforced by <code>RBACGuard</code> on the backend.
          Modifying roles requires a code change and redeployment.
        </InfoBox>

        {/* -- RBAC vs ABAC -- */}
        <SubHeading>RBAC vs ABAC — When to Use Each</SubHeading>
        <Paragraph>
          RBAC answers access questions using roles. If you have the role, you have the access. That predictability is
          its strength — easy to explain, easy to audit, and easy to reason about, especially for teams managing large
          numbers of users. Most everyday access decisions fit this model comfortably.
        </Paragraph>
        <Paragraph>
          ABAC (Attribute-Based Access Control) approaches the problem differently. Instead of relying only on roles,
          it considers contextual attributes like MFA status, company type, subsidiary membership, or device posture.
          Access decisions can change dynamically based on these attributes, even if the user's role stays the same.
        </Paragraph>

        <div className="ovds-grid-layout cols-2 my-4">
          {[
            {
              title: 'RBAC — Role-Based',
              color: 'border-rose-200 bg-rose-50 dark:bg-rose-900/20',
              badge: 'bg-rose-100 text-rose-700',
              points: [
                'Predictable — role determines access',
                'Easy to audit and explain',
                'Compile-time constants in rbac.ts',
                'Enforced by RBACGuard on backend',
                'Deny-by-default for all routes',
                'SPURADMIN bypasses all policies',
              ],
            },
            {
              title: 'ABAC — Attribute-Based',
              color: 'border-violet-200 bg-violet-50 dark:bg-violet-900/20',
              badge: 'bg-violet-100 text-violet-700',
              points: [
                'Contextual — adapts to runtime state',
                'MFA step-up for sensitive routes',
                'Company type restrictions (e.g. MANUFACTURING)',
                'Subsidiary-scoped access',
                'requireCompany — must have active tenant',
                'Layered on top of RBAC, not a replacement',
              ],
            },
          ].map(card => (
            <div key={card.title} className={`rounded-xl border p-4 ${card.color}`}>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold mb-3 ${card.badge}`}>
                {card.title}
              </span>
              <ul className="space-y-1.5">
                {card.points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <InfoBox type="info">
          <strong>Layered approach:</strong> OVDS uses RBAC as the foundation and layers ABAC checks on top when
          needed. RBAC defines who should generally be allowed. ABAC refines <em>when</em> or <em>under what
          conditions</em> the access applies. This keeps the system understandable while handling real-world
          complexity — RBAC provides stability, ABAC adds flexibility where roles alone would be too rigid.
        </InfoBox>

        <SubHeading>ABAC Options — usePermissionGuard / &lt;Can&gt;</SubHeading>
        <Paragraph>
          Every ABAC option can be combined with RBAC checks. They are evaluated together — all conditions must pass.
        </Paragraph>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Option</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Type</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['permission', 'Permission', 'Single permission required (RBAC)'],
                ['anyOf / anyPermission', 'Permission[]', 'OR logic — any one permission suffices'],
                ['allOf / allPermissions', 'Permission[]', 'AND logic — all permissions required'],
                ['role', 'AppRole | AppRole[]', 'Exact role match (RBAC)'],
                ['atLeast', 'AppRole', 'Hierarchy weight >= target role'],
                ['requireCompany', 'boolean', 'Must have active company context (ABAC)'],
                ['requireMfa', 'boolean', 'Must have completed MFA step-up (ABAC)'],
                ['requireSubsidiary', 'string[]', 'Must belong to one of these subsidiaries (ABAC)'],
                ['requireBusinessType', 'string[]', 'Company must be a specific business type (ABAC)'],
                ['negate', 'boolean', 'Invert the entire check'],
                ['skip', 'boolean', 'Always allow — bypass all checks'],
              ].map(([opt, type, desc]) => (
                <tr key={opt} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{opt}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700 italic">{type}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>ABAC in Practice — Code Examples</SubHeading>
        <CodeBlock language="typescript" code={`// -- 1. Pure RBAC — role determines access ----------------------------------
<Can permission="payroll:approve">
  <ApproveButton />
</Can>

// -- 2. RBAC + MFA step-up (ABAC layer) --------------------------------------
// User must have the permission AND have completed MFA re-authentication
<Can permission="settings:write" requireMfa>
  <DangerousSettings />
</Can>

// -- 3. RBAC + company type restriction (ABAC layer) --------------------------
// Only show IFRS controls for companies that are subject to IFRS
<Can permission="ovds:write" requireBusinessType={['LARGE_ENTERPRISE', 'MANUFACTURING']}>
  <IFRSCompliancePanel />
</Can>

// -- 4. RBAC + active company required (ABAC layer) ---------------------------
// User must have selected a company before accessing this feature
<Can permission="invoices:write" requireCompany>
  <CreateInvoiceButton />
</Can>

// -- 5. Hierarchy check + subsidiary restriction (ABAC layer) -----------------
  <Can atLeast="OVDS" requireSubsidiary={['addis-branch', 'hawassa-branch']}>
  <BranchovdsPanel />
</Can>

// -- 6. OR logic across permissions -------------------------------------------
<Can anyOf={['vat:file', 'vat:write']}>
  <VatWorksheet />
</Can>

// -- 7. Negate — show only when access is denied ------------------------------
<Can permission="payroll:approve" negate>
  <ReadOnlyPayrollBanner />
</Can>`} />

        <SubHeading>usePermissionGuard — Programmatic ABAC</SubHeading>
        <CodeBlock language="typescript" code={`import { usePermissionGuard } from '../rbac';

// Combines RBAC + ABAC into a single guard with a reason
const { allowed, reason } = usePermissionGuard({
  permission: 'vat:file',
  requireMfa: true,
  requireCompany: true,
});

if (!allowed) {
  // reason is one of: 'no_permission' | 'no_mfa' | 'no_company' | 'no_subsidiary' | 'wrong_business_type'
  return <AccessDenied reason={reason} />;
}

// -- Combining multiple ABAC conditions ---------------------------------------
const { allowed: canExport } = usePermissionGuard({
  anyOf: ['reports:financial:full', 'reports:read'],
  atLeast: 'ACCOUNTING',
  requireCompany: true,
  requireMfa: true,
});`} />

        <SubHeading>MFA Step-Up Routes (Sensitive Routes)</SubHeading>
        <Paragraph>
          Certain routes require MFA re-authentication for Auth0 users regardless of their role.
          This is a pure ABAC check — the role alone is not sufficient.
        </Paragraph>
        <div className="flex flex-wrap gap-2 my-3">
          {[
            '/settings/users', '/settings/roles', '/settings', '/settings/audit-logs',
            '/settings/multi-company', '/hr/payroll-administration',
            '/vat-administration', '/tax-filing', '/admin/notifications-settings',
          ].map(route => (
            <code key={route} className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 px-2 py-0.5 rounded font-mono">
              {route}
            </code>
          ))}
        </div>
        <CodeBlock language="typescript" code={`// Adding a new sensitive route — edit SENSITIVE_ROUTES in frontend/src/rbac/rbac.ts
export const SENSITIVE_ROUTES = new Set([
  '/settings/users',
  '/settings/roles',
  '/settings',
  // ... existing routes
  '/my-sensitive-module',   // ← add your route here
]);

// The useRouteGuard hook checks this automatically on navigation
// Auth0 users will be prompted for MFA step-up before accessing the route`} />

        <SubHeading>Backend ABAC — CompanyGuard + Business Type</SubHeading>
        <Paragraph>
          On the backend, ABAC is enforced by combining <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">CompanyGuard</code> (tenant
          isolation) with manual checks in the service layer for business-type-specific logic.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Controller — RBAC layer (role check)
@Get('ifrs-report')
@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
@Roles('OVDS', 'IFRS_OFFICER')
async getIfrsReport(@Req() req: Request) {
  return this.service.getIfrsReport(req['companyId']);
}

// Service — ABAC layer (attribute check)
async getIfrsReport(companyId: string) {
  const company = await this.prisma.company.findUnique({ where: { id: companyId } });

  // ABAC: only IFRS-applicable business types can access this report
  const ifrsTypes = ['LARGE_ENTERPRISE', 'MANUFACTURING', 'MEDIUM_ENTERPRISE', 'GOVERNMENT'];
  if (!ifrsTypes.includes(company.businessType)) {
    throw new ForbiddenException(
      'IFRS reports are only available for Tier 1 and Tier 2 entities'
    );
  }

  return this.generateIfrsReport(company);
}`} />

        <Collapsible title="Decision guide — RBAC or ABAC?">
          <div className="space-y-3">
            {[
              { q: 'Does the access depend only on the user\'s role?', a: 'Use RBAC — add the permission to ROLE_PERMISSIONS and guard the route.' },
              { q: 'Does the access depend on whether the user has completed MFA?', a: 'Use ABAC — add requireMfa to <Can> or usePermissionGuard, and add the route to SENSITIVE_ROUTES.' },
              { q: 'Does the access depend on the company\'s business type?', a: 'Use ABAC — add requireBusinessType to <Can>, or check company.businessType in the service layer.' },
              { q: 'Does the access depend on which subsidiary the user belongs to?', a: 'Use ABAC — add requireSubsidiary to <Can> or usePermissionGuard.' },
              { q: 'Does the access depend on whether a company is selected?', a: 'Use ABAC — add requireCompany to <Can>. This prevents actions before onboarding is complete.' },
              { q: 'Does the access depend on a combination of the above?', a: 'Layer them — RBAC sets the baseline, ABAC adds the contextual conditions. All conditions must pass.' },
            ].map(({ q, a }, i) => (
              <div key={i} className="border-l-2 border-emerald-600 pl-3">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-0.5">{q}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{a}</p>
              </div>
            ))}
          </div>
        </Collapsible>

        <Divider />

        {/* -- BULK ACTIONS -- */}
        <SectionHeading id="bulk-actions" icon={<Zap size={20} />} title="Bulk Actions" color="text-orange-600" />
        <Paragraph>
          Bulk Actions let users select multiple records, choose an action, and apply it to all of them at once.
          OVDS uses <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Promise.allSettled</code> so
          individual failures never block the rest — you always get a full result summary.
        </Paragraph>

        <SubHeading>Backend Bulk Action Pattern</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.service.ts
async bulkAction(ids: string[], action: 'approve' | 'reject', adminId: string) {
  const results = await Promise.allSettled(
    ids.map(id => this.processOne(id, action, adminId))
  );
  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed    = results.filter(r => r.status === 'rejected').length;

  // Audit log the bulk operation
  this.auditLog.log(adminId, 'BULK_ACTION', {
    action, ids, succeeded, failed,
  }).catch(() => {});

  return { succeeded, failed, total: ids.length };
}

// src/my-module/my-module.controller.ts
@Post('bulk-action')
@UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
@Roles('OVDS', 'ADMIN')
bulkAction(@Body() dto: BulkActionDto, @CurrentUser('id') userId: string) {
  return this.service.bulkAction(dto.ids, dto.action, userId);
}

// src/my-module/dto/bulk-action.dto.ts
export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];

  @IsEnum(['approve', 'reject', 'delete'])
  action: 'approve' | 'reject' | 'delete';
}`} />

        <SubHeading>Frontend Bulk Action Pattern</SubHeading>
        <CodeBlock language="typescript" code={`const [selected, setSelected] = useState<string[]>([]);

// Toggle a single row
const toggleRow = (id: string) =>
  setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

// Toggle all visible rows
const toggleAll = (rows: { id: string }[]) =>
  setSelected(prev => prev.length === rows.length ? [] : rows.map(r => r.id));

const handleBulkApprove = async () => {
  if (!selected.length) return;
  const result = await apiPost('/my-module/bulk-action', {
    ids: selected,
    action: 'approve',
  });
  toast.success(\`\${result.data.succeeded} approved, \${result.data.failed} failed\`);
  setSelected([]);
  refetch();
};

// In the table header
<th>
  <input
    type="checkbox"
    checked={selected.length === data?.length && data.length > 0}
    onChange={() => toggleAll(data ?? [])}
    aria-label="Select all"
  />
</th>

// In each table row
<td>
  <input
    type="checkbox"
    checked={selected.includes(item.id)}
    onChange={() => toggleRow(item.id)}
    aria-label={\`Select \${item.name}\`}
  />
</td>

// Bulk action toolbar — only visible when rows are selected
{selected.length > 0 && (
  <div className="flex items-center gap-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
    <span className="text-sm text-emerald-600 dark:text-emerald-600 dark:text-emerald-400 font-medium">{selected.length} selected</span>
    <Can permission="my_module:write">
      <button onClick={handleBulkApprove} className="text-sm text-emerald-600 hover:underline">
        Approve all
      </button>
    </Can>
    <button onClick={() => setSelected([])} className="text-sm text-slate-500 hover:underline ml-auto">
      Clear
    </button>
  </div>
)}`} />

        <InfoBox type="info">
          Always wrap bulk action buttons in <code>&lt;Can&gt;</code> gates. A user with only <code>:read</code> permission
          should see the checkboxes but not the action buttons.
        </InfoBox>

        <Divider />

        {/* -- SEARCH STRING -- */}
        <SectionHeading id="search" icon={<Terminal size={20} />} title="Search String" color="text-cyan-600" />
        <Paragraph>
          OVDS uses <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">PaginationQueryDto</code> in
          the backend for search, filtering, sorting, and pagination. The frontend uses{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useDebounce</code> to avoid firing a
          request on every keystroke, and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">usePagination</code> to
          manage page state.
        </Paragraph>

        <SubHeading>Backend — PaginationQueryDto</SubHeading>
        <CodeBlock language="typescript" code={`// src/common/dto/pagination-query.dto.ts — already exists, reuse it
export class PaginationQueryDto {
  @IsOptional() @Type(() => Number) @IsNumber() page?:      number = 1;
  @IsOptional() @Type(() => Number) @IsNumber() take?:      number = 20;
  @IsOptional() @IsString()                     search?:    string;
  @IsOptional() @IsString()                     sortBy?:    string;
  @IsOptional() @IsIn(['asc', 'desc'])          sortOrder?: 'asc' | 'desc';
}

// Service — apply search + sort + pagination
async findAll(companyId: string, query: PaginationQueryDto) {
  const where = {
    companyId,
    ...(query.search && {
      OR: [
        { name:        { contains: query.search } },
        { description: { contains: query.search } },
        { reference:   { contains: query.search } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    this.prisma.myModel.findMany({
      where,
      take:    query.take  ?? 20,
      skip:    ((query.page ?? 1) - 1) * (query.take ?? 20),
      orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
    }),
    this.prisma.myModel.count({ where }),
  ]);

  return {
    data,
    pagination: {
      page:  query.page  ?? 1,
      take:  query.take  ?? 20,
      total,
      pages: Math.ceil(total / (query.take ?? 20)),
    },
  };
}`} />

        <SubHeading>Frontend — Debounced Search + Pagination</SubHeading>
        <CodeBlock language="typescript" code={`import { useState } from 'react';
import { useDebounce }  from '../hooks';
import { usePagination } from '@ovds/ui';
import { useApiQuery }   from '../hooks/useApiQuery';
import { useBusiness }   from '../context/businessContext';

export default function MyModulePage() {
  const { selectedCompanyId } = useBusiness();
  const [search, setSearch]   = useState('');
  const [sortBy, setSortBy]   = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearch = useDebounce(search, 400);  // 400ms delay
  const { page, take, setPage, paginationProps } = usePagination({ defaultTake: 20 });

  const { data, loading, refetch } = useApiQuery(
    \`/my-module?companyId=\${selectedCompanyId}\` +
    \`&search=\${debouncedSearch}&page=\${page}&take=\${take}\` +
    \`&sortBy=\${sortBy}&sortOrder=\${sortOrder}\`,
    {
      enabled: !!selectedCompanyId,
      deps: [selectedCompanyId, debouncedSearch, page, take, sortBy, sortOrder],
    }
  );

  // Reset to page 1 when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div>
      <input
        type="search"
        placeholder="Search..."
        value={search}
        onChange={e => handleSearch(e.target.value)}
        className="..."
        aria-label="Search items"
      />

      {/* Sortable column header */}
      <th
        onClick={() => {
          if (sortBy === 'name') setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
          else { setSortBy('name'); setSortOrder('asc'); }
        }}
        className="cursor-pointer select-none"
      >
        Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
      </th>

      {/* Pagination */}
      <Pagination {...paginationProps} total={data?.pagination.total} />
    </div>
  );
}`} />

        <SubHeading>Advanced Filtering</SubHeading>
        <Paragraph>
          For status or date range filters, extend the DTO and add them to the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">where</code> clause:
        </Paragraph>
        <CodeBlock language="typescript" code={`// Extended DTO
export class MyModuleQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString()  status?:    string;
  @IsOptional() @IsString()  dateFrom?:  string;
  @IsOptional() @IsString()  dateTo?:    string;
}

// Service — add to where clause
const where = {
  companyId,
  ...(query.status   && { status: query.status }),
  ...(query.dateFrom && { createdAt: { gte: new Date(query.dateFrom) } }),
  ...(query.dateTo   && { createdAt: { lte: new Date(query.dateTo)   } }),
  ...(query.search   && { OR: [{ name: { contains: query.search } }] }),
};`} />

        <Divider />

        {/* -- OVERRIDING OUTPUT -- */}
        <SectionHeading id="overriding" icon={<Code size={20} />} title="Overriding Output" color="text-emerald-600" />
        <Paragraph>
          To extend OVDS core functionality without modifying core files, use React component composition
          and NestJS service extension. This keeps OVDS upgradeable — you can pull upstream changes without
          merge conflicts.
        </Paragraph>

        <InfoBox type="warning">
          Never modify core files directly. Always extend or wrap them. Core files are anything inside
          <code> src/ovds/</code>, <code>src/payroll/</code>, <code>src/auth/</code>, and the shared
          components in <code>frontend/src/components/</code>.
        </InfoBox>

        <SubHeading>Override a React Component</SubHeading>
        <Paragraph>
          Create a wrapper component that renders your custom UI alongside the core component.
          Use React composition — pass the core component as a child or render it inside your wrapper.
        </Paragraph>
        <CodeBlock language="typescript" code={`// frontend/src/components/MyModule/CustomInvoiceForm.tsx
// Adds a custom field to the invoice form without touching the core

import React from 'react';
import { InvoiceForm } from '../invoices/invoiceForm';

interface Props {
  companyId: string;
  onSave: () => void;
}

export const CustomInvoiceForm: React.FC<Props> = ({ companyId, onSave }) => {
  const [customField, setCustomField] = React.useState('');

  const handleSave = async (invoiceData: CreateInvoiceDto) => {
    // Attach your custom field to the invoice notes or a custom endpoint
    await apiPost('/my-module/invoice-meta', {
      invoiceId: invoiceData.id,
      customField,
    });
    onSave();
  };

  return (
    <div>
      {/* Your custom field above the core form */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Custom Reference
        </label>
        <input
          value={customField}
          onChange={e => setCustomField(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      {/* Core invoice form — unchanged */}
      <InvoiceForm companyId={companyId} onSave={handleSave} />
    </div>
  );
};`} />

        <SubHeading>Override a NestJS Service Method</SubHeading>
        <Paragraph>
          Extend the core service class and override only the methods you need to change.
          Register your extended service in your module so NestJS uses it instead of the original.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/my-module/my-extended-ovds.service.ts
@Injectable()
export class MyExtendedovdsService extends ovdsService {
  async createInvoice(dto: CreateInvoiceDto, companyId: string, userId: string) {
    // -- Pre-processing ----------------------------------------------------
    await this.myCustomValidation(dto);

    // -- Call the original method ------------------------------------------
    const invoice = await super.createInvoice(dto, companyId, userId);

    // -- Post-processing ---------------------------------------------------
    await this.myCustomPostProcess(invoice);
    return invoice;
  }

  private async myCustomValidation(dto: CreateInvoiceDto) {
    // e.g. check a custom business rule
    if (dto.totalAmount > 1_000_000) {
      throw new BadRequestException('Invoices above ETB 1M require manager approval');
    }
  }
}

// src/my-module/my-module.module.ts — register the override
@Module({
  providers: [
    {
      provide: ovdsService,
      useClass: MyExtendedovdsService,  // replaces ovdsService everywhere in this module
    },
  ],
})
export class MyModule {}`} />

        <SubHeading>Override a React Page</SubHeading>
        <Paragraph>
          To replace an entire page, register your component on the same route in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">App.tsx</code>.
          The last matching route wins in React Router v6.
        </Paragraph>
        <CodeBlock language="typescript" code={`// frontend/src/App.tsx — add your override after the default route
// React Router v6 uses the first match, so place your override BEFORE the default

const ROUTES: [string, React.ComponentType][] = [
  ['/invoices', MyCustomInvoicesPage],  // ← your override (add before default)
  // ... other routes
];`} />

        <Divider />

        {/* -- HOOKING MODELS -- */}
        <SectionHeading id="hooking" icon={<GitBranch size={20} />} title="Hooking Models" color="text-pink-600" />
        <Paragraph>
          Hook into model lifecycle events without modifying core files. OVDS provides three patterns:
          Prisma middleware for database-level hooks, RxJS event bridges for real-time events, and
          NestJS event emitters for decoupled module communication.
        </Paragraph>

        <SubHeading>Pattern 1 — Prisma Middleware</SubHeading>
        <Paragraph>
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">prisma.$use()</code> to intercept
          any model action before or after it hits the database. Register in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">onModuleInit</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`@Injectable()
export class MyModelHook implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.prisma.$use(async (params, next) => {
      // -- Pre-action hook -----------------------------------------------
      if (params.model === 'Invoice' && params.action === 'create') {
        // Validate or mutate the data before it's written
        params.args.data.customField = this.computeCustomField(params.args.data);
      }

      const result = await next(params);  // execute the original query

      // -- Post-action hook ----------------------------------------------
      if (params.model === 'Invoice' && params.action === 'create') {
        // React to the newly created record
        await this.onInvoiceCreated(result);
      }

      return result;
    });
  }

  private async onInvoiceCreated(invoice: Invoice) {
    // e.g. create a linked record in your module's table
    await this.prisma.myModuleRecord.create({
      data: { invoiceId: invoice.id, companyId: invoice.companyId },
    });
  }
}`} />

        <SubHeading>Pattern 2 — RxJS Event Bridge (OVDS Pattern)</SubHeading>
        <Paragraph>
          OVDS uses RxJS Subjects to decouple services from the WebSocket gateway. Use the same pattern
          to emit events from your module that other modules or the gateway can subscribe to.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/my-module/my-events.service.ts
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface MyEventData {
  id: string;
  companyId: string;
  action: 'created' | 'updated' | 'deleted';
}

@Injectable()
export class MyEventsService {
  private readonly _event$ = new Subject<MyEventData>();
  readonly event$ = this._event$.asObservable();

  emit(data: MyEventData) {
    this._event$.next(data);
  }
}

// In your service — emit after a write
async create(dto: CreateDto, companyId: string, userId: string) {
  const record = await this.prisma.myModel.create({ data: { ...dto, companyId } });
  this.myEvents.emit({ id: record.id, companyId, action: 'created' });
  return record;
}

// In WebsocketGateway or another service — subscribe
export class WebsocketGateway implements OnGatewayInit {
  afterInit() {
    this.myEvents.event$.subscribe(data => {
      this.server.to(data.companyId).emit('myModuleEvent', data);
    });
  }
}`} />

        <SubHeading>Pattern 3 — NestJS EventEmitter</SubHeading>
        <Paragraph>
          For simpler one-way notifications between modules, use NestJS's built-in{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">EventEmitter2</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Emit an event from your service
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class MyService {
  constructor(private eventEmitter: EventEmitter2) {}

  async create(dto: CreateDto, companyId: string) {
    const record = await this.prisma.myModel.create({ data: dto });
    this.eventEmitter.emit('my-module.created', { record, companyId });
    return record;
  }
}

// Listen in another module
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationListener {
  @OnEvent('my-module.created')
  async handleCreated(payload: { record: MyModel; companyId: string }) {
    // e.g. send a notification to the company's employees
    await this.notificationsService.create({
      companyId: payload.companyId,
      title: 'New record created',
      message: \`Record \${payload.record.id} was created\`,
      type: 'GENERAL',
    });
  }
}`} />

        <InfoBox type="info">
          The RxJS pattern (Pattern 2) is preferred for real-time WebSocket events. The EventEmitter pattern
          (Pattern 3) is better for fire-and-forget notifications between modules. Prisma middleware
          (Pattern 1) is best when you need to intercept the database operation itself.
        </InfoBox>

        <Divider />

        {/* -- RESTful API -- */}
        <SectionHeading id="api" icon={<Database size={20} />} title="RESTful API" color="text-sky-600" />
        <Paragraph>
          OVDS provides a RESTful API to create, read, update, and delete (CRUD) all entities. The API uses JWT Bearer
          authentication. Access the interactive Swagger docs at{' '}
          <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1">
            /api/docs <ExternalLink size={12} />
          </a>.
        </Paragraph>

        <SubHeading>Authentication</SubHeading>
        <CodeBlock language="bash" code={`# 1. Get a JWT token
curl -X POST ${API_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"admin@ovds.com","password":"changeme123"}'
# Response: { "data": { "access_token": "eyJ..." } }

# 2. Use the token in subsequent requests
curl ${API_URL}/employees?companyId=<id> \\
  -H "Authorization: Bearer eyJ..."

# 3. Refresh — token expires after the configured TTL
# Re-POST /auth/login or use Auth0 silent refresh`} />

        <SubHeading>Standard Response Format</SubHeading>
        <CodeBlock language="json" code={`// Success — TransformInterceptor wraps every response
{ "statusCode": 200, "message": "OK", "success": true, "data": { ... } }

// Paginated list
{
  "statusCode": 200, "success": true,
  "data": {
    "data": [...],
    "pagination": { "page": 1, "take": 20, "total": 143, "pages": 8 }
  }
}

// Error — AllExceptionsFilter
{
  "statusCode": 404,
  "timestamp": "2026-04-18T10:30:00.000Z",
  "path": "/api/invoices/xyz",
  "message": "Invoice xyz not found",
  "error": "Not Found",
  "success": false
}`} />

        <SubHeading>Full CRUD Controller Pattern</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.controller.ts
@ApiTags('MyModule')
@Controller('my-module')
export class MyModuleController {
  constructor(private readonly service: MyModuleService) {}

  // -- List (paginated + searchable) ----------------------------------------
  @Get()
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN', 'ACCOUNTING')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all items (paginated)' })
  findAll(@Req() req: Request, @Query() query: PaginationQueryDto) {
    return this.service.findAll(req['companyId'], query);
  }

  // -- Get one ---------------------------------------------------------------
  @Get(':id')
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN', 'ACCOUNTING')
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: Request) {
    return this.service.findOne(id, req['companyId']);
  }

  // -- Create ----------------------------------------------------------------
  @Post()
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN')
  @ApiBearerAuth()
  @HttpCode(201)
  create(
    @Body() dto: CreateMyModuleDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.service.create(dto, req['companyId'], userId);
  }

  // -- Update ----------------------------------------------------------------
  @Patch(':id')
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN')
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMyModuleDto,
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ) {
    return this.service.update(id, dto, req['companyId'], userId);
  }

  // -- Delete ----------------------------------------------------------------
  @Delete(':id')
  @UseGuards(AnyAuthGuard, RBACGuard, CompanyGuard)
  @Roles('OVDS', 'ADMIN')
  @ApiBearerAuth()
  @HttpCode(204)
  remove(@Param('id') id: string, @Req() req: Request, @CurrentUser('id') userId: string) {
    return this.service.remove(id, req['companyId'], userId);
  }
}`} />

        <SubHeading>Full CRUD Service Pattern</SubHeading>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.service.ts
@Injectable()
export class MyModuleService {
  constructor(
    private prisma:    PrismaService,
    private auditLog:  AuditLogService,
  ) {}

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where = {
      companyId,
      ...(query.search && { name: { contains: query.search } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.myModuleRecord.findMany({
        where,
        take:    query.take  ?? 20,
        skip:    ((query.page ?? 1) - 1) * (query.take ?? 20),
        orderBy: { [query.sortBy ?? 'createdAt']: query.sortOrder ?? 'desc' },
      }),
      this.prisma.myModuleRecord.count({ where }),
    ]);
    return { data, pagination: { page: query.page ?? 1, take: query.take ?? 20, total, pages: Math.ceil(total / (query.take ?? 20)) } };
  }

  async findOne(id: string, companyId: string) {
    const record = await this.prisma.myModuleRecord.findUnique({ where: { id } });
    if (!record)                      throw new NotFoundException(\`Record \${id} not found\`);
    if (record.companyId !== companyId) throw new ForbiddenException();
    return record;
  }

  async create(dto: CreateMyModuleDto, companyId: string, userId: string) {
    const record = await this.prisma.myModuleRecord.create({
      data: { ...dto, companyId, createdBy: userId },
    });
    this.auditLog.log(userId, 'MY_MODULE_CREATED', { id: record.id }).catch(() => {});
    return record;
  }

  async update(id: string, dto: UpdateMyModuleDto, companyId: string, userId: string) {
    await this.findOne(id, companyId);   // validates ownership
    const record = await this.prisma.myModuleRecord.update({ where: { id }, data: dto });
    this.auditLog.log(userId, 'MY_MODULE_UPDATED', { id }).catch(() => {});
    return record;
  }

  async remove(id: string, companyId: string, userId: string) {
    await this.findOne(id, companyId);   // validates ownership
    await this.prisma.myModuleRecord.delete({ where: { id } });
    this.auditLog.log(userId, 'MY_MODULE_DELETED', { id }).catch(() => {});
  }
}`} />

        <SubHeading>Swagger Decorators Reference</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Decorator</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Where</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['@ApiTags(\'Name\')',                    'Controller class',  'Groups endpoints in Swagger UI'],
                ['@ApiBearerAuth()',                      'Controller/method', 'Shows lock icon — requires JWT'],
                ['@ApiOperation({ summary })',            'Method',            'Endpoint description'],
                ['@ApiResponse({ status, type })',        'Method',            'Documents response shape'],
                ['@ApiProperty()',                        'DTO field',         'Documents required field'],
                ['@ApiPropertyOptional()',                'DTO field',         'Documents optional field'],
                ['@ApiParam({ name, description })',      'Method',            'Documents URL parameter'],
                ['@ApiQuery({ name, required, type })',   'Method',            'Documents query parameter'],
              ].map(([dec, where, purpose]) => (
                <tr key={dec} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{dec}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{where}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Rate Limiting</SubHeading>
        <Paragraph>
          The global throttle is <strong>600 requests/minute per IP</strong>. Override per endpoint with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">@Throttle()</code>:
        </Paragraph>
        <CodeBlock language="typescript" code={`// Tighter limit on sensitive endpoints
@Post('submit')
@Throttle({ default: { ttl: 60_000, limit: 5 } })  // 5/min
async submit() { ... }

// Auth endpoints already have tight limits:
// POST /auth/login  → 10/min
// POST /auth/signup → 5/min`} />

        <SubHeading>Quick Endpoint Reference</SubHeading>
        <div className="space-y-1.5 my-3">
          {apiEndpoints.map((ep, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors">
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method] ?? ''}`}>{ep.method}</span>
              <code className="text-xs text-slate-700 dark:text-slate-300 font-mono flex-1">{ep.path}</code>
              <span className="text-xs text-slate-500 dark:text-slate-500 hidden sm:block">{ep.desc}</span>
            </div>
          ))}
        </div>

        <SubHeading>Security Headers, CORS & Request Logging</SubHeading>
        <Paragraph>
          OVDS applies security headers via <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">helmet</code> and
          configures CORS in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">src/main.ts</code>.
          All HTTP requests are logged by <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">RequestLoggerMiddleware</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/main.ts — applied before app.listen()
import helmet from 'helmet';

app.use(helmet());           // sets X-Frame-Options, X-Content-Type-Options, HSTS, etc.

app.enableCors({
  origin:         process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-background'],
});

// RequestLoggerMiddleware logs every request:
// [HTTP] GET /api/invoices?companyId=abc 200 45ms
// [HTTP] POST /api/auth/login 401 12ms
// Applied globally in AppModule.configure() on all routes`} />

        <SubHeading>eTax Reference Format</SubHeading>
        <Paragraph>
          ERCA submission references follow a standard format used across VAT, withholding, and BIT declarations:
        </Paragraph>
        <CodeBlock language="typescript" code={`// eTax reference format: ETAX-{TYPE}-{PERIOD}-{SEQ}
// Examples:
'ETAX-VATRETURN-2026-04-A3F2K'   // VAT return for April 2026
'ETAX-WHT_RETURN-2026-04-B7X9P'  // Withholding tax return
'ETAX-BIT_DECLARATION-2026-A1Z3' // Business income tax declaration

// Submission types
type EtaxSubmissionType = 'VAT_RETURN' | 'WHT_RETURN' | 'BIT_DECLARATION';

// Refund claim reference: REF-{YEAR}-{SEQ:3}
'REF-2026-001'   // first refund claim of 2026
'REF-2026-042'   // 42nd refund claim

// Invoice number formats
'INV-2026-0042'  // standard invoice
'INV-R-2026-001' // recurring invoice
'CN-2026-0001'   // credit note`} />

        <SubHeading>Postman Collection</SubHeading>
        <Paragraph>
          Export from Swagger UI: click <strong>Export → OpenAPI 3.0 JSON</strong> → import into Postman.
          Base URL for local dev: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{API_URL}</code>
        </Paragraph>

        <Divider />

        {/* -- BEYOND CRUD -- */}
        <SectionHeading id="beyond-crud" icon={<Cpu size={20} />} title="Beyond CRUD" color="text-lime-600" />
        <Paragraph>
          This section shows how to build a full-featured module with admin and client portal views, jobs, search, and
          menu integration — going beyond basic CRUD operations.
        </Paragraph>

        <SubHeading>Full Module Scaffold</SubHeading>
        <CodeBlock language="bash" code={`# 1. Generate backend scaffold
nest g module blog
nest g controller blog
nest g service blog

# 2. Create Prisma model
# Add to prisma/schema.prisma:
# model BlogPost {
#   id        String   @id @default(cuid())
#   title     String
#   content   String   @db.LongText
#   companyId String
#   authorId  String
#   createdAt DateTime @default(now())
#   updatedAt DateTime @updatedAt
#   @@index([companyId])
# }

# 3. Apply schema
npm run db:push
npx prisma generate`} />

        <SubHeading>Service with Jobs Pattern</SubHeading>
        <Paragraph>
          OVDS uses a Job-like pattern for Create, Update, and Delete operations to make code reusable across API,
          console, and other contexts.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/blog/blog.service.ts
@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async create(dto: CreateBlogPostDto, companyId: string, userId: string) {
    const post = await this.prisma.blogPost.create({
      data: { ...dto, companyId, authorId: userId },
    });

    // Fire-and-forget audit log — never blocks the main operation
    this.auditLog.log(userId, 'BLOG_POST_CREATED', { postId: post.id }).catch(() => {});

    return post;
  }

  async findAll(companyId: string, query: PaginationQueryDto) {
    const where = {
      companyId,
      ...(query.search && { title: { contains: query.search } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        take: query.take ?? 20,
        skip: ((query.page ?? 1) - 1) * (query.take ?? 20),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { data, pagination: { page: query.page, take: query.take, total, pages: Math.ceil(total / (query.take ?? 20)) } };
  }
}`} />

        <SubHeading>React Page with Full Pattern</SubHeading>
        <CodeBlock language="typescript" code={`// frontend/src/pages/Blog.tsx
import React, { useState } from 'react';
import { useBusiness } from '../context/businessContext';
import { useRbac, Can } from '../rbac';
import { useApiQuery, invalidateQueryPrefix } from '../hooks/useApiQuery';
import { useAuditLog } from '../rbac';
import { apiPost, apiDelete } from '../services/api';
import { PageHeader, Skeleton, EmptyState } from '@ovds/ui';
import toast from 'react-hot-toast';

export default function Blog() {
  const { selectedCompanyId } = useBusiness();
  const { can } = useRbac();
  const { log } = useAuditLog();
  const [showModal, setShowModal] = useState(false);

  const { data, loading, error, refetch } = useApiQuery(
    \`/blog?companyId=\${selectedCompanyId}\`,
    { enabled: !!selectedCompanyId, deps: [selectedCompanyId] }
  );

  const handleDelete = async (id: string) => {
    await apiDelete(\`/blog/\${id}\`);
    log('BLOG_POST_DELETED', { id });
    invalidateQueryPrefix('/blog');
    refetch();
    toast.success('Post deleted');
  };

  if (loading) return <Skeleton />;
  if (error) return <EmptyState message={error} />;

  return (
    <div className="p-4 sm:p-6 lg:p-5">
      <PageHeader title="Blog" actions={
        <Can permission="blog:write">
          <button onClick={() => setShowModal(true)} className="btn-primary">New Post</button>
        </Can>
      } />
      {/* table / list */}
    </div>
  );
}`} />

        <SubHeading>Optimistic Updates</SubHeading>
        <Paragraph>
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">mutate</code> from{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useApiQuery</code> to update the UI
          instantly before the server responds, then refetch to confirm.
        </Paragraph>
        <CodeBlock language="typescript" code={`const { data, refetch, mutate } = useApiQuery<BlogPost[]>(
  \`/blog?companyId=\${selectedCompanyId}\`,
  { enabled: !!selectedCompanyId, deps: [selectedCompanyId] }
);

// Optimistic delete — remove from UI immediately
const handleDelete = async (id: string) => {
  mutate(prev => prev?.filter(p => p.id !== id) ?? []);  // instant UI update
  try {
    await apiDelete(\`/blog/\${id}\`);
    log('BLOG_POST_DELETED', { id });
  } catch {
    refetch();  // revert on error
    toast.error('Delete failed');
  }
};

// Optimistic status toggle
const handleToggleStatus = async (id: string, current: string) => {
  const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  mutate(prev => prev?.map(p => p.id === id ? { ...p, status: next } : p) ?? []);
  await apiPatch(\`/blog/\${id}\`, { status: next });
};`} />

        <SubHeading>Unsaved Changes Guard</SubHeading>
        <CodeBlock language="typescript" code={`import { useFormDirty } from '../hooks';

export default function BlogEditor() {
  const { isDirty, setDirty, resetDirty } = useFormDirty();
  const [title, setTitle] = useState('');

  const handleChange = (value: string) => {
    setTitle(value);
    setDirty(true);   // mark form as dirty
  };

  const handleSave = async () => {
    await apiPost('/blog', { title });
    resetDirty();     // clear dirty flag after save
    toast.success('Saved');
  };

  // useFormDirty automatically fires window.beforeunload warning
  // and integrates with React Router's useBlocker for in-app navigation
  return (
    <div>
      <input value={title} onChange={e => handleChange(e.target.value)} />
      {isDirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
      <button onClick={handleSave}>Save</button>
    </div>
  );
}`} />

        <SubHeading>Error Boundaries</SubHeading>
        <Paragraph>
          Wrap every page and widget in an <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ErrorBoundary</code>.
          Use the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">inline</code> variant for widgets so one failure doesn't take down the whole page.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Page-level — full-screen error with Retry + Reload buttons
<ErrorBoundary resetKey={selectedCompanyId}>
  <MyModulePage />
</ErrorBoundary>

// Widget-level — compact inline error bar
<ErrorBoundary inline resetKey={selectedCompanyId}>
  <MyModuleWidget />
</ErrorBoundary>

// resetKey: when it changes, the boundary resets automatically
// Useful for re-fetching after a company switch or user action`} />

        <SubHeading>RBAC UI Components</SubHeading>
        <Paragraph>
          OVDS ships several ready-made RBAC components. Import them all from the{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">../rbac</code> barrel — never directly from <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">rbac.ts</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`import { Can, RoleBadge, PermissionTooltip, useStepUp } from '../rbac';

// -- Can — declarative RBAC gate ----------------------------------------------
<Can permission="payroll:approve" fallback={<span className="text-slate-400">Read-only</span>}>
  <ApproveButton />
</Can>

// OR logic + hierarchy
<Can anyOf={['vat:file', 'vat:write']} atLeast="ACCOUNTING">
  <VatPanel />
</Can>

// -- RoleBadge — role chip with metadata colors --------------------------------
  <RoleBadge role="OVDS" size="md" showTooltip />
<RoleBadge role={user.role} size="sm" variant="dot" />   // dot variant
<RoleBadge role={user.role} size="xs" variant="minimal" /> // text only

// -- PermissionTooltip — "why denied" tooltip on hover ------------------------
<PermissionTooltip permission="payroll:approve">
  <button disabled={!can('payroll:approve')}>Approve Payroll</button>
</PermissionTooltip>

// -- StepUpGate — MFA re-auth gate for sensitive actions ----------------------
const { requireStepUp, StepUpGate } = useStepUp();

<StepUpGate>
  <DangerousSettingsPanel />
</StepUpGate>

// Programmatic step-up before a destructive action
const handleDelete = async () => {
  await requireStepUp();   // prompts MFA modal if needed
  await apiDelete('/sensitive-resource');
};`} />

        <SubHeading>Session Expiry Banner</SubHeading>
        <CodeBlock language="typescript" code={`// SessionExpiryBanner is always mounted in Layout.tsx
// It shows automatically when expiresInMinutes < 5
// You can also read the state directly:
import { useAuth } from '../rbac';

const { sessionExpiring, expiresInMinutes, dismissExpiryWarning } = useAuth();

{sessionExpiring && (
  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
    Session expires in {expiresInMinutes} min.
    <button onClick={dismissExpiryWarning} className="ml-2 underline">Dismiss</button>
  </div>
)}`} />

        <SubHeading>Global Overlays (Layout-Managed)</SubHeading>
        <Paragraph>
          These overlays are managed by <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Layout.tsx</code>.
          Trigger them via custom DOM events from anywhere in your module:
        </Paragraph>
        <CodeBlock language="typescript" code={`// Open the global search modal (Ctrl/⌘+K also works)
window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));

// Open the activity feed drawer
window.dispatchEvent(new CustomEvent('ovds:toggle-activity'));

// Open the company setup wizard
window.dispatchEvent(new CustomEvent('ovds:open-setup-wizard'));

// Trigger a page data refresh (R key also works)
window.dispatchEvent(new CustomEvent('kiro:refresh'));

// Listen for the refresh event in your page
useEffect(() => {
  const handler = () => refetch();
  window.addEventListener('kiro:refresh', handler);
  return () => window.removeEventListener('kiro:refresh', handler);
}, [refetch]);`} />

        <SubHeading>Frontend Hooks Quick Reference</SubHeading>
        <Paragraph>
          All hooks live in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/hooks/</code>.
          Import them directly — they are not re-exported from the rbac barrel.
        </Paragraph>
        <CodeBlock language="typescript" code={`// -- Data & state ------------------------------------------------------------
import { useApiQuery, invalidateQuery, invalidateQueryPrefix } from '../hooks/useApiQuery';
import { useDebounce }    from '../hooks';
import { usePagination }  from '@ovds/ui';
import { useLocalStorage } from '../hooks';
import { useFormDirty }   from '../hooks';

// -- UI behaviour -------------------------------------------------------------
import { useInterval }          from '../hooks';
import { useClickOutside }      from '../hooks';
import { useKeyboardShortcut }  from '../hooks';
import { usePageTitle }         from '../hooks/usePageTitle';

// -- Real-time ----------------------------------------------------------------
import { useWebSocket } from '../hooks/useWebSocket';

// -- Auth & RBAC (from barrel) -------------------------------------------------
import { useAuth, useRbac, useAuditLog, usePermissionGuard } from '../rbac';`} />

        <CodeBlock language="typescript" code={`// useInterval — safe setInterval with cleanup; pass null to pause
useInterval(() => refetchNotifications(), isAuthenticated ? 30_000 : null);

// useClickOutside — close dropdown when clicking outside
const ref = useRef<HTMLDivElement>(null);
useClickOutside(ref, () => setOpen(false));

// useKeyboardShortcut — global shortcut; disabled in input/textarea/select
useKeyboardShortcut('k', () => setSearchOpen(true), { ctrl: true });
useKeyboardShortcut('Escape', () => setModalOpen(false));

// useLocalStorage — persists to localStorage, syncs across tabs
const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('ovds_theme', 'light');

// usePageTitle — sets document.title
usePageTitle('My Module');   // → "My Module | OVDS"

// useWebSocket — real-time events
const { connected, emit } = useWebSocket({
  namespace: '/realtime',
  enabled: isAuthenticated,
  events: {
    newCheckin:  (data) => setLogs(prev => [data, ...prev]),
    myModuleEvent: (data) => refetch(),
  },
});
useEffect(() => { if (connected) emit('joinRoom', { room: 'dashboard' }); }, [connected]);`} />

        <SubHeading>API Service Helpers</SubHeading>
        <Paragraph>
          All API calls go through the Axios instance in{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/services/api.ts</code>.
          Use the typed helpers — they auto-extract <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">response.data.data ?? response.data</code>.
        </Paragraph>
        <CodeBlock language="typescript" code={`import api, { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../services/api';

// Typed helpers — auto-extract response.data.data ?? response.data
const items   = await apiGet<MyItem[]>('/my-module?companyId=abc');
const created = await apiPost<MyItem>('/my-module', payload);
const updated = await apiPut<MyItem>(\`/my-module/\${id}\`, payload);
const patched = await apiPatch<MyItem>(\`/my-module/\${id}\`, { status: 'ACTIVE' });
await apiDelete(\`/my-module/\${id}\`);

// Suppress toast for background polls — add x-background header
api.get('/my-module/status', { headers: { 'x-background': '1' } });

// File download (blob response)
const response = await api.get(\`/my-module/\${id}/export?format=csv\`, {
  responseType: 'blob',
});
const url = URL.createObjectURL(response.data);
const a = document.createElement('a');
a.href = url; a.download = 'export.csv'; a.click();`} />

        <SubHeading>Audit Log Actions</SubHeading>
        <Paragraph>
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useAuditLog()</code> to fire client-side audit events.
          Posts to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">POST /audit-logs/client</code> with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">x-background: 1</code> — never throws on failure.
        </Paragraph>
        <CodeBlock language="typescript" code={`const { log, logDenied, logExport } = useAuditLog();

// Standard write action
log('INVOICE_CREATED', { invoiceId: id, amount: 5000 }, 'Invoice', id);
log('INVOICE_DELETED', { invoiceId: id });

// Access denied (RBAC gate blocked the user)
logDenied('payroll:approve', '/hr/payroll-administration');

// Data export
logExport('Invoice', 'csv', 150);   // resource, format, count
logExport('PayrollRecord', 'pdf', 1);

// Payload is auto-enriched with: _role, _companyId, _route from useAuth()`} />

        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Category</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Example actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Auth',     'LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_RESET, ROLE_CHANGED, MFA_ENROLLED, ACCOUNT_LOCKED'],
                ['Security', 'ACCESS_DENIED, PERMISSION_ESCALATION_ATTEMPT, SSO_LINKED, SSO_UNLINKED'],
                ['HR',       'EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_DELETED, LEAVE_APPROVED, LEAVE_REJECTED, ATTENDANCE_VERIFIED, ENROLLMENT_COMPLETED'],
                ['Payroll',  'PAYROLL_GENERATED, PAYROLL_APPROVED, PAYROLL_FINALIZED, PAYROLL_EXPORTED'],
                ['ovds',  'INVOICE_CREATED, INVOICE_SENT, INVOICE_DELETED, PAYMENT_RECORDED, BILL_CREATED, BILL_PAID, JOURNAL_ENTRY_POSTED, BANK_RECONCILED, FUND_TRANSFER_APPROVED, PERIOD_CLOSED'],
                ['Tax',      'VAT_FILED, VAT_CALCULATED, BIT_FILED, DISASTER_FUND_SUBMITTED'],
                ['System',   'SETTINGS_CHANGED, USER_CREATED, USER_DELETED, COMPANY_CREATED, REPORT_EXPORTED, DATA_EXPORTED'],
              ].map(([cat, actions]) => (
                <tr key={cat} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{cat}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 leading-relaxed">{actions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Prisma Transactions</SubHeading>
        <Paragraph>
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">prisma.$transaction()</code> whenever two or more model writes must succeed or fail together.
          OVDS uses this for invoice + journal entry, bank transfer + balance update, and payroll approval.
        </Paragraph>
        <CodeBlock language="typescript" code={`// -- Array form — all operations in one round trip ----------------------------
const [record, journal] = await this.prisma.$transaction([
  this.prisma.myModuleRecord.create({ data: recordData }),
  this.prisma.journalEntry.create({ data: journalData }),
]);

// -- Interactive form — use when you need results from earlier steps -----------
const result = await this.prisma.$transaction(async (tx) => {
  const record = await tx.myModuleRecord.create({ data: recordData });

  // Use record.id in the next operation
  const journal = await tx.journalEntry.create({
    data: { ...journalData, reference: \`MY-\${record.id}\` },
  });

  // Decrement stock atomically
  await tx.item.update({
    where: { id: itemId },
    data:  { stockQuantity: { decrement: quantity } },
  });

  return { record, journal };
});

// -- Unique constraint handling (P2002) ----------------------------------------
try {
  return await this.prisma.myModuleRecord.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    this.prisma.handlePrismaError(e);  // throws ConflictException on P2002
  }
  throw e;
}`} />

        <SubHeading>UI Component Reference</SubHeading>
        <Paragraph>
          OVDS ships a set of shared UI primitives in{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/components/</code>.
          Use them instead of building from scratch to stay consistent with the design system.
        </Paragraph>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Component</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Import path</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Purpose</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['<Skeleton />',          '../components/Skeleton',      'Loading placeholder — use while data === undefined'],
                ['<EmptyState />',        '../components',               'Empty list / error state with optional action button'],
                ['<Pagination />',        '../components/Pagination',    'Page controls — spread paginationProps from usePagination()'],
                ['<StatsCard />',         '../components/StatsCard',     'KPI card with value, trend %, icon, and label'],
                ['<PageHeader />',        '../components/PageHeader',    'Page title + search input + filter chips + action slot'],
                ['<ColumnToggle />',      '../components/ColumnToggle',  'Column visibility toggle for data tables'],
                ['<ErrorBoundary />',     '../components/ErrorBoundary', 'Page-level (full-screen) or inline (compact) error boundary'],
                ['<Can />',              '../rbac',                     'Declarative RBAC gate — wraps any UI element'],
                ['<RoleBadge />',         '../rbac',                     'Role chip with metadata colors (badge/dot/minimal)'],
                ['<PermissionTooltip />', '../rbac',                     '"Why denied" tooltip on hover over any element'],
              ].map(([comp, path, purpose]) => (
                <tr key={comp} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{comp}</td>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 whitespace-nowrap">{path}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CodeBlock language="typescript" code={`// StatsCard — KPI card
<StatsCard
  title="Total Revenue"
  value="ETB 1,250,000"
  trend={+12.4}          // positive = green arrow up, negative = red arrow down
  icon={<TrendingUp size={20} />}
  color="emerald"
/>

// ColumnToggle — show/hide table columns
const [visibleCols, setVisibleCols] = useState(['name', 'amount', 'status', 'date']);
<ColumnToggle
  columns={[
    { key: 'name',   label: 'Name' },
    { key: 'amount', label: 'Amount' },
    { key: 'status', label: 'Status' },
    { key: 'date',   label: 'Date' },
  ]}
  visible={visibleCols}
  onChange={setVisibleCols}
/>
// In table header: {visibleCols.includes('amount') && <th>Amount</th>}

// Pagination — spread paginationProps
const { page, take, setPage, paginationProps } = usePagination({ defaultTake: 20 });
<Pagination {...paginationProps} total={data?.pagination.total ?? 0} />`} />

        <Divider />

        {/* -- PAYMENT METHODS -- */}
        <SectionHeading id="payment" icon={<Lock size={20} />} title="Making a Payment Method" color="text-purple-600" />
        <Paragraph>
          OVDS supports multiple payment methods for invoice collection. Ethiopian SMEs use telebirr (Ethio Telecom),
          CBE, Awash, Dashen, and Abyssinia bank transfers. You can add a custom payment method as a module.
        </Paragraph>

        <SubHeading>Supported Payment Sources</SubHeading>
        <div className="flex flex-wrap gap-2 my-3">
          {['CASH', 'BANK_TRANSFER', 'TELECOM', 'CHEQUE', 'MOBILE_BANKING', 'CREDIT_CARD'].map(src => (
            <Badge key={src} label={src} color="bg-purple-50 text-purple-700 border border-purple-200" />
          ))}
        </div>

        <SubHeading>Recording a Payment</SubHeading>
        <CodeBlock language="typescript" code={`// POST /api/ovds/invoices/:id/payments
{
  "amount": 5000,
  "paymentDate": "2026-04-18",
  "paymentSource": "TELECOM",
  "telecomRef": "TT-2026-0042",          // Ethio Telecom reference
  "bankName": "CBE",                      // for BANK_TRANSFER
  "bankAccountName": "Abebe Girma",
  "orderNo": "ORD-001",
  "tinValidated": true,
  "notes": "Partial payment"
}`} />

        <SubHeading>Telecom Circuit Breaker</SubHeading>
        <Paragraph>
          The telebirr integration has a built-in circuit breaker: opens after 3 failures, stays open for 60 seconds.
          This prevents cascading failures when the telecom API is unavailable.
        </Paragraph>
        <CodeBlock language="typescript" code={`// ovdsService — circuit breaker constants
const TELECOM_CB_THRESHOLD = 3;    // failures before opening
const TELECOM_CB_OPEN_MS   = 60_000; // 60 seconds open duration

// Check circuit state before calling telecom API
if (this.telecomCbOpen && Date.now() < this.telecomCbOpenUntil) {
  throw new ServiceUnavailableException('Telecom service temporarily unavailable');
}`} />

        <SubHeading>NBE-IQR QR Code (ERCA Compliance)</SubHeading>
        <Paragraph>
          Every invoice must include an ERCA-compliant QR code in NBE-IQR format with a unique MoR tracking ID.
          This is auto-generated when an invoice is created.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Invoice QR data structure (NBE-IQR format)
{
  "invoiceNo": "INV-2026-0042",
  "tin": "123456789012345",
  "date": "2026-04-18",
  "totalAmount": 5750.00,
  "vatAmount": 750.00,
  "morTrackingId": "MOR-2026-0042-XXXXX"
}`} />

        <SubHeading>Building a Custom Payment Method Module</SubHeading>
        <Paragraph>
          A payment method module must register itself so it appears in the invoice payment flow.
          It needs at minimum: settings, a route handler, and a controller that processes the payment confirmation.
        </Paragraph>

        <SubHeading>Step 1 — Module Settings</SubHeading>
        <Paragraph>
          Add your payment gateway credentials to the module's settings so the company admin can configure them
          via <strong>Settings → Notifications</strong> or a custom settings page.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Store gateway credentials in SystemSetting
// Key convention: payment_{gateway}_{field}
await settingsService.updateMany({
  'payment_mypay_api_key':    'sk_live_...',
  'payment_mypay_secret':     'whsec_...',
  'payment_mypay_webhook_url': 'https://yourapp.com/webhook',
  'payment_mypay_enabled':    'true',
});

// Read them back in your service
const apiKey = await settingsService.getSetting('payment_mypay_api_key');
const enabled = await settingsService.getSetting('payment_mypay_enabled');
if (enabled !== 'true') throw new BadRequestException('MyPay is not enabled');`} />

        <SubHeading>Step 2 — Register as a Payment Method</SubHeading>
        <Paragraph>
          Emit a registration event so OVDS knows your module handles payments. The invoice payment
          modal reads registered methods and shows them to the user.
        </Paragraph>
        <CodeBlock language="typescript" code={`// In your module's onModuleInit or a startup service
@Injectable()
export class MyPayService implements OnModuleInit {
  constructor(private readonly settingsService: SettingsService) {}

  onModuleInit() {
    // Register this payment method globally
    PaymentMethodRegistry.register({
      key: 'MYPAY',
      label: 'MyPay Gateway',
      icon: 'credit-card',
      fields: ['orderNo', 'telecomRef'],   // extra fields to collect
      handler: this.processPayment.bind(this),
    });
  }

  async processPayment(invoiceId: string, amount: number, meta: Record<string, string>) {
    // Call your payment gateway API here
    const response = await fetch('https://api.mypay.et/charge', {
      method: 'POST',
      headers: { Authorization: \`Bearer \${await this.settingsService.getSetting('payment_mypay_api_key')}\` },
      body: JSON.stringify({ invoiceId, amount, ...meta }),
    });
    if (!response.ok) throw new BadRequestException('MyPay charge failed');
    return response.json();
  }
}`} />

        <SubHeading>Step 3 — Controller (Hosted & Redirect Types)</SubHeading>
        <Paragraph>
          Payment methods come in two types: <strong>hosted</strong> (embeds a form) and <strong>redirect</strong>
          (sends the customer to the gateway and back). Both need at least a <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">confirm</code> and
          a <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">return</code> endpoint.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/my-pay/my-pay.controller.ts
@ApiTags('MyPay')
@Controller('my-pay')
export class MyPayController {
  constructor(
    private readonly myPayService: MyPayService,
    private readonly ovdsService: ovdsService,
    private readonly auditLog: AuditLogService,
  ) {}

  // -- Redirect type: send customer to gateway ------------------------------
  @Get('redirect/:invoiceId')
  @UseGuards(AnyAuthGuard)
  async redirect(@Param('invoiceId') invoiceId: string, @Res() res: Response) {
    const invoice = await this.ovdsService.getInvoice(invoiceId);
    const checkoutUrl = await this.myPayService.createCheckoutSession(invoice);
    return res.redirect(checkoutUrl);
  }

  // -- Webhook: gateway calls this when payment is confirmed ----------------
  @Post('webhook')
  @Public()   // no auth — gateway calls this directly
  async webhook(@Body() body: MyPayWebhookDto, @Headers('x-mypay-signature') sig: string) {
    // 1. Verify webhook signature
    await this.myPayService.verifySignature(body, sig);

    // 2. Record the payment on the invoice
    await this.ovdsService.recordInvoicePayment(body.invoiceId, {
      amount: body.amount,
      paymentSource: 'CREDIT_CARD',
      orderNo: body.transactionId,
      notes: 'MyPay webhook confirmation',
    });

    // 3. Audit log
    this.auditLog.log('system', 'PAYMENT_RECORDED', {
      invoiceId: body.invoiceId,
      amount: body.amount,
      gateway: 'MYPAY',
    }).catch(() => {});

    return { received: true };
  }

  // -- Return URL: customer lands here after gateway redirect ---------------
  @Get('return')
  @Public()
  async returnFromGateway(@Query('invoiceId') invoiceId: string, @Res() res: Response) {
    // Redirect customer to the invoice in the client portal
    return res.redirect(\`/client-portal/\${invoiceId}?payment=success\`);
  }
}`} />

        <SubHeading>Step 4 — Frontend Payment Option</SubHeading>
        <Paragraph>
          Add your payment method to the invoice payment modal so users can select it.
        </Paragraph>
        <CodeBlock language="typescript" code={`// In the invoice payment modal — add to the paymentSource options
const PAYMENT_OPTIONS = [
  { value: 'CASH',          label: 'Cash',           icon: '💵' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer',  icon: '🏦' },
  { value: 'TELECOM',       label: 'telebirr',       icon: '📱' },
  { value: 'CREDIT_CARD',   label: 'MyPay Gateway',  icon: '💳' },  // ← your method
  { value: 'CHEQUE',        label: 'Cheque',         icon: '📄' },
];

// Show extra fields based on selected method
{paymentSource === 'CREDIT_CARD' && (
  <div>
    <label>Transaction ID</label>
    <input name="orderNo" value={orderNo} onChange={...} />
  </div>
)}`} />

        <InfoBox type="warning">
          Always verify webhook signatures before processing payments. Never trust the amount
          from the webhook body alone — fetch the invoice from your database and compare.
        </InfoBox>

        <SubHeading>Telebirr-Specific Integration</SubHeading>
        <Paragraph>
          For telebirr (Ethio Telecom), OVDS has built-in support. Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">paymentSource: 'TELECOM'</code> and
          provide the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">telecomRef</code> field. The circuit breaker protects against telecom API outages.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Fetch a telebirr receipt (cached for performance)
GET /api/ovds/invoices/telecom-receipt/:ref

// Response (from TelecomReceiptCache or live API)
{
  "ref": "TT-2026-0042",
  "amount": 5000,
  "status": "SUCCESS",
  "paidAt": "2026-04-18T10:30:00Z",
  "phoneNumber": "+251911234567",
  "cached": true
}`} />

        <Divider />

        {/* -- VERSION COMPATIBILITY -- */}
        <SectionHeading id="versioning" icon={<GitBranch size={20} />} title="Version Compatibility" color="text-slate-600" />
        <Paragraph>
          Users get the respective module version according to the OVDS version when that module version was released.
          The current OVDS version is saved when you release a new version of your module.
        </Paragraph>

        <div className="overflow-x-auto my-4">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                {['Module Version Released', 'OVDS Version Released', 'OVDS Version of User', 'Module Version User Gets'].map(h => (
                  <th key={h} className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {versionRows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{row.module}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{row.ovdsReleased}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{row.userVersion}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 border border-slate-200 dark:border-slate-700">{row.gets}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <InfoBox type="info">
          Users must update their OVDS installation first to get the latest version of your module. This gives you the
          freedom to not maintain backward compatibility across major versions.
        </InfoBox>

        <SubHeading>Semantic Versioning</SubHeading>
        <Paragraph>
          OVDS follows semantic versioning (SemVer): <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">MAJOR.MINOR.PATCH</code>.
          Breaking changes increment MAJOR, new features increment MINOR, bug fixes increment PATCH.
        </Paragraph>

        <SubHeading>Environment Variables</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Variable</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Required</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['PRISMA_DATABASE_URL', 'Yes', 'MySQL/MariaDB connection string'],
                ['JWT_SECRET', 'Yes', 'JWT signing secret (min 32 chars)'],
                ['AUTH0_DOMAIN', 'Auth0 only', 'Auth0 tenant domain'],
                ['AUTH0_ENFORCED', 'No', 'true = require Auth0; false = allow local JWT'],
                ['MAIL_USER', 'Email only', 'SMTP username (skips silently if not set)'],
                ['OPENAI_API_KEY', 'OCR only', 'GPT-4o for bank statement OCR'],
                ['GEMINI_API_KEY', 'OCR only', 'Gemini 1.5 Flash OCR (fallback)'],
                ['SIEM_WEBHOOK_URL', 'SIEM only', 'Webhook for audit event forwarding'],
                ['NODE_ENV', 'No', 'production disables ms field in responses'],
              ].map(([key, req, desc]) => (
                <tr key={key} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{key}</td>
                  <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                    <Badge label={req} color={req === 'Yes' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'} />
                  </td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Docker Deployment</SubHeading>
        <CodeBlock language="bash" code={`# Start MySQL + NestJS API
docker-compose up -d

# First-time setup inside container
docker-compose exec api npm run db:push
docker-compose exec api npm run seed

# View live logs
docker-compose logs -f api

# Shell into the API container
docker-compose exec api sh

# Stop everything
docker-compose down`} />

        <SubHeading>Production Checklist</SubHeading>
        <div className="space-y-1.5 my-3">
          {[
            { text: 'Set JWT_SECRET to a strong random value (min 32 chars)',          done: false },
            { text: 'Set NODE_ENV=production (disables ms field in API responses)',     done: false },
            { text: 'Configure SMTP (MAIL_USER, MAIL_PASS, MAIL_HOST) for email',      done: false },
            { text: 'Set PRISMA_DATABASE_URL to production database',                  done: false },
            { text: 'Run npm run build --prefix frontend → copy output to ./public',   done: false },
            { text: 'Set up HTTPS via nginx or Caddy reverse proxy in front of :3001', done: false },
            { text: 'Set AUTH0_ENFORCED=true if using Auth0 SSO',                      done: false },
            { text: 'Set SIEM_WEBHOOK_URL if integrating with a SIEM system',          done: false },
            { text: 'Configure database backups (mysqldump cron)',                      done: false },
            { text: 'Set up log rotation for backend-out.log',                         done: false },
            { text: 'Firewall: expose only ports 80/443 externally; 3001/3306 internal only', done: false },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <ArrowRight size={13} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        <SubHeading>Nginx Reverse Proxy</SubHeading>
        <CodeBlock language="nginx" code={`# /etc/nginx/sites-available/ovds
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Proxy to NestJS (includes WebSocket upgrade)
    location / {
        proxy_pass         http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
    }
}

# Get SSL certificate
# sudo certbot --nginx -d yourdomain.com`} />

        <SubHeading>PM2 Process Manager</SubHeading>
        <CodeBlock language="bash" code={`# Install PM2
npm install -g pm2

# Start OVDS API in cluster mode (one process per CPU core)
pm2 start dist/main.js --name ovds-api --instances max --exec-mode cluster

# Auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 status
pm2 logs ovds-api
pm2 monit

# Restart after deployment
npm run build && pm2 restart ovds-api`} />

        <CodeBlock language="javascript" code={`// ecosystem.config.js
module.exports = {
  apps: [{
    name:              'ovds-api',
    script:            'dist/main.js',
    instances:         'max',
    exec_mode:         'cluster',
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT:     3001,
    },
    error_file: 'logs/err.log',
    out_file:   'logs/out.log',
  }]
};`} />

        <SubHeading>Database Backup</SubHeading>
        <CodeBlock language="bash" code={`# Manual backup
mysqldump -u root -p ovds > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
mysql -u root -p ovds < backup_20260418_120000.sql

# Automated daily backup via cron (crontab -e)
0 2 * * * mysqldump -u root -p'yourpassword' ovds | gzip > /backups/ovds_$(date +\%Y\%m\%d).sql.gz

# Keep last 30 days only
0 3 * * * find /backups -name "ovds_*.sql.gz" -mtime +30 -delete

# Docker backup
docker-compose exec db mysqldump -u root -p ovds > backup.sql`} />

        <SubHeading>Prisma Migrations (Production)</SubHeading>
        <CodeBlock language="bash" code={`# Development — push schema directly (no migration history)
npm run db:push

# Production — use migrations for safe schema changes
npx prisma migrate dev --name add-my-feature    # creates migration file
npx prisma migrate deploy                        # apply in CI/CD pipeline
npx prisma migrate status                        # check pending migrations

# ⚠ Never run in production — drops all data
# npm run db:reset`} />

        <Divider />

        {/* -- BECOME A DEVELOPER -- */}
        <SectionHeading id="become-dev" icon={<Star size={20} />} title="Become a Module Developer" color="text-yellow-600" />
        <Paragraph>
          Join the OVDS developer community and build modules for the App Store. Fill out the application below to
          become an official OVDS Module Developer.
        </Paragraph>

        <div className="ovds-grid-layout cols-3 my-4">
          {[
            { icon: <Code size={20} />, title: 'Build Modules', desc: 'Create React + NestJS modules that extend OVDS for Ethiopian businesses.', color: 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <Globe size={20} />, title: 'Publish to App Store', desc: 'List your module in the OVDS App Store and reach thousands of Ethiopian SMEs.', color: 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20' },
            { icon: <Star size={20} />, title: 'Earn Revenue', desc: 'Monetize your modules through the OVDS marketplace and developer fund.', color: 'border-amber-200 bg-amber-50 dark:bg-amber-900/20' },
          ].map(item => (
            <div key={item.title} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="text-slate-600 dark:text-slate-300 mb-2">{item.icon}</div>
              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-1">{item.title}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {formSubmitted ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 p-6 text-center">
            <CheckCircle size={32} className="text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-emerald-800 dark:text-emerald-600 dark:text-emerald-300 text-base mb-1">Application Submitted!</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Thank you for your interest. We will review your application and get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleFormSubmit} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-4">Developer Application</h3>

            <div className="ovds-grid-layout cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="firstName">First Name *</label>
                <input id="firstName" name="firstName" required value={formData.firstName} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Abebe" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="lastName">Last Name *</label>
                <input id="lastName" name="lastName" required value={formData.lastName} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Girma" />
              </div>
            </div>

            <div className="ovds-grid-layout cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="email">Email *</label>
                <input id="email" name="email" type="email" required value={formData.email} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="abebe@example.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="github">GitHub Profile *</label>
                <input id="github" name="github" required value={formData.github} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="https://github.com/username" />
              </div>
            </div>

            <div className="ovds-grid-layout cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="country">Country *</label>
                <input id="country" name="country" required value={formData.country} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="Ethiopia" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="teamType">Are you a lone wolf or part of a team? *</label>
                <select id="teamType" name="teamType" value={formData.teamType} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400">
                  <option value="lone-wolf">Lone wolf — solo developer</option>
                  <option value="small-team">Small team (2–5 people)</option>
                  <option value="agency">Agency / consultancy</option>
                  <option value="company">Company / startup</option>
                </select>
              </div>
            </div>

            <div className="ovds-grid-layout cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="nestjsExp">NestJS Experience (years) *</label>
                <input id="nestjsExp" name="nestjsExp" type="number" min="0" max="30" required value={formData.nestjsExp} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="reactExp">React Experience (years) *</label>
                <input id="reactExp" name="reactExp" type="number" min="0" max="30" required value={formData.reactExp} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="2" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="prismaExp">Prisma / DB Experience (years)</label>
                <input id="prismaExp" name="prismaExp" type="number" min="0" max="30" value={formData.prismaExp} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="1" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="background">Background *</label>
              <textarea id="background" name="background" required rows={3} value={formData.background} onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                placeholder="Tell us about your background, experience with accounting/ERP software, and any relevant projects..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="appIdea">App Idea *</label>
              <textarea id="appIdea" name="appIdea" required rows={2} value={formData.appIdea} onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"
                placeholder="Describe your app idea for OVDS..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="hasModuleExp">Have you built NestJS modules or React packages before? *</label>
              <select id="hasModuleExp" name="hasModuleExp" value={formData.hasModuleExp} onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="no">No — this will be my first</option>
                <option value="nestjs">Yes — NestJS modules</option>
                <option value="react">Yes — React packages / libraries</option>
                <option value="both">Yes — both NestJS and React</option>
              </select>
            </div>

            <div className="ovds-grid-layout cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="publicProjects">Public Projects (URLs)</label>
                <input id="publicProjects" name="publicProjects" value={formData.publicProjects} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="https://github.com/..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="appCount">Number of Apps Planning to Develop</label>
                <input id="appCount" name="appCount" type="number" min="1" value={formData.appCount} onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                  placeholder="1" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1" htmlFor="heardFrom">How did you hear about the Developers Fund?</label>
              <input id="heardFrom" name="heardFrom" value={formData.heardFrom} onChange={handleFormChange}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Social media, colleague, etc." />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
              >
                <Send size={15} />
                Submit Application
              </button>
            </div>
          </form>
        )}

        <Divider />

        {/* -- FAQ & TROUBLESHOOTING -- */}
        <SectionHeading id="faq" icon={<AlertCircle size={20} />} title="FAQ & Troubleshooting" color="text-rose-500" />
        <Paragraph>
          Common questions and issues developers run into when building on OVDS. If your issue is
          not listed here, check the <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">Swagger docs</a> or
          the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">AGENTS.md</code> reference in the repository root.
        </Paragraph>

        <SubHeading>Setup & Environment</SubHeading>

        <Collapsible title="Backend won't start — ECONNREFUSED 3306">
          <p className="mb-2">MySQL is not running. Start it first:</p>
          <CodeBlock language="bash" code={`# Windows (XAMPP)
C:\\xampp\\mysql_start.bat

# Linux
sudo service mysql start

# Docker
docker-compose up -d db

# Then verify the database exists
mysql -u root -e "SHOW DATABASES;" | grep ovds
# If missing:
mysql -u root -e "CREATE DATABASE ovds CHARACTER SET utf8mb4;"`} />
        </Collapsible>

        <Collapsible title="Port 3000 already in use">
          <CodeBlock language="bash" code={`# Kill the process on port 3000
npx kill-port 3000

# Or find and kill manually (Windows)
netstat -ano | findstr :3000
taskkill /PID <pid> /F`} />
        </Collapsible>

        <Collapsible title="Prisma schema out of sync — Invalid model ID">
          <p className="mb-2">The Prisma client is out of sync with the schema. Regenerate it:</p>
          <CodeBlock language="bash" code={`# Apply schema changes to DB
npm run db:push

# Regenerate the Prisma client
npx prisma generate

# If tables are missing entirely
npm run db:reset   # ⚠️ destroys all data — dev only`} />
        </Collapsible>

        <Collapsible title="Seed fails with foreign key error">
          <p className="mb-2">Tables must exist before seeding. Always push the schema first:</p>
          <CodeBlock language="bash" code={`npm run db:push   # create all tables
npm run seed      # then seed data`} />
        </Collapsible>

        <Collapsible title="Frontend shows blank page or stale content">
          <div className="space-y-2">
            <p>Check in this order:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Backend running on port 3000? <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">curl ${API_URL}/health</code></li>
              <li>Stale PWA service worker cache — open DevTools → Application → Service Workers → Unregister, then clear storage</li>
              <li>JS errors in browser console (F12)</li>
              <li>Kill stale Vite processes on ports 5173–5176</li>
            </ol>
          </div>
        </Collapsible>

        <SubHeading>Authentication & RBAC</SubHeading>

        <Collapsible title="Getting 401 on all API requests">
          <div className="space-y-2 text-sm">
            <p>Check these in order:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Token missing — check <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">localStorage.ovds_token</code> in DevTools</li>
              <li>Token expired — decode at <a href="https://jwt.io" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">jwt.io</a> and check the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">exp</code> field</li>
              <li>Wrong <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">JWT_SECRET</code> — check <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">.env</code> matches what was used to sign tokens</li>
            </ol>
            <CodeBlock language="bash" code={`# Quick test — get a fresh token
curl -X POST ${API_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username":"superadmin@ovds.com","password":"SuperAdmin@2026!"}'`} />
          </div>
        </Collapsible>

        <Collapsible title="Route shows /forbidden — 403 error">
          <div className="space-y-2 text-sm">
            <p>The user's role doesn't have the required permission for this route. Check:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ROUTE_POLICY</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/rbac/rbac.ts</code> — is the route listed?</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ROLE_PERMISSIONS</code> — does the user's role have the required permission?</li>
              <li>Test with <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">superadmin@ovds.com</code> — SPURADMIN bypasses all RBAC policies</li>
            </ol>
          </div>
        </Collapsible>

        <Collapsible title="Auth0 login loop — keeps redirecting">
          <p className="mb-2">Disable Auth0 for local development:</p>
          <CodeBlock language="bash" code={`# .env
AUTH0_ENFORCED=false

# frontend/.env
VITE_AUTH0_ENABLED=false`} />
        </Collapsible>

        <Collapsible title="MFA step-up not triggering for my new route">
          <p className="mb-2">Add the route to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">SENSITIVE_ROUTES</code> in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/rbac/rbac.ts</code>:</p>
          <CodeBlock language="typescript" code={`export const SENSITIVE_ROUTES = new Set([
  // ... existing routes
  '/my-sensitive-route',
]);`} />
          <p className="mt-2 text-xs text-slate-500">Note: MFA step-up only applies to Auth0 users (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">isAuth0User === true</code>). Local JWT users are not affected.</p>
        </Collapsible>

        <SubHeading>Module Development</SubHeading>

        <Collapsible title="My module's data leaks across companies (tenant isolation bug)">
          <p className="mb-2">Every Prisma query must include <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">companyId</code> in the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">where</code> clause:</p>
          <CodeBlock language="typescript" code={`// ❌ Wrong — returns data from ALL companies
const items = await this.prisma.myModel.findMany();

// ✅ Correct — scoped to the active tenant
const items = await this.prisma.myModel.findMany({
  where: { companyId },   // always include this
});`} />
          <p className="mt-2 text-xs text-slate-500">Also ensure your Prisma model has a <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">companyId String?</code> field and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">@@index([companyId])</code>.</p>
        </Collapsible>

        <Collapsible title="My new page doesn't appear in the sidebar">
          <div className="space-y-1.5">
            {[
              'Add lazy import in App.tsx: const MyPage = lazy(() => import(\'./pages/MyPage\'))',
              'Add to ROUTES array in App.tsx: [\'/my-page\', MyPage]',
              'Add nav entry in sidebar/index.tsx with the correct permission key',
              'Add to ROUTE_POLICY in rbac.ts: \'/my-page\': \'my_module:read\'',
              'Add to routeTitleMap in Layout.tsx',
              'Add to ROUTE_BREADCRUMBS in Header.tsx',
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
                <ArrowRight size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{item}</code>
              </div>
            ))}
          </div>
        </Collapsible>

        <Collapsible title="Circular dependency error in NestJS module">
          <p className="mb-2">Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">forwardRef()</code> when two modules depend on each other:</p>
          <CodeBlock language="typescript" code={`// module-a.module.ts
@Module({
  imports: [forwardRef(() => ModuleBModule)],
  exports: [ModuleAService],
})
export class ModuleAModule {}

// module-b.module.ts
@Module({
  imports: [forwardRef(() => ModuleAModule)],
})
export class ModuleBModule {}`} />
          <p className="mt-2 text-xs text-slate-500">Better approach: extract the shared logic into a third module that both can import without circular dependency.</p>
        </Collapsible>

        <Collapsible title="useApiQuery not re-fetching when params change">
          <p className="mb-2">Add all dynamic values to the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">deps</code> array:</p>
          <CodeBlock language="typescript" code={`// ❌ Wrong — won't re-fetch when companyId or page changes
const { data } = useApiQuery(\`/my-module?companyId=\${companyId}&page=\${page}\`);

// ✅ Correct — re-fetches whenever any dep changes
const { data } = useApiQuery(
  \`/my-module?companyId=\${companyId}&page=\${page}\`,
  { enabled: !!companyId, deps: [companyId, page] }
);`} />
        </Collapsible>

        <Collapsible title="toast.error fires on background polling requests">
          <p className="mb-2">Add the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">x-background: 1</code> header to suppress global error toasts:</p>
          <CodeBlock language="typescript" code={`// Suppress toast for background polls
api.get('/my-module/status', {
  headers: { 'x-background': '1' }
});`} />
        </Collapsible>

        <Collapsible title="P2002 Prisma error — unique constraint violation">
          <p className="mb-2">Pass the error to <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">prisma.handlePrismaError()</code> to get a proper <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ConflictException</code>:</p>
          <CodeBlock language="typescript" code={`try {
  return await this.prisma.myModel.create({ data });
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    this.prisma.handlePrismaError(e); // throws ConflictException on P2002
  }
  throw e;
}`} />
        </Collapsible>

        <SubHeading>ovds & Tax</SubHeading>

        <Collapsible title="Journal entry not auto-posting on invoice creation">
          <p className="mb-2">The invoice service must call <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">AccountingService.autoPostInvoiceCreation()</code> after saving. It runs best-effort and never blocks invoice creation:</p>
          <CodeBlock language="typescript" code={`// In your invoice creation flow
const invoice = await this.prisma.invoice.create({ data: invoiceData });

// Auto-post journal entry (best-effort — never blocks)
this.accountingService.autoPostInvoiceCreation(invoice).catch(() => {});

return invoice;`} />
        </Collapsible>

        <Collapsible title="VAT not computing — stuck in DRAFT">
          <div className="space-y-1 text-sm">
            <p>Check these in order:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Invoices must have <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">vatAmount {'>'} 0</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">status: PAID</code></li>
              <li>Bills must have <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">vatAmount {'>'} 0</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">status: PAID</code></li>
              <li>VatService raw SQL tables must exist — they are created on module init. Restart the backend if they are missing.</li>
              <li>Only <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ovds</code> role can submit (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">vat:file</code> permission). <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ACCOUNTING</code> can only compute.</li>
            </ol>
          </div>
        </Collapsible>

        <Collapsible title="PIT calculation seems wrong">
          <p className="mb-2">OVDS uses the updated brackets from <strong>Proclamation No. 1395/2025</strong> (effective July 7, 2025). The tax-free threshold is ETB 2,000/month — not the old ETB 600:</p>
          <CodeBlock language="typescript" code={`// calcEthiopianPIT(gross) — Proclamation No. 1395/2025
// 0 – 2,000      → 0%
// 2,001 – 4,000  → 15%  (on amount above 2,000)
// 4,001 – 7,000  → 20%
// 7,001 – 10,000 → 25%
// 10,001 – 14,000 → 30%
// > 14,000        → 35%

// Pension is capped at ETB 15,000 insurable earnings
const insurableEarnings = Math.min(grossTotal, 15000);
const employeePension   = insurableEarnings * 0.07;
const employerPension   = insurableEarnings * 0.11;`} />
        </Collapsible>

        <Collapsible title="DRRF contributions not being generated">
          <p className="mb-2"><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">autoGenerateFromActivity()</code> scans real data. Make sure the source data exists:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2 ovds-table">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800">
                  <th className="text-left px-3 py-2 border border-slate-200 dark:border-slate-700">Source</th>
                  <th className="text-left px-3 py-2 border border-slate-200 dark:border-slate-700">Requires</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['SALARY_CONTRIBUTION', 'PayrollRecord with status APPROVED or PAID for the period'],
                  ['ANNUAL_SALES_REVENUE', 'Invoice with status PAID for the period'],
                  ['SERVICE_FEE', 'Invoice with status PAID and paymentSource TELECOM or BANK'],
                  ['LOAN_VALUE', 'BusinessLoan with status DISBURSED for the period'],
                ].map(([src, req]) => (
                  <tr key={src} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{src}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{req}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible>

        <SubHeading>WebSocket & Real-Time</SubHeading>

        <Collapsible title="WebSocket not connecting">
          <div className="space-y-2 text-sm">
            <ol className="list-decimal list-inside space-y-1">
              <li>Confirm <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">WebsocketModule</code> is imported in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">src/app.module.ts</code></li>
              <li>JWT token must be passed via <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">handshake.auth.token</code></li>
              <li>Confirm <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">PORT</code> env var is set (default 3001 in production, 3000 in dev) and accessible from the browser</li>
              <li>Vite proxy must have <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ws: true</code> for the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">/socket.io</code> entry</li>
            </ol>
            <CodeBlock language="typescript" code={`// Debug connection state
const { connected } = useWebSocket({ ... });


// Check connected clients via health endpoint
// GET /api/health/detailed → services.websocket.connectedClients`} />
          </div>
        </Collapsible>

        <Collapsible title="Not receiving WebSocket events after connecting">
          <p className="mb-2">You must emit <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">joinRoom</code> after connecting. The client is not automatically in the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">dashboard</code> room:</p>
          <CodeBlock language="typescript" code={`const { connected, emit } = useWebSocket({
  events: {
    newCheckin: (data) => setLogs(prev => [data, ...prev]),
  },
});

// Join the room after connection is established
useEffect(() => {
  if (connected) {
    emit('joinRoom', { room: 'dashboard' });
  }
}, [connected]);`} />
        </Collapsible>

        <Collapsible title="WebSocket events firing twice">
          <p className="mb-2">Usually caused by React StrictMode double-mounting or the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useWebSocket</code> hook being mounted in multiple components. Check:</p>
          <div className="space-y-1 text-sm">
            <ul className="list-disc list-inside space-y-1">
              <li>Mount <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useWebSocket</code> only once — in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Layout.tsx</code> or a top-level component</li>
              <li>Ensure the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">deps</code> array doesn't cause unnecessary re-mounts</li>
              <li>Pass event handlers as stable references (wrap in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useCallback</code>)</li>
            </ul>
          </div>
        </Collapsible>

        <SubHeading>Email & Notifications</SubHeading>

        <Collapsible title="Emails not being sent">
          <div className="space-y-2 text-sm">
            <p>Check in this order:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">MAIL_USER</code> env var must be set — emails are silently skipped if missing</li>
              <li><code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">notifications_config.email.active</code> must be <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">true</code> in SystemSetting</li>
              <li>Test the channel: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">POST /notifications/test {"{ channel: 'email' }"}</code></li>
            </ol>
            <CodeBlock language="bash" code={`# Minimum .env for email
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass`} />
          </div>
        </Collapsible>

        <Collapsible title="Email template placeholder not being replaced">
          <p className="mb-2">Placeholders use double curly braces: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">{'{{variableName}}'}</code>. Missing variables render as the raw placeholder string — not blank. Check that the variable name matches exactly (case-sensitive).</p>
          <CodeBlock language="typescript" code={`// Template body
"Dear {{employeeName}}, your payslip for {{period}} is ready."

// Variables passed to sendTemplate()
{
  employeeName: 'Abebe Girma',
  period: '2026-04',
}`} />
        </Collapsible>

        <SubHeading>Performance & Production</SubHeading>

        <Collapsible title="Slow queries in production">
          <div className="space-y-2 text-sm">
            <p>Common causes and fixes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Missing <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">@@index([companyId])</code> on your Prisma model — add it and run <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">npm run db:push</code></li>
              <li>N+1 queries — use Prisma <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">include</code> instead of loading relations in a loop</li>
              <li>Loading all records — always use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">take</code>/<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">skip</code> pagination</li>
              <li>Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">groupBy</code> for aggregations instead of loading all rows into memory</li>
            </ul>
            <CodeBlock language="bash" code={`# Enable MySQL slow query log
mysql -u root -e "SET GLOBAL slow_query_log = 'ON'; SET GLOBAL long_query_time = 1;"

# Analyze a slow query
mysql -u root ovds -e "EXPLAIN SELECT * FROM Invoice WHERE companyId = 'abc' AND status = 'PENDING';"`} />
          </div>
        </Collapsible>

        <Collapsible title="Connection pool exhausted in production">
          <p className="mb-2">Increase the connection limit in your database URL:</p>
          <CodeBlock language="bash" code={`# .env — increase pool for production
PRISMA_DATABASE_URL="mysql://root:@127.0.0.1:3306/ovds?connection_limit=50&pool_timeout=60"`} />
          <p className="mt-2 text-xs text-slate-500">Also check for unclosed transactions or long-running queries that hold connections open.</p>
        </Collapsible>

        <Collapsible title="Bundle too large — slow initial page load">
          <CodeBlock language="bash" code={`# Analyze bundle size
npm run build --prefix frontend
npx vite-bundle-visualizer --prefix frontend
# Opens an interactive treemap in the browser`} />
          <p className="mt-2 text-xs text-slate-500">Ensure all pages use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">lazy()</code> imports. Large vendor libraries should be in the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">manualChunks</code> config in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">vite.config.ts</code>.</p>
        </Collapsible>

        <InfoBox type="success">
          <strong>Still stuck?</strong> Run <code>npm run seed</code> to reset demo data, check
          the <code>backend-out.log</code> file for server errors, and use{' '}
          <code>npm run db:studio</code> to inspect the database directly via Prisma Studio.
        </InfoBox>

        {/* -- TESTING -- */}
        <SectionHeading id="testing" icon={<CheckCircle size={20} />} title="Testing" color="text-emerald-500" />
        <Paragraph>
          OVDS uses Jest for backend unit tests and Vitest for frontend tests. Write tests alongside
          your module files — <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">feature.service.spec.ts</code> and <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">feature.controller.spec.ts</code>.
        </Paragraph>

        <SubHeading>Running Tests</SubHeading>
        <CodeBlock language="bash" code={`# Backend — Jest unit tests
npm run test

# Backend — watch mode (dev)
npm run test:watch

# Backend — coverage report
npm run test:cov

# Backend — e2e tests
npm run test:e2e

# Frontend — Vitest (single run, no watch)
npm run test --prefix frontend -- --run`} />

        <SubHeading>Backend Service Test Pattern</SubHeading>
        <Paragraph>
          Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">jest-mock-extended</code>'s <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">mockDeep</code> to mock PrismaService.
          Always verify that <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">companyId</code> is included in the Prisma call — this is the most common tenant isolation bug.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/my-module/my-module.service.spec.ts
import { Test } from '@nestjs/testing';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { MyModuleService } from './my-module.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../prisma/audit-log.service';

describe('MyModuleService', () => {
  let service: MyModuleService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MyModuleService,
        { provide: PrismaService,   useValue: mockDeep<PrismaService>() },
        { provide: AuditLogService, useValue: { log: jest.fn().mockResolvedValue(undefined) } },
      ],
    }).compile();

    service = module.get(MyModuleService);
    prisma  = module.get(PrismaService);
  });

  it('should create an item scoped to the company', async () => {
    const mockItem = { id: 'item-1', name: 'Test', companyId: 'co-1', createdAt: new Date() };
    prisma.myModel.create.mockResolvedValue(mockItem as any);

    const result = await service.create({ name: 'Test' }, 'co-1', 'user-1');

    expect(result.name).toBe('Test');
    // ✅ Verify tenant isolation — companyId must be in the data
    expect(prisma.myModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ companyId: 'co-1' }),
      })
    );
  });

  it('should list items filtered by companyId', async () => {
    prisma.myModel.findMany.mockResolvedValue([]);
    prisma.myModel.count.mockResolvedValue(0);

    await service.findAll('co-1', { page: 1, take: 20 });

    // ✅ Verify companyId is always in the where clause
    expect(prisma.myModel.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'co-1' }),
      })
    );
  });

  it('should throw NotFoundException for unknown id', async () => {
    prisma.myModel.findUnique.mockResolvedValue(null);
    await expect(service.findOne('bad-id', 'co-1')).rejects.toThrow('not found');
  });
});`} />

        <SubHeading>Testing Ethiopian Tax Calculations</SubHeading>
        <Paragraph>
          PIT and pension calculations are pure functions — test them with known values from the
          Proclamation No. 1395/2025 brackets.
        </Paragraph>
        <CodeBlock language="typescript" code={`// src/payroll/payroll.service.spec.ts
describe('calcEthiopianPIT', () => {
  const cases: [number, number][] = [
    [1500,  0],       // below tax-free threshold
    [2000,  0],       // exactly at threshold
    [3000,  150],     // (3000-2000) × 15% = 150
    [5500,  600],     // 300 + (5500-4000) × 20% = 300 + 300 = 600
    [10000, 1650],    // 900 + (10000-7000) × 25% = 900+750 = 1650
    [14000, 2850],    // 1650 + (14000-10000) × 30% = 1650+1200 = 2850
    [20000, 4950],    // 2850 + (20000-14000) × 35% = 2850+2100 = 4950
  ];

  test.each(cases)('taxable %d → tax %d', (taxable, expected) => {
    expect(calcEthiopianPIT(taxable)).toBe(expected);
  });
});

describe('pension calculation', () => {
  it('caps insurable earnings at ETB 15,000', () => {
    const gross = 25000;
    const insurable = Math.min(gross, 15000); // 15000
    expect(insurable * 0.07).toBe(1050);      // employee pension
    expect(insurable * 0.11).toBe(1650);      // employer pension
  });
});`} />

        <SubHeading>Frontend Component Test Pattern</SubHeading>
        <CodeBlock language="typescript" code={`// frontend/src/pages/MyModule.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MyModule from './MyModule';

// Mock the API hook
vi.mock('../hooks/useApiQuery', () => ({
  useApiQuery: vi.fn(() => ({
    data: [{ id: '1', name: 'Test Item', companyId: 'co-1' }],
    loading: false,
    error: null,
    refetch: vi.fn(),
  })),
  invalidateQueryPrefix: vi.fn(),
}));

// Mock auth context
vi.mock('../rbac', () => ({
  useRbac: () => ({ can: () => true, is: () => false }),
  Can: ({ children }: any) => children,
}));

// Mock business context
vi.mock('../context/businessContext', () => ({
  useBusiness: () => ({ selectedCompanyId: 'co-1' }),
}));

describe('MyModule page', () => {
  it('renders items from the API', async () => {
    render(<MyModule />);
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data', async () => {
    // Override mock for this test
    vi.mocked(useApiQuery).mockReturnValueOnce({
      data: [], loading: false, error: null, refetch: vi.fn(),
    } as any);
    render(<MyModule />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });
});`} />

        <SubHeading>What to Test</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Layer</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">What to test</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Services', 'Business logic, PIT/pension calculations, status transitions, tenant isolation (companyId in where)'],
                ['Controllers', 'Guard application, DTO validation, response shape, SPURADMIN bypass'],
                ['Guards', 'Role checks, company isolation, public endpoint bypass'],
                ['Utilities', 'calcEthiopianPIT(), haversineDistance(), date helpers, DRRF levy rates'],
                ['React pages', 'Renders data, shows empty state, RBAC gates hide/show correctly'],
                ['React hooks', 'useApiQuery re-fetches on dep change, useDebounce delays correctly'],
              ].map(([layer, what]) => (
                <tr key={layer} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{layer}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <InfoBox type="info">
          Frontend tests use <strong>Vitest</strong> (via Vite). Always use <code>--run</code> flag
          for single execution instead of watch mode: <code>npm run test --prefix frontend -- --run</code>
        </InfoBox>

        <Divider />

        {/* -- INTERNATIONALIZATION -- */}
        <SectionHeading id="i18n" icon={<Globe size={20} />} title="Internationalization (i18n)" color="text-teal-500" />
        <Paragraph>
          OVDS supports three languages: <strong>English</strong> (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">en</code>),{' '}
          <strong>Amharic</strong> (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">am</code>), and{' '}
          <strong>Tigrinya</strong> (<code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ti</code>) via <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">react-i18next</code>.
          All translations live in a single file: <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">frontend/src/assets/i18n.json</code>.
        </Paragraph>

        <SubHeading>Using Translations in a Component</SubHeading>
        <CodeBlock language="typescript" code={`import { useTranslation } from 'react-i18next';

export default function MyModule() {
  const { t, i18n } = useTranslation();

  return (
    <div>
      <h1>{t('my_module.title')}</h1>
      <button>{t('common.save')}</button>
      <p>{t('my_module.welcome', { name: 'Abebe' })}</p>
    </div>
  );
}

// Switch language at runtime (no page reload needed)
i18n.changeLanguage('am');  // Amharic
i18n.changeLanguage('ti');  // Tigrinya
i18n.changeLanguage('en');  // English`} />

        <SubHeading>Adding Translation Keys</SubHeading>
        <Paragraph>
          Every key must be added to <strong>all three sections</strong> of <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">i18n.json</code>.
          The default (top-level) section is Tigrinya. Missing keys fall back to the default section — they never render blank.
        </Paragraph>
        <CodeBlock language="json" code={`// frontend/src/assets/i18n.json
{
  // Default = Tigrinya (ti)
  "my_module": {
    "title": "ናይ ሞጁለይ ኣርእስቲ",
    "welcome": "ሰላም {{name}}",
    "create_btn": "ፍጠር"
  },

  "am": {
    "my_module": {
      "title": "የሞጁሌ ርዕስ",
      "welcome": "ሰላም {{name}}",
      "create_btn": "ፍጠር"
    }
  },

  "en": {
    "my_module": {
      "title": "My Module Title",
      "welcome": "Hello {{name}}",
      "create_btn": "Create"
    }
  }
}`} />

        <SubHeading>Key Naming Conventions</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Pattern</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Example key</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Usage</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['module.title', 'my_module.title', 'Page / section heading'],
                ['module.action_btn', 'invoices.create_btn', 'Action button label'],
                ['module.field_name', 'employees.first_name', 'Form field label'],
                ['module.status_value', 'invoices.status_paid', 'Status badge text'],
                ['common.save', 'common.save', 'Shared across all modules'],
                ['common.cancel', 'common.cancel', 'Shared across all modules'],
                ['errors.required', 'errors.required', 'Validation error messages'],
                ['nav.module_name', 'nav.payroll', 'Sidebar navigation label'],
              ].map(([pattern, example, usage]) => (
                <tr key={pattern} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{pattern}</td>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{example}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <SubHeading>Language Switcher</SubHeading>
        <Paragraph>
          The language switcher is in the Header (top-right). Language preference is persisted in{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">localStorage</code> under{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">i18nextLng</code>.
          All labels update immediately via React re-render — no page reload required.
        </Paragraph>

        <SubHeading>Dark Mode</SubHeading>
        <Paragraph>
          OVDS has full dark mode support via <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">ThemeContext</code>.
          Tailwind uses <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">darkMode: 'class'</code> — the <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">dark</code> class
          is toggled on <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">&lt;html&gt;</code>. Always add dark variants to your components:
        </Paragraph>
        <CodeBlock language="typescript" code={`// ✅ Always pair light and dark variants
<div className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
  <p className="text-slate-600 dark:text-slate-400">Description</p>
  <button className="bg-emerald-500 hover:bg-emerald-600 text-white">
    Action
  </button>
</div>

// ✅ Border colors
<div className="border border-slate-200 dark:border-slate-700">

// ✅ Table rows
<tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">

// ✅ Input fields
<input className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200
  border border-slate-200 dark:border-slate-700
  focus:ring-2 focus:ring-teal-400" />`} />

        <SubHeading>Brand Color Tokens</SubHeading>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
          {[
            { token: 'emerald-500',    hex: '#00E784', usage: 'Careem Green — primary brand color', bg: 'bg-[#00E784]' },
            { token: 'emerald-600', hex: '#00C96E', usage: 'Hover / dark variant',             bg: 'bg-[#00C96E]' },
            { token: 'emerald-200', hex: '#6EFFC0', usage: 'Light tint / dark mode accent',   bg: 'bg-[#6EFFC0]' },
            { token: 'ovds-sidebar',    hex: '#1e293b', usage: 'Sidebar background (navy)',           bg: 'bg-[#1e293b]' },
            { token: 'ovds-success',    hex: '#00C96E', usage: 'Success / settled states',           bg: 'bg-[#00C96E]' },
            { token: 'ovds-warning',    hex: '#d97706', usage: 'Warning states',                     bg: 'bg-[#d97706]' },
            { token: 'ovds-danger',     hex: '#dc2626', usage: 'Error / danger',                     bg: 'bg-[#dc2626]' },
            { token: 'ovds-info',       hex: '#0284c7', usage: 'Info states',                        bg: 'bg-[#0284c7]' },
          ].map(c => (
            <div key={c.token} className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className={`h-8 w-full ${c.bg}`} />
              <div className="p-2">
                <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-200">{c.token}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{c.hex}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 leading-tight mt-0.5">{c.usage}</p>
              </div>
            </div>
          ))}
        </div>

        <SubHeading>PWA & Offline Support</SubHeading>
        <Paragraph>
          OVDS is a Progressive Web App. Users can install it on their home screen and use it offline
          for attendance check-ins. The service worker caches static assets and queues offline check-ins
          to IndexedDB for background sync when connectivity returns.
        </Paragraph>
        <CodeBlock language="typescript" code={`// Detect offline state in your module
useEffect(() => {
  const handleOffline = () => toast.error('You are offline. Some features may be limited.');
  const handleOnline  = () => toast.success('Back online!');
  window.addEventListener('offline', handleOffline);
  window.addEventListener('online',  handleOnline);
  return () => {
    window.removeEventListener('offline', handleOffline);
    window.removeEventListener('online',  handleOnline);
  };
}, []);

// Listen for offline sync completion (from service worker)
navigator.serviceWorker?.addEventListener('message', (event) => {
  if (event.data?.type === 'SYNC_SUCCESS') {
    toast.success(\`\${event.data.count} offline check-ins synced\`);
    refetch();
  }
});`} />

        <InfoBox type="info">
          PWA install prompt only appears over <strong>HTTPS</strong>. In local development
          (<code>http://localhost</code>) the install button will not show — this is expected.
          The service worker is disabled in dev mode to prevent stale cache issues.
        </InfoBox>

        <Divider />

        {/* -- PLATFORM REFERENCE -- */}
        <SectionHeading id="platform" icon={<Layers size={20} />} title="Platform Reference" color="text-emerald-600 dark:text-emerald-400" />
        <Paragraph>
          Quick reference for the most-used platform concepts when building modules for OVDS.
        </Paragraph>

        <SubHeading>Ethiopian Compliance Quick Reference</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Tax / Levy</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Rate</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Deadline</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Legal basis</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['VAT',              '15%',          '30th of following month',    'Proclamation 1341/2024'],
                ['VAT registration', 'ETB 2,000,000/yr threshold', '—',           'Regulation 570/2025'],
                ['Business Income Tax', '30% of net profit', 'Nov 7 (4 months after FY end)', 'Ethiopian tax law'],
                ['PIT (salary)',     '0–35% progressive', 'Monthly via payroll',  'Proclamation 1395/2025'],
                ['Pension (employee)', '7% of basic (cap ETB 15,000)', 'Monthly', 'Proclamation 1395/2025'],
                ['Pension (employer)', '11% of basic (cap ETB 15,000)', 'Monthly','Proclamation 1395/2025'],
                ['DRRF',            '1–5% + flat fees', '15th of last month of quarter', 'Regulation 570/2025'],
                ['Withholding (services)', '3% on ≥ ETB 10,000', 'Per transaction', 'Proclamation 1395/2025'],
                ['Withholding (goods)',    '3% on ≥ ETB 20,000', 'Per transaction', 'Proclamation 1395/2025'],
                ['MAT',             '2.5% of turnover', 'Annual',                 'Proclamation 1395/2025'],
              ].map(([tax, rate, deadline, basis]) => (
                <tr key={tax} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">{tax}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{rate}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{deadline}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CodeBlock language="typescript" code={`// PIT calculation — Proclamation 1395/2025 (effective July 7, 2025)
// Tax-free threshold raised from ETB 600 → ETB 2,000/month
function calcEthiopianPIT(taxable: number): number {
  if (taxable <= 2000)  return 0;
  if (taxable <= 4000)  return (taxable - 2000) * 0.15;
  if (taxable <= 7000)  return 300  + (taxable - 4000)  * 0.20;
  if (taxable <= 10000) return 900  + (taxable - 7000)  * 0.25;
  if (taxable <= 14000) return 1650 + (taxable - 10000) * 0.30;
  return                     2850 + (taxable - 14000) * 0.35;
}

// Pension — capped at ETB 15,000 insurable earnings
const insurableEarnings = Math.min(grossTotal, 15000);
const employeePension   = insurableEarnings * 0.07;
const employerPension   = insurableEarnings * 0.11;

// Taxable Income (Gross - Pension)
const taxableIncome     = grossTotal - employeePension;
const incomeTax         = calcEthiopianPIT(taxableIncome);

// Ethiopian fiscal year: Hamle (July 7) → Sene (July 6 of following year)
// fiscal_year_start = 7  (month 7 = July)
// BIT filing deadline: November 7 (4 months after FY end)`} />

        <SubHeading>BusinessType & IFRS Tiers</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">BusinessType</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">IFRS Tier</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Badge</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['LARGE_ENTERPRISE', 'Tier 1 — Full IFRS',     'violet', 'Always Tier 1 — mandatory'],
                ['GOVERNMENT',       'Tier 1 — Full IFRS',     'slate',  'Government-owned — mandatory'],
                ['MANUFACTURING',    'Tier 1 or Tier 2',       'orange', 'Depends on AABE thresholds'],
                ['MEDIUM_ENTERPRISE','Tier 1 or Tier 2',       'blue',   'Straddles both thresholds'],
                ['SMALL_BUSINESS',   'Tier 2 — IFRS for SMEs', 'emerald','Typically meets Threshold 2'],
                ['FREELANCER',       'Tier 3 — Micro-entity',  'amber',  'Outside IFRS scope'],
              ].map(([type, tier, color, note]) => {
                const colorMap: Record<string, string> = {
                  violet:  'bg-violet-100 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400',
                  slate:   'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
                  orange:  'bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400',
                  blue:    'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400',
                  emerald: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
                  amber:   'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
                };
                return (
                  <tr key={type} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{type}</td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{tier}</td>
                    <td className="px-3 py-2 border border-slate-200 dark:border-slate-700">
                      <Badge label={color} color={colorMap[color] ?? colorMap.slate} />
                    </td>
                    <td className="px-3 py-2 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700">{note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <SubHeading>Payroll Workflow</SubHeading>
        <CodeBlock language="typescript" code={`// Payroll status lifecycle
// GENERATED → VERIFIED → FINALIZED → APPROVED → PAID

// Payroll calculation (PayrollService)
const grossPay  = (basicPay / daysInMonth) * presentDays;
const otPay     = overtimeHours * hourlyRate * 1.5;
const grossTotal = grossPay + otPay;
const employeePension = Math.min(grossTotal, 15000) * 0.07;
const taxableIncome   = grossTotal - employeePension;
const incomeTax  = calcEthiopianPIT(taxableIncome);
const loanDeduction   = employee.loanMonthlyDeduction;
const netPay = grossTotal - incomeTax - employeePension - loanDeduction;

// RBAC — each stage requires a specific permission
// payroll:generate  → HR, ovds, ACCOUNTING
// payroll:verify    → HR, ovds
// payroll:finalize  → HR, ovds
// payroll:approve   → ovds only
// payroll:export    → HR, ovds

// Bulk upload CSV format
// employeeId,basicSalary,hourlyRate,pensionRate,bankName,accountNumber`} />

        <SubHeading>Invoice & ovds Lifecycle</SubHeading>
        <CodeBlock language="typescript" code={`// Invoice status: DRAFT → PENDING → PAID | OVERDUE | CANCELLED
// Auto-journal on invoice creation (double-entry):
// Debit:  Accounts Receivable = totalAmount
// Credit: Sales Revenue       = subtotal
// Credit: VAT Payable         = vatAmount  (15%)
// Credit: DRRF Payable        = drrfAmount (1% of subtotal)

// AccountType enum (Chart of Accounts)
type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';

// Balance direction:
// ASSET + EXPENSE  → balance = totalDebit − totalCredit
// LIABILITY + EQUITY + INCOME → balance = totalCredit − totalDebit

// VAT filing workflow: DRAFT → COMPUTED → REVIEWED → SUBMITTED → ACKNOWLEDGED
// DRRF contribution: PENDING → REMITTED (or OVERDUE if past due date)

// Bank reconciliation: PENDING → RECONCILED
// Period close: locks all journal entries for the period (IAS 10 cut-off)`} />

        <SubHeading>HR & Attendance</SubHeading>
        <CodeBlock language="typescript" code={`// Attendance status: PRESENT | LATE | ABSENT | HALF_DAY
// Check-in methods: MANUAL | BIOMETRIC | KIOSK | MOBILE | QR_CODE | SYSTEM

// Geofence check (Haversine formula)
// Settings: geofence_lat, geofence_lon, geofence_radius (default 500m)
// LATE if checkIn > shiftStartTime + late_threshold minutes (default 15)

// Leave types: ANNUAL | SICK | MATERNITY | PATERNITY | UNPAID | EMERGENCY | OTHER
// Leave balance: employee.leaveEntitlement (default 22 days/year)
// Leave workflow: PENDING → APPROVED | REJECTED
// Approved leave blocks attendance check-in for the leave period

// Biometric verification (simulation — exact string match)
// BiometricType: FINGERPRINT | FACE | IRIS | CARD
// Production: replace with real SDK (ZKTeco, Suprema) for 1:N matching

// Auto-absence cron: runs nightly at 11 PM
// Skips weekends (work_days setting) and holidays
// Creates ABSENT record for employees without attendance or approved leave`} />

        <SubHeading>Notifications & Integrations</SubHeading>
        <CodeBlock language="typescript" code={`// Delivery channels: WebSocket (always) | Email | Slack | Intercom
// Config stored in SystemSetting key: notifications_config (JSON)

// Fetch notifications — always use query params
GET /notifications?employeeId=<id>&companyId=<id>&limit=50

// Mark read
PUT /notifications/<id>/read
PUT /notifications/mark-all-read/<employeeId>

// Test a channel
POST /notifications/test  { channel: 'email' | 'slack' | 'intercom' }

// Email template placeholders: {{employeeName}}, {{amount}}, {{period}}, etc.
// Slack: set webhookUrl + channel in notifications_config
// Both Header bell and Sidebar badge poll every 30s via useInterval

// Unread count: list.filter(n => !n.read && !n.isRead).length
// Note: check BOTH fields — DB uses isRead, some responses use read`} />

        <SubHeading>Dashboard & Widgets</SubHeading>
        <CodeBlock language="typescript" code={`// DashboardManager (press D) — toggle, reorder, save widget layouts per role
// Default widgets by role:
// ADMIN/SPURADMIN: BusinessCredibilityWidget, StrategicInsightsWidget, SmartAlertsWidget
// ovds/ACCOUNTING: FinancialHealthWidget, CashFlowWidget, TaxCalendarWidget
// HR: WhoIsInWidget, RecentAttendanceLogs, PayrollSummaryWidget

// StrategicInsights — 30-second in-memory cache
// Fields: projectedPayrollNextMonth, absenteeismPredictionRate,
//         efficiencyScoreByDept, complianceHealth, resourceUtilizationTrend

// Adding a new dashboard widget:
// 1. Create frontend/src/components/Dashboard/MyWidget.tsx
// 2. Wrap with <Can permission="my_module:read"> if role-restricted
// 3. Add to AVAILABLE_WIDGETS in DashboardManager.tsx
// 4. Set default visibility per role in DashboardManager.tsx`} />

        <SubHeading>CRM, Audit Outsourcing & Business Modules</SubHeading>
        <CodeBlock language="typescript" code={`// CRM permissions
// crm:read / crm:write → CRM, ADMIN
// crm:contacts:read/write, crm:deals:read/write, crm:reports:read

// Customer 360 — computed on getCustomer360(customerId)
// creditScore = paymentBehaviour(50) + interactions(20) + partnerships(20) + loans(10)
// loyaltyTier: PLATINUM(≥80) | GOLD(≥60) | SILVER(≥40) | BRONZE(<40)

// Audit Outsourcing — engagement lifecycle
// CONSULTATION → PLANNING → FIELDWORK → REPORTING → FOLLOWUP → COMPLETED
// FindingSeverity: LOW | MEDIUM | HIGH | CRITICAL
// CRITICAL findings block compliance certificate generation

// Business Loan lifecycle
// APPLIED → UNDER_REVIEW → APPROVED → DISBURSED → ACTIVE → CLOSED | REJECTED
// Credibility score (0–100): TIN(+10) + license(+10) + members(+10) + ACTIVE(+10)
//   + customers(up to 35) + financial transparency(up to 25)

// Partnership status: ACTIVE | INACTIVE | DISSOLVED | PENDING`} />

        <SubHeading>Keyboard Shortcuts</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Shortcut</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Action</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Shortcut</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Ctrl/⌘ + K', 'Global search',         '?',      'Keyboard shortcuts modal'],
                ['Ctrl/⌘ + B', 'Toggle sidebar',         'A',      'Activity feed drawer'],
                ['D',          'Dashboard manager',       'W',      'Company setup wizard'],
                ['R',          'Refresh page data',       'Home',   'Scroll to top'],
                ['G → D',      'Go to Dashboard',         'G → I',  'Go to Invoices'],
                ['G → P',      'Go to Payroll',           'G → L',  'Go to Accounting'],
                ['G → N',      'Go to Notifications',     'G → S',  'Go to Settings'],
                ['G → H',      'Go to Reports',           'G → V',  'Go to VAT'],
                ['G → E',      'Go to Employees',         '/',      'Focus sidebar search'],
                ['Escape',     'Close menus / clear search', '—',   '—'],
              ].map(([s1, a1, s2, a2], i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{s1}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{a1}</td>
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{s2}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{a2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paragraph>
          G-chord: press <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">G</code> then a letter within 1 second.
          All shortcuts are disabled when focus is in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">input</code>,{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">textarea</code>, or{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">select</code>.
          Add new shortcuts in <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">KeyboardShortcutsModal.tsx</code> and bind them in{' '}
          <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">Layout.tsx</code> via <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">useKeyboardShortcut</code>.
        </Paragraph>

        <SubHeading>WebSocket Events Reference</SubHeading>
        <div className="overflow-x-auto my-3">
          <table className="w-full text-xs border-collapse ovds-table">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Event</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Room</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Payload</th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['newCheckin',        'dashboard, global', '{ employeeId, checkIn, status, firstName, lastName }', 'Attendance check-in'],
                ['newCheckout',       'dashboard, global', '{ employeeId, checkOut, overtimeHours }',              'Attendance check-out'],
                ['newNotification',   'user_{employeeId}', 'Notification object',                                  'Any notification created'],
                ['notificationUpdate','dashboard',         '{ type: "new", count: 1 }',                            'Notification count change'],
                ['onlineUsers',       'broadcast',         'Connected client count',                               'Client connect/disconnect'],
              ].map(([event, room, payload, trigger]) => (
                <tr key={event} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-3 py-2 font-mono text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">{event}</td>
                  <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{room}</td>
                  <td className="px-3 py-2 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">{payload}</td>
                  <td className="px-3 py-2 text-slate-500 dark:text-slate-500 border border-slate-200 dark:border-slate-700">{trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Divider />

        {/* -- Footer -- */}
        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-500">
            OVDS Developer Hub · v2.0.0 · Built with NestJS 11 + React 18 + Prisma 7
          </p>
          <div className="flex justify-center gap-4 mt-2">
            <a href={`${API_URL}/docs`} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <ExternalLink size={11} /> Swagger Docs
            </a>
            <a href="https://github.com/ovds/ovds" target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
              <ExternalLink size={11} /> GitHub
            </a>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Developers;





