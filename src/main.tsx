import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { iniciarSync } from './lib/store';

createRoot(document.getElementById('root')!).render(<App />);
iniciarSync();
