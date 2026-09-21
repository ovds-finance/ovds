import React from 'react';
import { Navigate } from 'react-router-dom';

import { useModuleGuard } from '../hooks/useModuleGuard';

interface ModuleGuardProps {
  moduleKey?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const ModuleGuard: React.FC<ModuleGuardProps> = ({
  moduleKey,
  fallback = null,
  children,
}) => {
  const { allowed } = useModuleGuard(moduleKey);

  if (!allowed) {
    if (fallback) return <React.Fragment>{fallback}</React.Fragment>;
    return <Navigate to="/forbidden" replace />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};
