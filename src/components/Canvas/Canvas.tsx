import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ConnectionMode,
  SelectionMode,
  MarkerType,
  useReactFlow,
} from '@xyflow/react';
import type { Connection, NodeTypes, EdgeTypes, DefaultEdgeOptions } from '@xyflow/react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { WorkflowNode } from '@/components/WorkflowNode/WorkflowNode';
import { FlowEdge } from '@/components/FlowEdge/FlowEdge';
import { StatusBar } from '@/components/StatusBar/StatusBar';
import { getAllNodeTypes, getNodeType } from '@/nodes/registry';
import { computeAutoLayout } from '@/utils/auto-layout';
import { LayoutGrid, Maximize, MousePointer2 } from 'lucide-react';

const nodeTypes: NodeTypes = { workflow: WorkflowNode };
const edgeTypes: EdgeTypes = { flow: FlowEdge };

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'flow',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
};

export function Canvas() {
  const rfNodes = useWorkflowStore((s) => s.rfNodes);
  const rfEdges = useWorkflowStore((s) => s.rfEdges);
  const onNodesChange = useWorkflowStore((s) => s.onNodesChange);
  const onEdgesChange = useWorkflowStore((s) => s.onEdgesChange);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const addNode = useWorkflowStore((s) => s.addNode);
  const setSelectedNodeId = useWorkflowStore((s) => s.setSelectedNodeId);
  const updateTablePositions = useWorkflowStore((s) => s.updateTablePositions);
  const workflow = useWorkflowStore((s) => s.workflow);

  const { fitView, screenToFlowPosition } = useReactFlow();

  useKeyboardShortcuts();

  const contextMenuPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!menuPos) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPos(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuPos]);

  const handleConnect = useCallback(
    (connection: Connection) => {
      addEdge(connection.source, connection.target, connection.sourceHandle ?? undefined);
    },
    [addEdge],
  );

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: { id: string }) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId],
  );

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setMenuPos(null);
  }, [setSelectedNodeId]);

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent | MouseEvent) => {
      event.preventDefault();
      const pos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      contextMenuPos.current = pos;
      setMenuPos({ x: event.clientX, y: event.clientY });
    },
    [screenToFlowPosition],
  );

  const handleAddNode = useCallback(
    (type: Parameters<typeof addNode>[0]) => {
      addNode(type, contextMenuPos.current);
      setMenuPos(null);
    },
    [addNode],
  );

  const handleSelectAll = useCallback(() => {
    onNodesChange(
      rfNodes.map((n) => ({ type: 'select' as const, id: n.id, selected: true })),
    );
    setMenuPos(null);
  }, [onNodesChange, rfNodes]);

  const handleAutoLayout = useCallback(() => {
    const positions = computeAutoLayout(workflow.nodes, workflow.edges);
    updateTablePositions(positions);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
    setMenuPos(null);
  }, [workflow.nodes, workflow.edges, updateTablePositions, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
    setMenuPos(null);
  }, [fitView]);

  const allNodeTypes = useMemo(() => getAllNodeTypes(), []);

  const minimapNodeColor = useCallback(
    (node: { id: string }) => {
      const wfNode = workflow.nodes.find((n) => n.id === node.id);
      if (!wfNode) return '#94a3b8';
      const def = getNodeType(wfNode.type);
      return def?.color ?? '#94a3b8';
    },
    [workflow.nodes],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="relative flex-1" onContextMenu={(e) => e.preventDefault()}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={handleConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={40}
          selectionMode={SelectionMode.Partial}
          deleteKeyCode="Delete"
          minZoom={0.2}
          maxZoom={2}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={minimapNodeColor} zoomable pannable />
        </ReactFlow>
        {rfNodes.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm font-medium">No nodes yet</p>
              <p className="text-xs mt-1">Right-click to add a node, or use the toolbar above.</p>
            </div>
          </div>
        )}

        {/* Custom context menu */}
        {menuPos && (
            <div
              ref={menuRef}
              className="fixed z-50 min-w-[180px] rounded-lg border border-border bg-popover p-1 shadow-md"
              style={{
                left: Math.min(menuPos.x, window.innerWidth - 200),
                top: Math.min(menuPos.y, window.innerHeight - 380),
              }}
            >
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Add node</div>
              {allNodeTypes.map((def) => {
                const Icon = def.icon;
                return (
                  <button
                    key={def.type}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                    onClick={() => handleAddNode(def.type)}
                  >
                    <Icon className="size-4" style={{ color: def.color }} />
                    {def.label}
                  </button>
                );
              })}
              <div className="my-1 h-px bg-border" />
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                onClick={handleSelectAll}
              >
                <MousePointer2 className="size-4" />
                Select all
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                onClick={handleAutoLayout}
              >
                <LayoutGrid className="size-4" />
                Auto layout
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-popover-foreground hover:bg-accent"
                onClick={handleFitView}
              >
                <Maximize className="size-4" />
                Fit view
              </button>
            </div>
        )}
      </div>
      <StatusBar />
    </div>
  );
}
