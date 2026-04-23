import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

console.log('main.jsx is executing');

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
