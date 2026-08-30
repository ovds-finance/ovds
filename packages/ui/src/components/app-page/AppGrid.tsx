export interface AppGridProps {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const AppGrid: React.FC<AppGridProps> = ({ children, cols = 3, gap = 'md', className }) => {
  const colCls = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }[cols];
  const gapCls = { sm: 'gap-3', md: 'gap-4', lg: 'gap-5' }[gap];
  return (
    <div className={`grid ${colCls} ${gapCls} ${className ?? ''}`}>
      {children}
    </div>
  );
};
