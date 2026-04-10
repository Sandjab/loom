import { Terminal } from 'lucide-react';
import { registerNodeType } from './registry';
import type { ClaudeCliConfig, McpServerConfig, ValidationError } from '@/types/workflow';

function McpServerRow({ server, onChange, onRemove }: { server: McpServerConfig; onChange: (s: McpServerConfig) => void; onRemove: () => void }) {
  return (
    <div className="flex flex-col gap-1 rounded border border-border p-2">
      <div className="flex items-center gap-1">
        <input className="flex-1 rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground outline-none" placeholder="Server name" value={server.name} onChange={(e) => onChange({ ...server, name: e.target.value })} />
        <button className="text-[10px] text-muted-foreground hover:text-destructive" onClick={onRemove}>x</button>
      </div>
      <input className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground outline-none" placeholder="command (e.g., npx)" value={server.command} onChange={(e) => onChange({ ...server, command: e.target.value })} />
      <input className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-foreground outline-none" placeholder="args (comma-separated)" value={server.args.join(', ')} onChange={(e) => onChange({ ...server, args: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
    </div>
  );
}

function ConfigPanel({ config, onChange }: { config: ClaudeCliConfig; onChange: (c: ClaudeCliConfig) => void }) {
  const addServer = () => onChange({ ...config, mcpServers: [...config.mcpServers, { name: '', command: '', args: [] }] });
  const updateServer = (i: number, s: McpServerConfig) => onChange({ ...config, mcpServers: config.mcpServers.map((srv, idx) => idx === i ? s : srv) });
  const removeServer = (i: number) => onChange({ ...config, mcpServers: config.mcpServers.filter((_, idx) => idx !== i) });

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</label>
        <select className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.model} onChange={(e) => onChange({ ...config, model: e.target.value as ClaudeCliConfig['model'] })}>
          <option value="opus">opus</option>
          <option value="sonnet">sonnet</option>
          <option value="haiku">haiku</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Prompt</label>
        <textarea className="mt-1 min-h-[60px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y" placeholder="Use {{node_name.output}} for variable interpolation" value={config.prompt} onChange={(e) => onChange({ ...config, prompt: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">System Prompt</label>
        <textarea className="mt-1 min-h-[40px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y" value={config.systemPrompt} onChange={(e) => onChange({ ...config, systemPrompt: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Output Format</label>
        <select className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.outputFormat} onChange={(e) => onChange({ ...config, outputFormat: e.target.value as ClaudeCliConfig['outputFormat'] })}>
          <option value="text">text</option>
          <option value="json">json</option>
          <option value="stream-json">stream-json</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Turns</label>
        <input type="number" className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.maxTurns} onChange={(e) => onChange({ ...config, maxTurns: Number(e.target.value) })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Permission Mode</label>
        <select className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" value={config.permissionMode} onChange={(e) => onChange({ ...config, permissionMode: e.target.value as ClaudeCliConfig['permissionMode'] })}>
          <option value="default">default</option>
          <option value="acceptEdits">acceptEdits</option>
          <option value="bypassPermissions">bypassPermissions</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Allowed Tools</label>
        <input className="mt-1 w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none" placeholder="Comma-separated tool names" value={config.allowedTools.join(', ')} onChange={(e) => onChange({ ...config, allowedTools: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Append System Prompt</label>
        <textarea className="mt-1 min-h-[40px] w-full rounded bg-muted px-2 py-1.5 text-xs text-foreground outline-none resize-y" value={config.appendSystemPrompt} onChange={(e) => onChange({ ...config, appendSystemPrompt: e.target.value })} />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-wider text-muted-foreground">MCP Servers</label>
        <div className="mt-1 flex flex-col gap-2">
          {config.mcpServers.map((s, i) => <McpServerRow key={i} server={s} onChange={(u) => updateServer(i, u)} onRemove={() => removeServer(i)} />)}
          <button className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground hover:text-foreground" onClick={addServer}>+ Add MCP server</button>
        </div>
      </div>
    </div>
  );
}

function NodePreview({ config }: { config: ClaudeCliConfig }) {
  return (
    <div className="text-[10px] text-muted-foreground space-y-0.5">
      <div><span className="opacity-50">Model:</span> {config.model}</div>
      {config.prompt && <div className="truncate"><span className="opacity-50">Prompt:</span> {config.prompt.slice(0, 40)}</div>}
    </div>
  );
}

registerNodeType<ClaudeCliConfig>({
  type: 'claude-cli',
  label: 'Claude CLI',
  icon: Terminal,
  color: '#d97706',
  defaultConfig: () => ({ type: 'claude-cli', prompt: '', systemPrompt: '', model: 'sonnet', mcpServers: [], allowedTools: [], maxTurns: 10, outputFormat: 'text', appendSystemPrompt: '', permissionMode: 'default' }),
  validate: (config, nodeId, nodeName) => {
    const errors: ValidationError[] = [];
    if (!config.prompt.trim()) errors.push({ type: 'empty-prompt', severity: 'error', nodeId, message: `"${nodeName}" has no prompt` });
    return errors;
  },
  ConfigPanel,
  NodePreview,
  getOutputHandles: () => [{ id: 'output', position: 'right' }],
  getInputHandles: () => [{ id: 'input', position: 'left' }],
});
