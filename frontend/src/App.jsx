import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PsychologistsPage from './pages/PsychologistsPage';
import PsychologistDetailsPage from './pages/PsychologistDetailsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/psychologists" element={<PsychologistsPage />} />
          <Route
            path="/psychologist/:id"
            element={<PsychologistDetailsPage />}
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/psychologists" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
