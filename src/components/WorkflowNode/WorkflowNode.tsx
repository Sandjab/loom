import { memo, useCallback } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '@/types/workflow';
import { getNodeType } from '@/nodes/registry';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { ChevronDown, ChevronRight } from 'lucide-react';

function WorkflowNodeInner({ id, data, selected }: NodeProps) {
  const nodeData = data as WorkflowNodeData;
  const node = nodeData.node;
  const def = getNodeType(node.type);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const toggleNodeCollapse = useWorkflowStore((s) => s.toggleNodeCollapse);

  const handleClick = useCallback(() => {
    setSelectedNodeId(id);
  }, [id, setSelectedNodeId]);

  const handleToggleCollapse = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleNodeCollapse(id);
    },
    [id, toggleNodeCollapse],
  );

  if (!def) return null;

  const Icon = def.icon;
  const inputHandles = def.getInputHandles(node.config);
  const outputHandles = def.getOutputHandles(node.config);
  const Preview = def.NodePreview;

  return (
    <div
      onClick={handleClick}
      className="relative min-w-[180px] max-w-[260px] rounded-lg bg-card text-card-foreground shadow-sm border border-border"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: def.color,
        boxShadow: selected ? `0 0 0 2px ${def.color}` : undefined,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          className="flex items-center justify-center text-muted-foreground hover:text-foreground"
          onClick={handleToggleCollapse}
        >
          {node.collapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronDown className="size-3.5" />
          )}
        </button>
        <Icon className="size-3.5 shrink-0" style={{ color: def.color }} />
        <span className="text-xs font-medium truncate">{node.name}</span>
      </div>

      {/* Preview when expanded */}
      {!node.collapsed && (
        <div className="border-t border-border px-2 py-1.5">
          <Preview config={node.config} />
        </div>
      )}

      {/* Input handles */}
      {inputHandles.map((h, i) => (
        <Handle
          key={h.id}
          type="target"
          position={Position.Left}
          id={h.id}
          style={{
            top: inputHandles.length === 1 ? '50%' : `${((i + 1) / (inputHandles.length + 1)) * 100}%`,
            width: 8,
            height: 8,
            background: '#94a3b8',
            border: '2px solid var(--color-card)',
          }}
        />
      ))}

      {/* Output handles */}
      {outputHandles.map((h, i) => {
        const handleColor =
          node.type === 'condition' && h.id === 'true' ? '#22c55e' :
          node.type === 'condition' && h.id === 'false' ? '#ef4444' :
          node.type === 'loop' && h.id === 'body' ? '#14b8a6' :
          node.type === 'loop' && h.id === 'done' ? '#22c55e' :
          '#94a3b8';

        return (
          <div key={h.id}>
            <Handle
              type="source"
              position={Position.Right}
              id={h.id}
              style={{
                top:
                  outputHandles.length === 1
                    ? '50%'
                    : `${((i + 1) / (outputHandles.length + 1)) * 100}%`,
                width: 8,
                height: 8,
                background: handleColor,
                border: '2px solid var(--color-card)',
              }}
            />
            {h.label && (
              <span
                className="absolute text-[9px] font-medium pointer-events-none select-none"
                style={{
                  right: -4,
                  top:
                    outputHandles.length === 1
                      ? '50%'
                      : `${((i + 1) / (outputHandles.length + 1)) * 100}%`,
                  transform: 'translate(100%, -50%)',
                  color: handleColor,
                }}
              >
                {h.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeInner);
