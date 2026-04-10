import { Brain } from 'lucide-react';
import { registerNodeType } from './registry';
import type { LlmCallConfig, ValidationError } from '@/types/workflow';

function ConfigPanel({ config, onChange }: { config: LlmCallConfig; onChange: (c: LlmCallConfig) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</label>
        <select className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.model} onChange={(e) => onChange({ ...config, model: e.target.value })}>
          <option value="opus">opus</option>
          <option value="sonnet">sonnet</option>
          <option value="haiku">haiku</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Temperature</label>
        <div className="mt-1 flex items-center gap-2">
          <input type="range" min="0" max="1" step="0.1" className="flex-1" value={config.temperature} onChange={(e) => onChange({ ...config, temperature: Number(e.target.value) })} />
          <span className="w-6 text-right text-xs text-muted-foreground">{config.temperature}</span>
        </div>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">System Prompt</label>
        <textarea className="mt-1 min-h-[60px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y" value={config.systemPrompt} onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">User Prompt Template</label>
        <textarea className="mt-1 min-h-[60px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y" placeholder="Use {{node_name.output}} for variable interpolation" value={config.userPromptTemplate} onChange={(e) => onChange({ ...config, userPromptTemplate: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Tokens</label>
        <input type="number" className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.maxTokens} onChange={(e) => onChange({ ...config, maxTokens: Number(e.target.value) })} />
      </div>
    </div>
  );
}

function NodePreview({ config }: { config: LlmCallConfig }) {
  return (
    <div className="text-[10px] text-muted-foreground space-y-0.5">
      <div><span className="opacity-50">Model:</span> {config.model} · <span className="opacity-50">T:</span> {config.temperature}</div>
      {config.userPromptTemplate && <div className="truncate"><span className="opacity-50">Prompt:</span> {config.userPromptTemplate.slice(0, 40)}</div>}
    </div>
  );
}

registerNodeType<LlmCallConfig>({
  type: 'llm-call',
  label: 'LLM Call',
  icon: Brain,
  color: '#7c3aed',
  defaultConfig: () => ({ type: 'llm-call', systemPrompt: '', userPromptTemplate: '', model: 'sonnet', temperature: 0.7, maxTokens: 1024 }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (!config.userPromptTemplate.trim()) errors.push({ type: 'empty-prompt', severity: 'error', nodeId, message: `"${nodeName}" has no user prompt template` });
    if (!config.model.trim()) errors.push({ type: 'no-model', severity: 'error', nodeId, message: `"${nodeName}" has no model selected` });
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [{ id: 'output', position: 'right' }],
  getInputHandles: () => [{ id: 'input', position: 'left' }],
});
