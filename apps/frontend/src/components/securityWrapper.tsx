import React, { useEffect } from 'react';

/**
 * SecurityWrapper provides protection against:
 * - Right-click (Context Menu)
 * - Text selection / Copying
 * - Common DevTools shortcuts (F12, Ctrl+Shift+I, etc.)
 * - Basic screenshot/recording protection by blurring on focus loss
 */
export const SecurityWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // 1. Disable Right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Disable common shortcuts for DevTools and Print
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (Inspect)
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
      }
      // Disable Ctrl+U (View Source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
      // Disable Ctrl+S (Save Page)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
      }
      // Disable Ctrl+P (Print - prevents simple screen capture via print)
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
      }
    };

    // 3. Simple anti-screenshot: Blur content when window loses focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        document.body.style.filter = 'blur(10px)';
      } else {
        document.body.style.filter = 'none';
      }
    };

    const handleBlur = () => {
      document.body.style.filter = 'blur(10px)';
    };

    const handleFocus = () => {
      document.body.style.filter = 'none';
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <div 
      className="select-none" 
      onDragStart={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        /* Prevent text selection via CSS */
        * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
        /* Allow selection in inputs and textareas for usability */
        input, textarea {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        /* Disable print to prevent easy PDF/Print screenshots */
        @media print {
          body { display: none !important; }
        }
      `}</style>
      {children}
    </div>
  );
};

