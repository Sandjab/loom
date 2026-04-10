import { useEffect } from 'react';
import { Canvas } from '@/components/Canvas/Canvas';
import { Toolbar } from '@/components/Toolbar/Toolbar';
import { SidePanel } from '@/components/SidePanel/SidePanel';
import { useAutoSave, loadFromLocalStorage } from '@/hooks/useAutoSave';

export default function App() {
  useAutoSave();
  useEffect(() => { loadFromLocalStorage(); }, []);

  return (
    <div className="relative flex h-screen w-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <SidePanel />
      </div>
    </div>
  );
}
