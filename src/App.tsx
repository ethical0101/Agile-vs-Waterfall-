import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProjectsProvider } from './contexts/ProjectsContext';
import { AuthForm } from './components/auth/AuthForm';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Analysis } from './pages/Analysis';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/auth" />;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <AuthForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/analysis" element={<Analysis />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<div className="p-6">Admin panel coming soon...</div>} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <ProjectsProvider>
        <Router>
          <AppRoutes />
        </Router>
      </ProjectsProvider>
    </AuthProvider>
  );
}

export default App;
