import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App.jsx';

// Configure central API URL for production and development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// 1. Configure Axios global default baseURL
axios.defaults.baseURL = API_URL;

// 2. Override global fetch to automatically prepend API_URL for relative /api/ requests
const originalFetch = window.fetch;
window.fetch = function (input, init) {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = `${API_URL}${input}`;
  } else if (input instanceof URL && input.pathname.startsWith('/api/')) {
    return originalFetch(new URL(`${API_URL}${input.pathname}${input.search}`), init);
  }
  return originalFetch(input, init);
};

console.log(`main.jsx initialized with API Gateway URL: ${API_URL}`);

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Failed to find the root element');
  } else {
    console.log('Root element found, rendering App...');
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  }
} catch (error) {
  console.error('Fatal error during React render:', error);
}
