import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Self-hosted fonts: no third-party DNS/TLS round-trips on mobile networks,
// only the unicode ranges a page actually uses are downloaded.
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import App from './App.tsx';
import { LangProvider } from './i18n';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LangProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LangProvider>
  </StrictMode>,
);

// A little something for the curious who open DevTools.
console.log(
  "%cHey, fellow engineer 👋\n%cLike poking around? Let's talk: https://telegram.me/IgorSavin",
  'color:#64ffda;font-size:14px;font-weight:bold;',
  'color:#8b949e;font-size:12px;',
);
