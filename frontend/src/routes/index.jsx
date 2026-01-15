import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('../pages/home/HomePage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ProfilePage = lazy(() => import('../pages/profile/ProfilePage'));
const PsychologistsPage = lazy(
  () => import('../pages/psychologists/PsychologistsPage')
);
const PsychologistDetailsPage = lazy(
  () => import('../pages/psychologists/PsychologistDetailsPage')
);
const ArticlePage = lazy(() => import('../pages/articles/ArticlePage'));
const ArticleEditPage = lazy(() => import('../pages/articles/ArticleEditPage'));
const MyArticlesPage = lazy(() => import('../pages/articles/MyArticlesPage'));
const AdminPanel = lazy(() => import('../pages/admin/AdminPanel'));
const AdminArticlesPage = lazy(
  () => import('../pages/admin/AdminArticlesPage')
);
const AdminArticlesManagePage = lazy(
  () => import('../pages/admin/AdminArticlesManagePage')
);
const AdminPsychologistsPage = lazy(
  () => import('../pages/admin/AdminPsychologistsPage')
);
const AdminPsychologistDetailsPage = lazy(
  () => import('../pages/admin/AdminPsychologistDetailsPage')
);
const AdminModerationPage = lazy(
  () => import('../pages/admin/AdminModerationPage')
);
const MyAppointmentsPage = lazy(
  () => import('../pages/appointments/MyAppointmentsPage')
);
const PsychologistAppointmentsPage = lazy(
  () => import('../pages/appointments/PsychologistAppointmentsPage')
);

// Loading fallback component
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '50vh',
    }}
  >
    <div>Loading...</div>
  </div>
);

export const PrivateRoute = memo(({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
});

export const PsychologistRoute = memo(({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'psychologist' && user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
});

export const PatientRoute = memo(({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'patient') {
    return <Navigate to="/" />;
  }
  return children;
});

export const AdminRoute = memo(({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/" />;
  }
  return children;
});

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
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
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminModerationPage />
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
          <Route
            path="/appointments/my"
            element={
              <PatientRoute>
                <MyAppointmentsPage />
              </PatientRoute>
            }
          />
          <Route
            path="/appointments/psychologist"
            element={
              <PsychologistRoute>
                <PsychologistAppointmentsPage />
              </PsychologistRoute>
            }
          />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
