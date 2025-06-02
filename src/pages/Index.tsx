
import React from 'react';
import { useLocation } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import Dashboard from './Dashboard';
import Upload from './Upload';
import Sales from './Sales';
import Prices from './Prices';
import Pumps from './Pumps';
import Reports from './Reports';
import Settings from './Settings';

const Index = () => {
  const location = useLocation();
  
  const renderPage = () => {
    switch (location.pathname) {
      case '/upload':
        return <Upload />;
      case '/sales':
        return <Sales />;
      case '/prices':
        return <Prices />;
      case '/pumps':
        return <Pumps />;
      case '/reports':
        return <Reports />;
      case '/settings':
        return <Settings />;
      case '/dashboard':
      case '/':
      default:
        return <Dashboard />;
    }
  };

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  );
};

export default Index;
