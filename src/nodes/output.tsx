import { Square } from 'lucide-react';
import { registerNodeType } from './registry';
import type { OutputConfig, ValidationError } from '@/types/workflow';

function ConfigPanel({ config, onChange }: { config: OutputConfig; onChange: (c: OutputConfig) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Output Template</label>
      <textarea
        className="min-h-[80px] rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y"
        placeholder="{{node_name.output}}"
        value={config.template}
        onChange={(e) => onChange({ ...config, template: e.target.value })}
      />
    </div>
  );
}

function NodePreview({ config }: { config: OutputConfig }) {
  if (!config.template) return null;
  return (
    <div className="text-[10px] text-muted-foreground truncate">
      {config.template.slice(0, 40)}{config.template.length > 40 ? '...' : ''}
    </div>
  );
}

registerNodeType<OutputConfig>({
  type: 'output',
  label: 'Output',
  icon: Square,
  color: '#3b82f6',
  defaultConfig: () => ({ type: 'output', template: '{{previous.output}}' }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (!config.template.trim()) {
      errors.push({ type: 'empty-template', severity: 'warning', nodeId, message: `"${nodeName}" has an empty output template` });
    }
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [],
  getInputHandles: () => [{ id: 'input', position: 'left' }],
});
