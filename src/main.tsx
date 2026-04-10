import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactFlowProvider } from '@xyflow/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';

// Register all node types (side-effect imports)
import '@/nodes/input';
import '@/nodes/output';
import '@/nodes/llm-call';
import '@/nodes/claude-cli';
import '@/nodes/condition';
import '@/nodes/loop';

import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactFlowProvider>
      <TooltipProvider delay={300}>
        <App />
        <Toaster position="bottom-center" />
      </TooltipProvider>
    </ReactFlowProvider>
  </StrictMode>,
);
