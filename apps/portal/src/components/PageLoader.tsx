import React from 'react';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[60vh]" aria-label="Loading page" aria-live="polite">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        Loading...
      </span>
    </div>
  </div>
);

export default PageLoader;
