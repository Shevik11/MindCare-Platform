import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import PsychologistsPage from './pages/PsychologistsPage';
import PsychologistDetailsPage from './pages/PsychologistDetailsPage';
import ArticlePage from './pages/ArticlePage';
import ArticleEditPage from './pages/ArticleEditPage';
import MyArticlesPage from './pages/MyArticlesPage';
import AdminPanel from './pages/AdminPanel';
import AdminArticlesPage from './pages/AdminArticlesPage';
import AdminArticlesManagePage from './pages/AdminArticlesManagePage';
import AdminPsychologistsPage from './pages/AdminPsychologistsPage';
import AdminPsychologistDetailsPage from './pages/AdminPsychologistDetailsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PsychologistRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'psychologist' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/article/:id" element={<ArticlePage />} />
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
          <Route
            path="/articles/new"
            element={
              <PsychologistRoute>
                <ArticleEditPage />
              </PsychologistRoute>
            }
          />
          <Route
            path="/articles/:id/edit"
            element={
              <PsychologistRoute>
                <ArticleEditPage />
              </PsychologistRoute>
            }
          />
          <Route
            path="/articles/my"
            element={
              <PsychologistRoute>
                <MyArticlesPage />
              </PsychologistRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/articles"
            element={
              <AdminRoute>
                <AdminArticlesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/articles/manage"
            element={
              <AdminRoute>
                <AdminArticlesManagePage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/psychologists"
            element={
              <AdminRoute>
                <AdminPsychologistsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/psychologists/:id"
            element={
              <AdminRoute>
                <AdminPsychologistDetailsPage />
              </AdminRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
