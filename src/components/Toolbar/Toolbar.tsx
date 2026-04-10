import { useCallback, useMemo } from 'react';
import { useReactFlow } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useUndoRedo } from '@/hooks/useUndoRedo';
import { useTheme } from '@/hooks/useTheme';
import { validateWorkflow } from '@/utils/validate';
import { computeAutoLayout } from '@/utils/auto-layout';
import { exportWorkflowJSON } from '@/utils/export-json';
import { downloadText } from '@/utils/download';
import { saveCurrentWorkflow } from '@/hooks/useAutoSave';
import { getAllNodeTypes } from '@/nodes/registry';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Undo2,
  Redo2,
  LayoutGrid,
  ShieldCheck,
  Save,
  Download,
  Sun,
  Moon,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';

export function Toolbar() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const setWorkflowName = useWorkflowStore((s) => s.setWorkflowName);
  const addNode = useWorkflowStore((s) => s.addNode);
  const updateTablePositions = useWorkflowStore((s) => s.updateTablePositions);

  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const { theme, toggleTheme } = useTheme();
  const { fitView } = useReactFlow();

  const allNodeTypes = useMemo(() => getAllNodeTypes(), []);

  const handleAddNode = useCallback(
    (type: Parameters<typeof addNode>[0]) => {
      addNode(type, { x: 100, y: 100 });
    },
    [addNode],
  );

  const handleAutoLayout = useCallback(() => {
    const positions = computeAutoLayout(workflow.nodes, workflow.edges);
    updateTablePositions(positions);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [workflow.nodes, workflow.edges, updateTablePositions, fitView]);

  const handleValidate = useCallback(() => {
    const errors = validateWorkflow(workflow.nodes, workflow.edges);
    if (errors.length === 0) {
      toast.success('Workflow is valid');
    } else {
      const errorCount = errors.filter((e) => e.severity === 'error').length;
      const warnCount = errors.filter((e) => e.severity === 'warning').length;
      const parts: string[] = [];
      if (errorCount > 0) parts.push(`${errorCount} error${errorCount > 1 ? 's' : ''}`);
      if (warnCount > 0) parts.push(`${warnCount} warning${warnCount > 1 ? 's' : ''}`);
      toast.warning(`Validation: ${parts.join(', ')}`);
    }
  }, [workflow.nodes, workflow.edges]);

  const handleSave = useCallback(() => {
    saveCurrentWorkflow();
    toast.success(`Saved "${workflow.name}"`);
  }, [workflow.name]);

  const handleExport = useCallback(() => {
    const json = exportWorkflowJSON(workflow);
    downloadText(json, `${workflow.name}.loom.json`, 'application/json');
    toast(`Exported ${workflow.name}.loom.json`);
  }, [workflow]);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWorkflowName(e.target.value);
    },
    [setWorkflowName],
  );

  return (
    <div className="flex h-10 items-center gap-1 border-b border-border bg-card px-2">
      {/* Workflow name */}
      <input
        className="h-7 w-36 rounded bg-transparent px-1.5 text-sm font-medium text-foreground outline-none hover:bg-muted focus:bg-muted"
        value={workflow.name}
        onChange={handleNameChange}
      />

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Add node */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add node
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {allNodeTypes.map((def) => {
            const Icon = def.icon;
            return (
              <DropdownMenuItem key={def.type} onSelect={() => handleAddNode(def.type)}>
                <Icon className="size-4" style={{ color: def.color }} />
                {def.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Undo / Redo */}
      <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!canUndo} title="Undo">
        <Undo2 />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!canRedo} title="Redo">
        <Redo2 />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Auto layout */}
      <Button variant="ghost" size="icon-sm" onClick={handleAutoLayout} title="Auto layout">
        <LayoutGrid />
      </Button>

      {/* Validate */}
      <Button variant="ghost" size="icon-sm" onClick={handleValidate} title="Validate">
        <ShieldCheck />
      </Button>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Save */}
      <Button variant="ghost" size="icon-sm" onClick={handleSave} title="Save to browser">
        <Save />
      </Button>

      {/* Export */}
      <Button variant="ghost" size="icon-sm" onClick={handleExport} title="Export JSON">
        <Download />
      </Button>

      <div className="flex-1" />

      {/* Theme toggle */}
      <Button variant="ghost" size="icon-sm" onClick={toggleTheme} title="Toggle theme">
        {theme === 'dark' ? <Sun /> : <Moon />}
      </Button>
    </div>
  );
}
