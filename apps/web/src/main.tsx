import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PasskeyGate from './PasskeyGate';
import './styles.css';
import './wardrobe-experience.css';

const root = document.getElementById('root');
if (!root) throw new Error('Application root was not found');
createRoot(root).render(<React.StrictMode><PasskeyGate><App /></PasskeyGate></React.StrictMode>);
