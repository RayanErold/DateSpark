import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import GeneratePlan from './pages/GeneratePlan';
import ProtectedRoute from './components/ProtectedRoute';

import SharedPlan from './pages/SharedPlan';
import FeedbackBot from './components/FeedbackBot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/shared/:id" element={<SharedPlan />} />

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
      <FeedbackBot />
    </Router>
  );
}

export default App;
