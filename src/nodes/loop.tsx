import { Repeat } from 'lucide-react';
import { registerNodeType } from './registry';
import type { LoopConfig, ValidationError } from '@/types/workflow';

function ConfigPanel({ config, onChange }: { config: LoopConfig; onChange: (c: LoopConfig) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Iterable Expression</label>
        <textarea
          className="mt-1 min-h-[60px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y font-mono"
          placeholder='e.g., {{input_1.items}}'
          value={config.iterableExpression}
          onChange={(e) => onChange({ ...config, iterableExpression: e.target.value })}
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Item Variable</label>
        <input
          className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none font-mono"
          placeholder="item"
          value={config.itemVariable}
          onChange={(e) => onChange({ ...config, itemVariable: e.target.value })}
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Iterations</label>
        <input
          type="number"
          className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none"
          min={1}
          value={config.maxIterations}
          onChange={(e) => onChange({ ...config, maxIterations: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Two output branches: <span className="text-teal-500">Body</span> (loop iteration) and <span className="text-green-500">Done</span> (exit)
      </p>
    </div>
  );
}

function NodePreview({ config }: { config: LoopConfig }) {
  if (!config.iterableExpression) return null;
  return (
    <div className="text-[10px] text-muted-foreground truncate font-mono">
      {config.iterableExpression.slice(0, 35)} → {config.itemVariable}
    </div>
  );
}

registerNodeType<LoopConfig>({
  type: 'loop',
  label: 'Loop',
  icon: Repeat,
  color: '#14b8a6',
  defaultConfig: () => ({ type: 'loop', iterableExpression: '', itemVariable: 'item', maxIterations: 100 }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (!config.iterableExpression.trim()) {
      errors.push({ type: 'empty-iterable', severity: 'error', nodeId, message: `"${nodeName}" has no iterable expression` });
    }
    if (config.maxIterations > 1000) {
      errors.push({ type: 'high-max-iterations', severity: 'warning', nodeId, message: `"${nodeName}" has a very high max iterations (${config.maxIterations})` });
    }
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [
    { id: 'body', label: '↻', position: 'right' },
    { id: 'done', label: '✓', position: 'right' },
  ],
  getInputHandles: () => [{ id: 'input', position: 'left' }],
});
