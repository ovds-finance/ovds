import React, { useState } from 'react';
import { clsx } from 'clsx';

interface Tab {
  key: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, variant = 'default', className }: TabsProps) => {
  const variants = {
    default: 'border-b border-gray-200',
    pills: 'gap-1',
    underline: 'border-b border-gray-200',
  };

  const tabStyles = {
    default: (isActive: boolean) => clsx(
      'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
      isActive 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    ),
    pills: (isActive: boolean) => clsx(
      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
      isActive 
        ? 'bg-blue-600 text-white' 
        : 'text-gray-600 hover:bg-gray-100'
    ),
    underline: (isActive: boolean) => clsx(
      'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
      isActive 
        ? 'border-blue-600 text-blue-600' 
        : 'border-transparent text-gray-500 hover:text-gray-700'
    ),
  };

  return (
    <div className={clsx(variants[variant], className)} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          aria-controls={`${tab.key}-panel`}
          id={`${tab.key}-tab`}
          onClick={() => !tab.disabled && onChange(tab.key)}
          disabled={tab.disabled}
          className={clsx(
            tabStyles[variant](activeTab === tab.key),
            tab.disabled && 'opacity-50 cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

interface TabPanelProps {
  children: React.ReactNode;
  key: string;
  tabKey: string;
}

export const TabPanel = ({ children, tabKey, key }: TabPanelProps) => (
  <div 
    role="tabpanel" 
    id={`${tabKey}-panel`} 
    aria-labelledby={`${tabKey}-tab`}
    key={key}
  >
    {children}
  </div>
);