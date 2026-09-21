/**
 * docsPortal.tsx — public, unauthenticated documentation portal at /docs
 *
 * Accessible to everyone without login.
 * Fetches from /api/docs  — @Public() backend endpoints, read-only, rate-limited.
 * No auth headers, no cookies, no user data ever sent to or from this page.
 *
 * Design matches the Landing / GettingStartedPublic pages:
 *   - Sticky navbar with dark mode toggle
 *   - OVDS brand + Sign in link
 *   - Self-contained layout (no Layout wrapper)
 *
 * Search strategy (two-layer):
 *   1. Backend search — debounced 350 ms, hits GET /api/docs?search=q (DB full-text)
 *   2. Fuse.js fuzzy re-rank — applied client-side to the backend result page for
 *      better ordering when the query is short / typo-prone (e.g. "infvoice" → invoice).
 *      Fuse.js never fetches extra data — it only re-sorts what the backend returned.
 */
import DOMPurify from 'dompurify';
import Fuse, { type IFuseOptions as FuseOptions } from 'fuse.js';
import {
  Moon, Sun, Search, ChevronRight, ArrowLeft,
  BookOpen, Landmark, Tag, RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ArticleSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  subcategory: string | null;
  summary: string | null;
  tags: string | null;
  updatedAt?: string;
}

interface ArticleFull extends ArticleSummary {
  content: string;
  sortOrder: number;
  updatedAt: string;
}

interface ListResponse {
  data: ArticleSummary[];
  total: number;
  page: number;
  pageSize: number;
}

interface ModuleEntry {
  category: string;
  subcategory: string;
  count: number;
  slug_sample: string;
}

type DocCategory = 'feature' | 'tutorial' | 'faq' | 'api_reference' | '';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: string; color: string; badge: string }> = {
  feature: {
    label: 'Features',
    icon: '⭐',
    color: 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-green-300 border-[var(--pro-azure-100)] dark:border-green-800',
    badge: 'bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-green-300',
  },
  tutorial: {
    label: 'Tutorials',
    icon: '📖',
    color: 'bg-[var(--pro-azure-50)] dark:bg-[var(--pro-azure-50)]/10 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] border-[var(--pro-azure-100)] dark:border-[var(--pro-azure)]/20',
    badge: 'bg-[var(--pro-azure-100)] dark:bg-[var(--pro-azure-50)]/20 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]',
  },
  faq: {
    label: 'FAQ',
    icon: '❓',
    color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
  api_reference: {
    label: 'API Reference',
    icon: '🔌',
    color: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300',
  },
};

const ALL_CATEGORIES: DocCategory[] = ['', 'feature', 'tutorial', 'faq', 'api_reference'];
const PAGE_SIZE = 12;

// ─── API helpers ─────────────────────────────────────────────────────────────

async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`/api/docs${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',  // never send session cookies
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((body['message'] as string | undefined) ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Simple Markdown → HTML renderer ─────────────────────────────────────────
// Intentionally lightweight — avoids bringing in a markdown lib for a public page.
// Only DOMPurify-style safety: content comes from our own DB; still escape < and &.

function mdToHtml(md: string): string {
  const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  // Split into code-block sections to protect them
  const segments = md.split(/(```[\s\S]*?```)/g);

  return segments.map((seg, i) => {
    if (i % 2 === 1) {
      // Code block
      const lang = seg.match(/^```(\w*)/)?.[1] ?? '';
      const code = escape(seg.replace(/^```\w*\n?/, '').replace(/```$/, ''));
      return `<pre class="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto text-sm font-mono my-4 leading-relaxed" aria-label="Code example${lang ? ': ' + lang : ''}"><code>${code}</code></pre>`;
    }

    return seg
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-6 mb-2 text-slate-800 dark:text-slate-100">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-8 mb-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-extrabold mt-4 mb-4 text-slate-900 dark:text-white">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`\n]+)`/g, '<code class="font-mono text-sm bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] underline hover:no-underline">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[var(--pro-azure)] pl-4 italic text-slate-600 dark:text-slate-400 my-3">$1</blockquote>')
      .replace(/^---+$/gm, '<hr class="border-slate-200 dark:border-slate-700 my-6"/>')
      .replace(/^[-*] (.+)$/gm, '<li class="ml-5 list-disc text-sm text-slate-700 dark:text-slate-300 mb-1">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-5 list-decimal text-sm text-slate-700 dark:text-slate-300 mb-1">$1</li>')
      .split('\n\n')
      .map((block) => {
        const trimmed = block.trim();
        if (!trimmed) return '';
        if (/^<(h[123]|ul|ol|blockquote|pre|hr|li)\b/.test(trimmed)) return trimmed;
        return `<p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-3">${trimmed}</p>`;
      })
      .join('');
  }).join('');
}

