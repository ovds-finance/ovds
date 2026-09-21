import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SettingsCard({ title, description, children, actions }) {
    return (_jsxs("div", { className: "ovds-widget-card p-6", children: [_jsxs("div", { className: "flex items-start justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-slate-700 dark:text-slate-300", children: title }), description && _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: description })] }), actions && _jsx("div", { className: "flex items-center gap-2", children: actions })] }), _jsx("div", { className: "space-y-4", children: children })] }));
}
