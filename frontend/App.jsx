import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import FeedbackBot from './components/features/FeedbackBot';
import ScrollToTop from './components/common/ScrollToTop';

// Lazy load pages for better performance
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));
const GeneratePlan = lazy(() => import('./pages/dashboard/GeneratePlan'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const SharedPlan = lazy(() => import('./pages/dashboard/SharedPlan'));
const PrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy'));
const VibeOnboarding = lazy(() => import('./pages/dashboard/VibeOnboarding'));

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
          <Route path="/demo" element={<GeneratePlan isGuestMode={true} />} />
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
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <VibeOnboarding />
            </ProtectedRoute>
          } />
        </Routes>
      </Suspense>
      <FeedbackBot />
    </Router>
  );
}

export default App;
