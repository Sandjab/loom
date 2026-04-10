import { useEffect, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useUndoRedo } from './useUndoRedo';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { exportWorkflowJSON } from '@/utils/export-json';
import { downloadText } from '@/utils/download';
import { saveCurrentWorkflow, getRecentList } from '@/hooks/useAutoSave';
import { dedupName } from '@/utils/naming';
import { isMac } from '@/utils/platform';
import { toast } from 'sonner';
import type { Workflow } from '@/types/workflow';

export function useKeyboardShortcuts() {
  const { undo, redo } = useUndoRedo();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (mod) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) redo();
            else undo();
            break;
          case 'y':
            if (!isMac) { e.preventDefault(); redo(); }
            break;
          case 'd': {
            e.preventDefault();
            const selectedIds = useWorkflowStore.getState().rfNodes
              .filter((n) => n.selected)
              .map((n) => n.id);
            if (selectedIds.length > 0) {
              useWorkflowStore.getState().duplicateNodes(selectedIds);
            }
            break;
          }
          case 's': {
            e.preventDefault();
            const { workflow } = useWorkflowStore.getState();
            const json = exportWorkflowJSON(workflow);
            downloadText(json, `${workflow.name}.loom.json`, 'application/json');
            toast(`Saved ${workflow.name}.loom.json`);
            break;
          }
          case 'o': {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.loom.json,.json';
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => {
                try {
                  saveCurrentWorkflow();
                  const workflow: Workflow = JSON.parse(reader.result as string);
                  const existingNames = getRecentList().map((e) => e.name);
                  const safeName = dedupName(workflow.name, existingNames);
                  useWorkflowStore.getState().loadWorkflow({ ...workflow, name: safeName });
                  fitView({ padding: 0.2, duration: 300 });
                  toast('Previous workflow available in recents');
                } catch (err) {
                  toast.error(`Load failed: ${err instanceof Error ? err.message : 'Invalid file'}`);
                }
              };
              reader.readAsText(file);
            };
            input.click();
            break;
          }
          case 'a':
            e.preventDefault();
            useWorkflowStore.getState().onNodesChange(
              useWorkflowStore.getState().rfNodes.map((n) => ({
                type: 'select' as const,
                id: n.id,
                selected: true,
              })),
            );
            break;
          case '=':
          case '+':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
            e.preventDefault();
            zoomOut();
            break;
          case '0':
            e.preventDefault();
            fitView({ padding: 0.2 });
            break;
        }
      }
    },
    [undo, redo, zoomIn, zoomOut, fitView],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
