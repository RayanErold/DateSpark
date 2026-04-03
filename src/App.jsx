import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import FeedbackBot from './components/FeedbackBot';
import ScrollToTop from './components/ScrollToTop';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const GeneratePlan = lazy(() => import('./pages/GeneratePlan'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const SharedPlan = lazy(() => import('./pages/SharedPlan'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const CookiePolicy = lazy(() => import('./pages/CookiePolicy'));

const LoadingScreen = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[9999]">
        <div className="w-12 h-12 border-4 border-coral border-b-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-navy font-bold animate-pulse">Loading DateSpark...</p>
    </div>
);

function App() {
  React.useEffect(() => {
    document.title = "DateSpark | Premium AI Date Planner";
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shared/:id" element={<SharedPlan />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/refund" element={<RefundPolicy />} />
          <Route path="/cookies" element={<CookiePolicy />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/generate" element={
            <ProtectedRoute>
              <GeneratePlan />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
      <FeedbackBot />
    </Router>
  );
}

export default App;
