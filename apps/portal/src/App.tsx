import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@ovds/ui';
import AppRoutes from './AppRoutes';
import './i18n';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