// ─── Fuse.js fuzzy search hook ────────────────────────────────────────────────
// Re-ranks the backend result list client-side using fuzzy matching.
// Threshold 0.35 = tolerates ~1-2 typos in a 6-char word.
// Only active when query length >= 2; otherwise returns the original list as-is.

const FUSE_OPTIONS: FuseOptions<ArticleSummary> = {
  keys: [
    { name: 'title',       weight: 0.6 },
    { name: 'subcategory', weight: 0.25 },
    { name: 'summary',     weight: 0.1 },
    { name: 'tags',        weight: 0.05 },
  ],
  threshold: 0.35,      // lower = stricter matching
  minMatchCharLength: 2,
  includeScore: true,
  ignoreLocation: true, // don't penalise matches at end of string
};

function useFuzzySearch(items: ArticleSummary[], query: string): ArticleSummary[] {
  return useMemo(() => {
    if (!query || query.trim().length < 2) return items;
    const fuse = new Fuse(items, FUSE_OPTIONS);
    return fuse.search(query).map(r => r.item);
  }, [items, query]);
}

// ─── CategoryBadge ────────────────────────────────────────────────────────────

const CategoryBadge: React.FC<{ cat: string; small?: boolean }> = ({ cat, small }) => {
  const meta = CATEGORY_META[cat];
  if (!meta) return null;
  const size = small ? 'text-[10px] px-1.5 py-px' : 'text-xs px-2 py-0.5';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold border ${size} ${meta.color}`}>
      {meta.icon} {meta.label}
    </span>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const DocsNav: React.FC<{ dark: boolean; onToggleDark: () => void }> = ({ dark, onToggleDark }) => (
  <nav
    className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm"
    aria-label="Documentation navigation"
  >
    <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 shrink-0" aria-label="OVDS home">
        <div className="w-7 h-7 rounded-lg bg-[var(--pro-azure)] flex items-center justify-center">
          <Landmark size={14} className="text-white" />
        </div>
        <span className="font-extrabold text-slate-900 dark:text-white text-sm">OVDS</span>
      </Link>

      <ChevronRight size={12} className="text-slate-300 dark:text-slate-600 shrink-0" aria-hidden />

      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
        <BookOpen size={14} /> Docs
      </span>

      <div className="flex-1" />

      {/* Dark mode toggle */}
      <button
        onClick={onToggleDark}
        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <Link
        to="/login"
        className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] transition-colors"
      >
        Sign In →
      </Link>

      <Link
        to="/register"
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-[var(--pro-azure)] hover:bg-[var(--pro-azure-dark)] text-white rounded-lg transition-colors"
      >
        Get Started
      </Link>
    </div>
  </nav>
);

// ─── ArticleCard ─────────────────────────────────────────────────────────────

const ArticleCard: React.FC<{ article: ArticleSummary; onClick: () => void }> = ({ article, onClick }) => {
  const tags = (() => {
    try { return (JSON.parse(article.tags ?? '[]') as string[]).slice(0, 4); }
    catch { return []; }
  })();

  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure)] hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[var(--pro-azure)]"
      aria-label={`Read: ${article.title}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] transition-colors leading-snug line-clamp-2">
          {article.title}
        </h3>
        <CategoryBadge cat={article.category} small />
      </div>

      {article.summary && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2">
          {article.summary}
        </p>
      )}

      <div className="flex flex-wrap gap-1 mt-1">
        {tags.filter(t => t !== article.category).map(tag => (
          <span key={tag} className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700/60 rounded px-1.5 py-0.5">
            <Tag size={8} /> {tag}
          </span>
        ))}
      </div>

      {article.subcategory && (
        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 font-medium truncate">
          {article.subcategory}
        </p>
      )}
    </button>
  );
};

// ─── ArticleViewer ────────────────────────────────────────────────────────────

