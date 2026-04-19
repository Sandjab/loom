import { useState, useMemo, useCallback } from 'react';
import { useStore, useReactFlow } from '@xyflow/react';
import type { ReactFlowState } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { validateWorkflow } from '@/utils/validate';
import { AlertTriangle, XCircle, ChevronUp, ChevronDown } from 'lucide-react';
import type { ValidationError } from '@/types/workflow';

const zoomSelector = (s: ReactFlowState) => Math.round((s.panZoom?.getViewport().zoom ?? 1) * 100);

export function StatusBar() {
  const workflow = useWorkflowStore((s) => s.workflow);
  const rfNodes = useWorkflowStore((s) => s.rfNodes);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const zoom = useStore(zoomSelector);
  const { setViewport, getViewport, setCenter } = useReactFlow();

  const [showErrors, setShowErrors] = useState(false);

  const selectedCount = rfNodes.filter((n) => n.selected).length;
  const nodeCount = workflow.nodes.length;
  const edgeCount = workflow.edges.length;

  const errors = useMemo(
    () => validateWorkflow(workflow.nodes, workflow.edges),
    [workflow.nodes, workflow.edges],
  );

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;

  const handleResetZoom = useCallback(() => {
    const vp = getViewport();
    setViewport({ x: vp.x, y: vp.y, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport]);

  const handleErrorClick = useCallback(
    (err: ValidationError) => {
      if (!err.nodeId) return;
      const node = workflow.nodes.find((n) => n.id === err.nodeId);
      if (!node) return;
      setSelectedNodeId(err.nodeId);
      setCenter(node.position.x + 100, node.position.y + 30, { zoom: 1, duration: 300 });
    },
    [workflow.nodes, setSelectedNodeId, setCenter],
  );

  const toggleErrors = useCallback(() => {
    setShowErrors((v) => !v);
  }, []);

  return (
    <div className="flex flex-col">
      {/* Expandable validation panel */}
      {showErrors && errors.length > 0 && (
        <div className="max-h-40 overflow-y-auto border-t border-border bg-card px-2 py-1">
          {errors.map((err, i) => (
            <button
              key={i}
              className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left text-xs hover:bg-muted"
              onClick={() => handleErrorClick(err)}
            >
              {err.severity === 'error' ? (
                <XCircle className="size-3 shrink-0 text-destructive" />
              ) : (
                <AlertTriangle className="size-3 shrink-0 text-amber-500" />
              )}
              <span className="truncate text-foreground">{err.message}</span>
            </button>
          ))}
        </div>
      )}

      {/* Status bar */}
      <div className="flex h-6 items-center gap-3 border-t border-border bg-card px-2 text-[11px] text-muted-foreground">
        <span>
          {nodeCount} node{nodeCount !== 1 ? 's' : ''}
        </span>
        <span>
          {edgeCount} edge{edgeCount !== 1 ? 's' : ''}
        </span>
        {selectedCount > 0 && (
          <span>
            {selectedCount} selected
          </span>
        )}

        {(errorCount > 0 || warningCount > 0) && (
          <button
            className="ml-auto flex items-center gap-1.5 hover:text-foreground"
            onClick={toggleErrors}
          >
            {errorCount > 0 && (
              <span className="flex items-center gap-0.5 text-destructive">
                <XCircle className="size-3" />
                {errorCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="flex items-center gap-0.5 text-amber-500">
                <AlertTriangle className="size-3" />
                {warningCount}
              </span>
            )}
            {showErrors ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronUp className="size-3" />
            )}
          </button>
        )}

        <button
          className={`${errorCount === 0 && warningCount === 0 ? 'ml-auto' : ''} tabular-nums hover:text-foreground`}
          onClick={handleResetZoom}
          title="Click to reset to 100%"
        >
          {zoom}%
        </button>
      </div>
    </div>
  );
}
