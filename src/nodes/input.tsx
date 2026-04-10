import { Play } from 'lucide-react';
import { registerNodeType } from './registry';
import type { InputConfig, ValidationError } from '@/types/workflow';

function ConfigPanel({ config, onChange }: { config: InputConfig; onChange: (c: InputConfig) => void }) {
  const addVariable = () => {
    onChange({ ...config, variables: [...config.variables, { name: '', defaultValue: '' }] });
  };
  const updateVariable = (index: number, field: 'name' | 'defaultValue', value: string) => {
    const variables = config.variables.map((v, i) =>
      i === index ? { ...v, [field]: value } : v,
    );
    onChange({ ...config, variables });
  };
  const removeVariable = (index: number) => {
    onChange({ ...config, variables: config.variables.filter((_, i) => i !== index) });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Variables</label>
      {config.variables.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="flex-1 rounded bg-muted px-2 py-1 text-xs text-foreground outline-none"
            placeholder="name"
            value={v.name}
            onChange={(e) => updateVariable(i, 'name', e.target.value)}
          />
          <input
            className="flex-1 rounded bg-muted px-2 py-1 text-xs text-foreground outline-none"
            placeholder="default"
            value={v.defaultValue}
            onChange={(e) => updateVariable(i, 'defaultValue', e.target.value)}
          />
          <button className="text-xs text-muted-foreground hover:text-destructive" onClick={() => removeVariable(i)}>x</button>
        </div>
      ))}
      <button className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground" onClick={addVariable}>
        + Add variable
      </button>
    </div>
  );
}

function NodePreview({ config }: { config: InputConfig }) {
  if (config.variables.length === 0) return null;
  return (
    <div className="text-[10px] text-muted-foreground truncate">
      {config.variables.map((v) => v.name).filter(Boolean).join(', ') || 'No variables'}
    </div>
  );
}

registerNodeType<InputConfig>({
  type: 'input',
  label: 'Input',
  icon: Play,
  color: '#10b981',
  defaultConfig: () => ({ type: 'input', variables: [{ name: 'user_input', defaultValue: '' }] }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (config.variables.length === 0) {
      errors.push({ type: 'no-variables', severity: 'warning', nodeId, message: `"${nodeName}" has no input variables` });
    }
    const names = config.variables.map((v) => v.name).filter(Boolean);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    for (const d of new Set(dupes)) {
      errors.push({ type: 'duplicate-variable', severity: 'error', nodeId, message: `"${nodeName}" has duplicate variable "${d}"` });
    }
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [{ id: 'output', position: 'right' }],
  getInputHandles: () => [],
});
