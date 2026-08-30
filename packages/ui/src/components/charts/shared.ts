/* -- Shared tooltip style -----------------------------------------------------
   Uses CSS variables so it respects dark mode automatically */
const TT_STYLE = {
  contentStyle: {
    background: 'var(--bg-sidebar, #1e293b)',
    border: 'none',
    borderRadius: 10,
    fontSize: 11,
    color: '#fff',
    padding: '6px 12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
  },
  itemStyle: { color: '#cbd5e1' },
  labelStyle: { color: '#fff', fontWeight: 700, marginBottom: 2 },
};

const AXIS_STYLE = { fontSize: 10, fill: '#94a3b8', fontWeight: 600 };

const PIE_COLORS = [
  '#00E784',
  '#00E784',
  '#f59e0b',
  '#8b5cf6',
  '#f43f5e',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

export { TT_STYLE, AXIS_STYLE, PIE_COLORS };
