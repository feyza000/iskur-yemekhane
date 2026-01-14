// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layouts
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import AuthLayout from './components/AuthLayout';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditResponse from './pages/EditResponse';
import ResetPasswordPage from './pages/ResetPasswordPage';

import NewSurvey from './pages/admin/NewSurvey';
import SurveyDetail from './pages/admin/SurveyDetail';
import UserList from './pages/admin/UserList';// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import SurveyList from './pages/admin/SurveyList';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('siteTheme') || 'light');
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('siteTheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          <Route path="/admin" element={<AdminLayout theme={theme} toggleTheme={toggleTheme} />}>
            <Route index element={<AdminDashboard />} />
            <Route path="surveys" element={<SurveyList />} />
            <Route path="surveys/new" element={<NewSurvey />} />
            <Route path="surveys/:id" element={<SurveyDetail />} />
            <Route path="users" element={<UserList />} />
          </Route>

          {/* --- 2. PUBLIC ROTALARI (MainLayout Çatısı Altında) --- */}
          <Route element={<MainLayout theme={theme} toggleTheme={toggleTheme} />}>

            {/* Anasayfa direkt MainLayout içinde */}
            <Route path="/" element={<HomePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/response/:id/edit" element={<EditResponse />} />

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />
            </Route>

          </Route>

        </Routes>
      </AnimatePresence>
    </>
  );
}

export default App;