const ArticleViewer: React.FC<{ slug: string; onBack: () => void }> = ({ slug, onBack }) => {
  const [article, setArticle] = useState<ArticleFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPublic<ArticleFull>(`/${encodeURIComponent(slug)}`)
      .then(a => { if (!cancelled) setArticle(a); })
      .catch(e => { if (!cancelled) setError((e as Error).message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" aria-live="polite" role="status">
        <div className="w-6 h-6 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" aria-label="Loading article" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div role="alert" className="p-6 text-center">
        <p className="text-rose-500 text-sm mb-3">{error ?? 'Article not found.'}</p>
        <button onClick={onBack} className="text-xs font-bold text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline flex items-center gap-1 mx-auto">
          <ArrowLeft size={12} /> Back to docs
        </button>
      </div>
    );
  }

  const html = mdToHtml(article.content);
  const sanitizedHtml = DOMPurify.sanitize(html);

  return (
    <article className="max-w-3xl mx-auto" aria-label={article.title}>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[var(--pro-azure)] dark:hover:text-[var(--pro-azure-light)] mb-6 transition-colors"
        aria-label="Back to article list"
      >
        <ArrowLeft size={13} /> Back to docs
      </button>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <CategoryBadge cat={article.category} />
        {article.subcategory && (
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{article.subcategory}</span>
        )}
        <span className="text-xs text-slate-300 dark:text-slate-600 ml-auto">
          Updated {new Date(article.updatedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })}
        </span>
      </div>

      {/* Content */}
      {sanitizedHtml || !html ? (
        <div
          className="prose prose-sm max-w-none dark:prose-invert text-slate-700 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) ?? '' }}
          aria-label="Article content"
        />
      ) : (
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{article.content}</p>
      )}
    </article>
  );
};

// ─── ModuleBrowser ────────────────────────────────────────────────────────────

/**
 * Shows all subcategories (modules) grouped by doc category,
 * each as a clickable card that filters the article list.
 */
