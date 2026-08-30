import React from "react";
import { Btn, Icon } from "../components/ui";

interface RefinePageShellProps {
  title: string;
  subtitle?: string;
  onCreate?: () => void;
  createLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const RefinePageShell: React.FC<RefinePageShellProps> = ({ title, subtitle, onCreate, createLabel = "New", children, actions }) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {actions}
            {onCreate && (
              <Btn onClick={onCreate}>
                <Icon name="PLUS" size={16} /> {createLabel}
              </Btn>
            )}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default RefinePageShell;
