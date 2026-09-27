
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { registerSW } from 'virtual:pwa-register';

// Register service worker immediately to ensure offline support
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, auto-updating service worker.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
