import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0f0f1a',
            color: '#fff',
            border: '1px solid rgba(57,255,20,0.3)',
          },
          success: {
            iconTheme: { primary: '#39FF14', secondary: '#0f0f1a' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0f0f1a' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