const ModuleBrowser: React.FC<{
  modules: ModuleEntry[];
  onSelect: (cat: DocCategory, sub: string) => void;
}> = ({ modules, onSelect }) => {
  if (modules.length === 0) return null;

  // Group by category
  const grouped: Record<string, ModuleEntry[]> = {};
  for (const m of modules) {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  }

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4">Browse by Module</h2>
      {Object.entries(grouped).map(([cat, entries]) => {
        const meta = CATEGORY_META[cat];
        if (!meta) return null;
        return (
          <div key={cat} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {meta.icon} {meta.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2">
              {entries.map(m => (
                <button
                  key={`${m.category}:${m.subcategory}`}
                  onClick={() => onSelect(cat as DocCategory, m.subcategory)}
                  className="text-left p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-[var(--pro-azure)] dark:hover:border-[var(--pro-azure)] hover:shadow-sm transition-all group"
                  aria-label={`Browse ${m.subcategory}`}
                >
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-[var(--pro-azure)] dark:group-hover:text-[var(--pro-azure-light)] leading-tight mb-1 line-clamp-2">
                    {m.subcategory}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    {m.count} article{m.count !== 1 ? 's' : ''}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─── Main DocsPortal component ────────────────────────────────────────────────

export default function DocsPortal() {
  // ── Dark mode (mirrors Landing page pattern) ────────────────────────────
  const [dark, setDark] = useState(() =>
    typeof window !== 'undefined' &&
    (document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  );
  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [dark]);

  // ── State ───────────────────────────────────────────────────────────────
  const [category, setCategory] = useState<DocCategory>('');
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [navTree, setNavTree] = useState<Record<string, string[]>>({});
  const [allTags, setAllTags] = useState<string[]>([]);
  const [modules, setModules] = useState<ModuleEntry[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Debounce search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  // ── Load nav + tags once ────────────────────────────────────────────────
  useEffect(() => {
    fetchPublic<Record<string, string[]>>('/nav').then(setNavTree).catch(() => {});
    fetchPublic<string[]>('/tags').then(setAllTags).catch(() => {});
    fetchPublic<ModuleEntry[]>('/modules').then(setModules).catch(() => {});
  }, []);

  // ── Load articles ───────────────────────────────────────────────────────
  const loadArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), take: String(PAGE_SIZE) });
      if (category) params.set('category', category);
      if (activeSubcategory) params.set('subcategory', activeSubcategory);
      if (debouncedSearch) params.set('search', debouncedSearch);
      else if (activeTag) params.set('search', activeTag);
      const res = await fetchPublic<ListResponse>(`?${params.toString()}`);
      setArticles(res.data);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [category, activeSubcategory, debouncedSearch, activeTag, page]);

  useEffect(() => { void loadArticles(); }, [loadArticles]);

  // ── Navigation helpers ──────────────────────────────────────────────────
  const openArticle = useCallback((slug: string) => {
    setSelectedSlug(slug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const backToList = useCallback(() => {
    setSelectedSlug(null);
    window.scrollTo({ top: 0 });
  }, []);

  const selectCategory = useCallback((cat: DocCategory) => {
    setCategory(cat);
    setActiveSubcategory('');
    setActiveTag('');
    setPage(1);
    setSelectedSlug(null);
  }, []);

  // Selects both category + subcategory at once (used by ModuleBrowser cards)
  const selectModule = useCallback((cat: DocCategory, sub: string) => {
    setCategory(cat);
    setActiveSubcategory(sub);
    setActiveTag('');
    setSearch('');
    setPage(1);
    setSelectedSlug(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectTag = useCallback((tag: string) => {
    setActiveTag(prev => prev === tag ? '' : tag);
    setActiveSubcategory('');
    setSearch('');
    setPage(1);
    setSelectedSlug(null);
  }, []);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Fuse.js client-side re-rank ─────────────────────────────────────────
  // Takes the backend's page of results and re-orders by fuzzy score when
  // a search query is active. Improves ordering for short/typo queries.
  const fuzzyRankedArticles = useFuzzySearch(articles, debouncedSearch);
  // Use fuzzy results when searching, raw backend order otherwise
  const displayArticles = debouncedSearch.length >= 2 ? fuzzyRankedArticles : articles;

  // ── URL hash deep-linking: /docs#<slug> opens the article directly ──────
  // On mount: if the URL has a hash, open that article immediately.
  // On navigation: keep the hash in sync so the URL is bookmarkable/shareable.
  // Both effects use window.history.replaceState so Back button works correctly.
  // External links to /docs#my-article-slug will open the article on load.
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && !selectedSlug) setSelectedSlug(hash);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedSlug) window.history.replaceState(null, '', `/docs#${selectedSlug}`);
    else window.history.replaceState(null, '', '/docs');
  }, [selectedSlug]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
      <DocsNav dark={dark} onToggleDark={() => setDark(d => !d)} />

      {/* ── Hero banner ── */}
      {!selectedSlug && (
        <div className="bg-gradient-to-br from-[var(--pro-azure)] to-teal-700 text-white py-10 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">OVDS Knowledge Base</h1>
            <p className="text-green-100 text-sm max-w-lg mb-5">
              Guides, tutorials, API reference, and FAQs for the OVDS platform — Ethiopian business & tax compliance.
            </p>
            {/* Hero search */}
            <div className="relative max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" aria-hidden />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search docs, guides, API…"
                aria-label="Search documentation"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/95 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {selectedSlug ? (
          <ArticleViewer slug={selectedSlug} onBack={backToList} />
        ) : (
          <div className="flex gap-8">

            {/* ── Sidebar ── */}
            <aside className="hidden lg:flex flex-col gap-6 w-52 shrink-0" aria-label="Documentation sidebar">
              {/* Categories */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Categories</p>
                {ALL_CATEGORIES.map(cat => {
                  const meta = cat ? CATEGORY_META[cat] : null;
                  const active = category === cat;
                  return (
                    <button
                      key={cat || 'all'}
                      onClick={() => selectCategory(cat)}
                      aria-pressed={active}
                      className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold mb-0.5 transition-colors ${
                        active
                          ? 'bg-[var(--pro-azure-50)] dark:bg-green-950/30 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)]'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>{meta?.icon ?? '📚'}</span>
                      <span>{meta?.label ?? 'All Docs'}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nav tree from API */}
              {Object.keys(navTree).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Browse</p>
                  {Object.entries(navTree).map(([cat, subs]) => (
                    <div key={cat} className="mb-3">
                      <button
                        onClick={() => selectCategory(cat as DocCategory)}
                        className={`flex items-center gap-1.5 text-[11px] font-bold mb-1 transition-colors ${
                          category === cat ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)]' : 'text-slate-600 dark:text-slate-300 hover:text-[var(--pro-azure)]'
                        }`}
                      >
                        {CATEGORY_META[cat]?.icon} {CATEGORY_META[cat]?.label ?? cat}
                      </button>
                      {subs.slice(0, 6).map(sub => (
                        <button
                          key={sub}
                          onClick={() => selectModule(cat as DocCategory, sub)}
                          title={sub}
                          aria-pressed={activeSubcategory === sub && category === cat}
                          className={`w-full text-left text-[10px] pl-4 leading-5 truncate block transition-colors mb-px rounded ${
                            activeSubcategory === sub && category === cat
                              ? 'text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] font-semibold'
                              : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Popular tags */}
              {allTags.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {allTags.slice(0, 18).map(tag => (
                      <button
                        key={tag}
                        onClick={() => selectTag(tag)}
                        aria-pressed={activeTag === tag}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                          activeTag === tag
                            ? 'bg-[var(--pro-azure-100)] dark:bg-green-900/40 text-[var(--pro-azure-dark)] dark:text-[var(--pro-azure-light)] ring-1 ring-[var(--pro-azure)]'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            {/* ── Article grid ── */}
            <section className="flex-1 min-w-0">

              {/* Module browser — shown only on "All Docs" homepage (no active filters) */}
              {!category && !activeTag && !activeSubcategory && !debouncedSearch && modules.length > 0 && (
                <ModuleBrowser
                  modules={modules}
                  onSelect={selectModule}
                />
              )}

              {/* Active filter chips */}
              {(category || activeTag || activeSubcategory) && (
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {category && (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_META[category]?.color}`}>
                      {CATEGORY_META[category]?.icon} {CATEGORY_META[category]?.label}
                      <button onClick={() => selectCategory('')} aria-label="Clear category filter" className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  )}
                  {activeSubcategory && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      📂 {activeSubcategory}
                      <button onClick={() => setActiveSubcategory('')} aria-label="Clear module filter" className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  )}
                  {activeTag && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      <Tag size={10} /> #{activeTag}
                      <button onClick={() => selectTag('')} aria-label="Clear tag filter" className="ml-0.5 hover:opacity-70">×</button>
                    </span>
                  )}
                  {(category || activeSubcategory || activeTag) && (
                    <button
                      onClick={() => { selectCategory(''); setActiveSubcategory(''); }}
                      className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 hover:text-rose-500 transition-colors"
                      aria-label="Clear all filters"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex justify-center items-center h-48" role="status" aria-label="Loading articles">
                  <div className="w-6 h-6 border-2 border-[var(--pro-azure)] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Error */}
              {error && !loading && (
                <div role="alert" className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-600 dark:text-rose-400 flex items-center gap-3">
                  <span className="flex-1">{error}</span>
                  <button onClick={() => void loadArticles()} className="flex items-center gap-1 text-xs font-bold hover:underline" aria-label="Retry">
                    <RefreshCw size={12} /> Retry
                  </button>
                </div>
              )}

              {/* Empty */}
              {!loading && !error && articles.length === 0 && (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <p className="text-4xl mb-3">🔍</p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No articles found</p>
                  {(debouncedSearch || activeTag || activeSubcategory) && (
                    <button
                      onClick={() => { setSearch(''); setActiveTag(''); setActiveSubcategory(''); }}
                      className="text-xs text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] mt-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                  {!debouncedSearch && !activeTag && !activeSubcategory && (
                    <p className="text-xs mt-2">
                      Run{' '}
                      <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        npm run docs:full
                      </code>{' '}
                      to seed documentation.
                    </p>
                  )}
                </div>
              )}

              {/* Grid */}
              {!loading && !error && articles.length > 0 && (
                <>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-4" aria-live="polite">
                    {total} article{total !== 1 ? 's' : ''}
                    {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {displayArticles.map(a => (
                      <ArticleCard key={a.id} article={a} onClick={() => openArticle(a.slug)} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-8">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        aria-label="Previous page"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        ← Prev
                      </button>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        aria-label="Next page"
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        Next →
                      </button>
                    </nav>
                  )}
                </>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-16 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-[var(--pro-azure)] flex items-center justify-center">
            <Landmark size={12} className="text-white" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">OVDS finClaudeOvds</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
          Documentation · Knowledge Base · API Reference
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Link to="/" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">Home</Link>
          <Link to="/login" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">Sign In</Link>
          <Link to="/register" className="text-[var(--pro-azure)] dark:text-[var(--pro-azure-light)] hover:underline">Get Started</Link>
        </div>
      </footer>
    </div>
  );
}
