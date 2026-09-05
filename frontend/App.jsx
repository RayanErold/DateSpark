import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
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
const PricingPage = lazy(() => import('./pages/PricingPage'));
const VibeFeed = lazy(() => import('./pages/dashboard/VibeFeed'));
const AdminDashboard = lazy(() => import('./pages/dashboard/AdminDashboard'));

const LoadingScreen = () => (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-ivory z-[9999]">
        <div className="relative">
            <div className="w-16 h-16 border-2 border-blush rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-2 border-rose border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-rose rounded-full animate-pulse"></div>
            </div>
        </div>
        <p className="mt-6 text-taupe/60 font-semibold uppercase tracking-[0.2em] text-[10px] animate-pulse font-outfit">Initializing DateSpark</p>
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
          <Route path="/pricing" element={<PricingPage />} />
          {/* <Route path="/gift" element={<GiftCardPage />} /> */}
          {/* <Route path="/collab/accept" element={<CollabAcceptPage />} /> */}


          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/onboarding" element={<Navigate to="/dashboard" replace />} />
          {/* <Route path="/vibe-feed" element={
            <ProtectedRoute>
              <VibeFeed />
            </ProtectedRoute>
          } /> */}

          <Route path="/generate" element={
            <ProtectedRoute>
              <GeneratePlan />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* Deprecated Routes */}
          <Route path="/generate-plan" element={<Navigate to="/generate" replace />} />
          
          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
