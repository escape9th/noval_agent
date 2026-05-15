import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ThemeProvider from './components/Theme/ThemeProvider';
import AnimeDecorations from './components/Theme/AnimeDecorations';
import './i18n';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AnimeDecorations />
      <App />
    </ThemeProvider>
  </React.StrictMode>,
);
