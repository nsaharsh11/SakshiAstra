import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app.jsx';
import './tokens.css';
import './app.css';

const container = document.getElementById('root');
if (!container) throw new Error('SakshiAstra root element is missing.');
createRoot(container).render(<App />);
