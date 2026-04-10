import { useCallback, useMemo, useRef, useState } from 'react';
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { LayoutGrid, Maximize, MousePointer2, Plus } from 'lucide-react';

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
  const [, setForceUpdate] = useState(0);

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
  }, [setSelectedNodeId]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      contextMenuPos.current = pos;
      setForceUpdate((n) => n + 1);
    },
    [screenToFlowPosition],
  );

  const handleAddNode = useCallback(
    (type: Parameters<typeof addNode>[0]) => {
      addNode(type, contextMenuPos.current);
    },
    [addNode],
  );

  const handleSelectAll = useCallback(() => {
    onNodesChange(
      rfNodes.map((n) => ({ type: 'select' as const, id: n.id, selected: true })),
    );
  }, [onNodesChange, rfNodes]);

  const handleAutoLayout = useCallback(() => {
    const positions = computeAutoLayout(workflow.nodes, workflow.edges);
    updateTablePositions(positions);
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [workflow.nodes, workflow.edges, updateTablePositions, fitView]);

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 300 });
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
      <div className="relative flex-1">
        <ContextMenu>
          <ContextMenuTrigger className="h-full w-full block">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              onNodeClick={handleNodeClick}
              onPaneClick={handlePaneClick}
              onContextMenu={handleContextMenu}
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
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Plus className="size-4" />
                Add node
              </ContextMenuSubTrigger>
              <ContextMenuSubContent>
                {allNodeTypes.map((def) => {
                  const Icon = def.icon;
                  return (
                    <ContextMenuItem
                      key={def.type}
                      onSelect={() => handleAddNode(def.type)}
                    >
                      <Icon className="size-4" style={{ color: def.color }} />
                      {def.label}
                    </ContextMenuItem>
                  );
                })}
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={handleSelectAll}>
              <MousePointer2 className="size-4" />
              Select all
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleAutoLayout}>
              <LayoutGrid className="size-4" />
              Auto layout
            </ContextMenuItem>
            <ContextMenuItem onSelect={handleFitView}>
              <Maximize className="size-4" />
              Fit view
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <StatusBar />
    </div>
  );
}
