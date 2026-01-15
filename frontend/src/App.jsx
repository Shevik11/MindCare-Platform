import { BrowserRouter as Router } from 'react-router-dom';
import { memo } from 'react';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';

const App = memo(() => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <Header />
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;
