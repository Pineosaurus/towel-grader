import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Blueprint styles
import '@blueprintjs/core/lib/css/blueprint.css';
import '@blueprintjs/icons/lib/css/blueprint-icons.css';

import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
