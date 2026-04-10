import { GitBranch } from 'lucide-react';
import { registerNodeType } from './registry';
import type { ConditionConfig, ValidationError } from '@/types/workflow';

function ConfigPanel({ config, onChange }: { config: ConditionConfig; onChange: (c: ConditionConfig) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Condition Expression</label>
        <textarea className="mt-1 min-h-[60px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y font-mono" placeholder='e.g., {{summarize.output.length}} > 500' value={config.expression} onChange={(e) => onChange({ ...config, expression: e.target.value })} />
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Two output branches: <span className="text-green-500">True</span> and <span className="text-red-500">False</span>
      </p>
    </div>
  );
}

function NodePreview({ config }: { config: ConditionConfig }) {
  if (!config.expression) return null;
  return <div className="text-[10px] text-muted-foreground truncate font-mono">{config.expression.slice(0, 40)}</div>;
}

registerNodeType<ConditionConfig>({
  type: 'condition',
  label: 'Condition',
  icon: GitBranch,
  color: '#f59e0b',
  defaultConfig: () => ({ type: 'condition', expression: '' }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (!config.expression.trim()) errors.push({ type: 'empty-expression', severity: 'error', nodeId, message: `"${nodeName}" has no condition expression` });
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [
    { id: 'true', label: '\u2713', position: 'right' },
    { id: 'false', label: '\u2717', position: 'right' },
  ],
  getInputHandles: () => [{ id: 'input', position: 'left' }],
});
