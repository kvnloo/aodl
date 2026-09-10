import React from 'react';
import { createRoot } from 'react-dom/client';
import { Language } from './Language.jsx';
import 'katex/dist/katex.min.css';
import './theme.css';
import './agent-core-language.css';
import './language.css';

createRoot(document.getElementById('root')).render(<Language />);
