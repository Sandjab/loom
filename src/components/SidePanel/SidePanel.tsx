import { useCallback } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { getNodeType } from '@/nodes/registry';
import { X } from 'lucide-react';
import type { NodeConfig } from '@/types/workflow';

export function SidePanel() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.workflow.nodes);
  const updateNodeConfig = useWorkflowStore((s) => s.updateNodeConfig);
  const updateNodeName = useWorkflowStore((s) => s.updateNodeName);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);

  const node = selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null;
  const def = node ? getNodeType(node.type) : null;

  const handleConfigChange = useCallback(
    (config: NodeConfig) => {
      if (selectedNodeId) updateNodeConfig(selectedNodeId, config);
    },
    [selectedNodeId, updateNodeConfig],
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedNodeId) updateNodeName(selectedNodeId, e.target.value);
    },
    [selectedNodeId, updateNodeName],
  );

  const handleClose = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  if (!node || !def) return null;

  const Icon = def.icon;
  const ConfigPanel = def.ConfigPanel;

  return (
    <div className="w-72 shrink-0 border-l border-border bg-card overflow-y-auto flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Icon className="size-4 shrink-0" style={{ color: def.color }} />
        <input
          className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground outline-none"
          value={node.name}
          onChange={handleNameChange}
        />
        <button
          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={handleClose}
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Config */}
      <div className="flex-1 p-3">
        <ConfigPanel config={node.config} onChange={handleConfigChange} />
      </div>
    </div>
  );
}
