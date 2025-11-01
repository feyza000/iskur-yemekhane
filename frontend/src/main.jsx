import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // 1. IMPORT ET
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 2. TÜM UYGULAMAYI SARMALA */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);