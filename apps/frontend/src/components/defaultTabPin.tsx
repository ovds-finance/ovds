import { Pin, PinOff } from 'lucide-react';
import React from 'react';
import toast from 'react-hot-toast';

import { useLocalStorage } from '../hooks';


interface Tab {
  key: string;
  label: string;
}

interface DefaultTabPinProps {
  tabs: Tab[];
  storageKey: string;
  activeTab: string;
  onTabChange: (key: string) => void;
  className?: string;
}

/**
 * Tab bar with pin-to-default feature.
 * Users can pin any tab as their default — it will be auto-selected on next visit.
 */
const DefaultTabPin: React.FC<DefaultTabPinProps> = ({
  tabs, storageKey, activeTab, onTabChange, className = '',
}) => {
  const [defaultTab, setDefaultTab] = useLocalStorage<string>(
    `default_tab_${storageKey}`,
    tabs[0]?.key ?? '',
  );

  const handlePin = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    if (defaultTab === key) {
      setDefaultTab(tabs[0]?.key ?? '');
      toast(`Default tab cleared`);
    } else {
      setDefaultTab(key);
      toast.success(`"${tabs.find(t => t.key === key)?.label}" set as default tab`);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key;
        const isPinned = defaultTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative group flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-[var(--pro-azure)] text-white shadow-sm shadow-green-500/20 dark:shadow-green-500/10'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            {isPinned && !isActive && (
              <Pin size={9} className="text-[var(--pro-azure)] shrink-0" />
            )}
            {tab.label}
            {isPinned && isActive && (
              <Pin size={9} className="text-white/70 shrink-0" />
            )}
            {/* Pin button on hover */}
            <button
              onClick={e => handlePin(e, tab.key)}
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${
                isPinned
                  ? 'bg-[var(--pro-azure)] text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 hover:bg-[var(--pro-azure-dark)] hover:text-white'
              }`}
              title={isPinned ? 'Unpin default' : 'Set as default tab'}
            >
              {isPinned ? <PinOff size={8} /> : <Pin size={8} />}
            </button>
          </button>
        );
      })}
    </div>
  );
};

export { DefaultTabPin };
export type { Tab };
export default DefaultTabPin;



