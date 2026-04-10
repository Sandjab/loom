import { create } from 'zustand';
import { temporal } from 'zundo';
import {
  applyNodeChanges,
  applyEdgeChanges,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
} from '@xyflow/react';
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowNodeData,
  NodeConfig,
  NodeType,
} from '@/types/workflow';
import { createNodeId, createEdgeId, createWorkflowId } from '@/utils/id';
import { nextAvailableName } from '@/utils/naming';
import { getNodeType } from '@/nodes/registry';
import { detectBackEdges } from '@/utils/auto-layout';

// --- Derived state builders ---

function buildRfNodes(nodes: WorkflowNode[]): Node<WorkflowNodeData>[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'workflow',
    position: node.position,
    data: { node },
  }));
}

function buildRfEdges(edges: WorkflowEdge[], nodes?: WorkflowNode[]): Edge[] {
  const backEdgeIds = nodes ? detectBackEdges(nodes, edges) : new Set<string>();
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    type: 'flow',
    data: { isBackEdge: backEdgeIds.has(edge.id) },
  }));
}

// --- Store interface ---

export interface WorkflowState {
  workflow: Workflow;
  rfNodes: Node<WorkflowNodeData>[];
  rfEdges: Edge[];
  selectedNodeId: string | null;

  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;

  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  removeNodes: (ids: string[]) => void;
  updateNodeConfig: (id: string, config: NodeConfig) => void;
  updateNodeName: (id: string, name: string) => void;
  toggleNodeCollapse: (id: string) => void;
  duplicateNodes: (ids: string[]) => void;
  setSelectedNodeId: (id: string | null) => void;

  addEdge: (source: string, target: string, sourceHandle?: string) => void;
  removeEdges: (ids: string[]) => void;

  updateTablePositions: (positions: Map<string, { x: number; y: number }>) => void;
  loadWorkflow: (workflow: Workflow) => void;
  newWorkflow: () => void;
  setWorkflowName: (name: string) => void;
  rebuildRfState: () => void;
}

function createEmptyWorkflow(): Workflow {
  return {
    id: createWorkflowId(),
    name: 'Untitled',
    version: 1,
    nodes: [],
    edges: [],
  };
}

// --- Store ---

export const useWorkflowStore = create<WorkflowState>()(
  temporal(
    (set, get) => ({
      workflow: createEmptyWorkflow(),
      rfNodes: [],
      rfEdges: [],
      selectedNodeId: null,

      onNodesChange: (changes: NodeChange[]) => {
        const removedIds = new Set(
          changes.filter((c) => c.type === 'remove').map((c) => c.id),
        );
        if (removedIds.size > 0) {
          get().removeNodes([...removedIds]);
          const remaining = changes.filter((c) => c.type !== 'remove');
          if (remaining.length === 0) return;
          changes = remaining;
        }

        set((state) => {
          const updatedRfNodes = applyNodeChanges(changes, state.rfNodes) as Node<WorkflowNodeData>[];

          const hasPositionChanges = changes.some(
            (c) => c.type === 'position' && 'position' in c && c.position,
          );
          if (!hasPositionChanges) {
            return { rfNodes: updatedRfNodes };
          }

          const movedIds = new Set(
            changes
              .filter((c): c is NodeChange & { id: string } =>
                c.type === 'position' && 'id' in c && 'position' in c && !!c.position,
              )
              .map((c) => c.id),
          );
          const updatedNodes = state.workflow.nodes.map((node) => {
            if (!movedIds.has(node.id)) return node;
            const rfNode = updatedRfNodes.find((n) => n.id === node.id);
            return rfNode ? { ...node, position: rfNode.position } : node;
          });

          return {
            rfNodes: updatedRfNodes,
            workflow: { ...state.workflow, nodes: updatedNodes },
          };
        });
      },

      onEdgesChange: (changes: EdgeChange[]) => {
        const removedIds = changes.filter((c) => c.type === 'remove').map((c) => c.id);
        if (removedIds.length > 0) {
          get().removeEdges(removedIds);
          const remaining = changes.filter((c) => c.type !== 'remove');
          if (remaining.length === 0) return;
          changes = remaining;
        }
        set((state) => ({
          rfEdges: applyEdgeChanges(changes, state.rfEdges),
        }));
      },

      addNode: (type, position) => {
        const id = createNodeId();
        const def = getNodeType(type);
        if (!def) return id;
        const existingNames = get().workflow.nodes.map((n) => n.name);
        const name = nextAvailableName(`${def.label.replace(/\s+/g, '_').toLowerCase()}_`, existingNames);
        const node: WorkflowNode = {
          id,
          type,
          name,
          position,
          config: def.defaultConfig(),
          collapsed: true,
        };
        const rfNode: Node<WorkflowNodeData> = {
          id,
          type: 'workflow',
          position,
          data: { node },
        };
        set((state) => ({
          workflow: {
            ...state.workflow,
            nodes: [...state.workflow.nodes, node],
          },
          rfNodes: [...state.rfNodes, rfNode],
        }));
        return id;
      },

      removeNodes: (ids) => {
        const idSet = new Set(ids);
        set((state) => {
          const updatedNodes = state.workflow.nodes.filter((n) => !idSet.has(n.id));
          const updatedEdges = state.workflow.edges.filter(
            (e) => !idSet.has(e.source) && !idSet.has(e.target),
          );
          return {
            workflow: { ...state.workflow, nodes: updatedNodes, edges: updatedEdges },
            rfNodes: state.rfNodes.filter((n) => !idSet.has(n.id)),
            rfEdges: buildRfEdges(updatedEdges, updatedNodes),
            selectedNodeId: state.selectedNodeId && idSet.has(state.selectedNodeId) ? null : state.selectedNodeId,
          };
        });
      },

      updateNodeConfig: (id, config) => {
        set((state) => {
          const updatedNodes = state.workflow.nodes.map((n) =>
            n.id === id ? { ...n, config } : n,
          );
          const updatedNode = updatedNodes.find((n) => n.id === id);
          return {
            workflow: { ...state.workflow, nodes: updatedNodes },
            rfNodes: state.rfNodes.map((rn) =>
              rn.id === id && updatedNode ? { ...rn, data: { node: updatedNode } } : rn,
            ),
          };
        });
      },

      updateNodeName: (id, name) => {
        set((state) => {
          const updatedNodes = state.workflow.nodes.map((n) =>
            n.id === id ? { ...n, name } : n,
          );
          const updatedNode = updatedNodes.find((n) => n.id === id);
          return {
            workflow: { ...state.workflow, nodes: updatedNodes },
            rfNodes: state.rfNodes.map((rn) =>
              rn.id === id && updatedNode ? { ...rn, data: { node: updatedNode } } : rn,
            ),
          };
        });
      },

      toggleNodeCollapse: (id) => {
        set((state) => {
          const updatedNodes = state.workflow.nodes.map((n) =>
            n.id === id ? { ...n, collapsed: !n.collapsed } : n,
          );
          const updatedNode = updatedNodes.find((n) => n.id === id);
          return {
            workflow: { ...state.workflow, nodes: updatedNodes },
            rfNodes: state.rfNodes.map((rn) =>
              rn.id === id && updatedNode ? { ...rn, data: { node: updatedNode } } : rn,
            ),
          };
        });
      },

      duplicateNodes: (ids) => {
        const state = get();
        for (const id of ids) {
          const original = state.workflow.nodes.find((n) => n.id === id);
          if (!original) continue;
          const newId = createNodeId();
          const node: WorkflowNode = {
            ...original,
            id: newId,
            name: `${original.name}_copy`,
            position: { x: original.position.x + 50, y: original.position.y + 50 },
          };
          const rfNode: Node<WorkflowNodeData> = {
            id: newId,
            type: 'workflow',
            position: node.position,
            data: { node },
          };
          set((s) => ({
            workflow: { ...s.workflow, nodes: [...s.workflow.nodes, node] },
            rfNodes: [...s.rfNodes, rfNode],
          }));
        }
      },

      setSelectedNodeId: (id) => {
        set({ selectedNodeId: id });
      },

      addEdge: (source, target, sourceHandle) => {
        const id = createEdgeId();
        const edge: WorkflowEdge = { id, source, target, sourceHandle };
        set((state) => {
          const newEdges = [...state.workflow.edges, edge];
          return {
            workflow: { ...state.workflow, edges: newEdges },
            rfEdges: buildRfEdges(newEdges, state.workflow.nodes),
          };
        });
      },

      removeEdges: (ids) => {
        const idSet = new Set(ids);
        set((state) => {
          const newEdges = state.workflow.edges.filter((e) => !idSet.has(e.id));
          return {
            workflow: { ...state.workflow, edges: newEdges },
            rfEdges: buildRfEdges(newEdges, state.workflow.nodes),
          };
        });
      },

      updateTablePositions: (positions) => {
        set((state) => {
          const updatedNodes = state.workflow.nodes.map((n) => {
            const pos = positions.get(n.id);
            return pos ? { ...n, position: pos } : n;
          });
          return {
            workflow: { ...state.workflow, nodes: updatedNodes },
            rfNodes: buildRfNodes(updatedNodes),
          };
        });
      },

      loadWorkflow: (workflow) => {
        set({
          workflow,
          rfNodes: buildRfNodes(workflow.nodes),
          rfEdges: buildRfEdges(workflow.edges, workflow.nodes),
          selectedNodeId: null,
        });
        useWorkflowStore.temporal.getState().clear();
      },

      newWorkflow: () => {
        const workflow = createEmptyWorkflow();
        set({
          workflow,
          rfNodes: [],
          rfEdges: [],
          selectedNodeId: null,
        });
        useWorkflowStore.temporal.getState().clear();
      },

      setWorkflowName: (name) => {
        set((state) => ({
          workflow: { ...state.workflow, name },
        }));
      },

      rebuildRfState: () => {
        set((state) => ({
          rfNodes: buildRfNodes(state.workflow.nodes),
          rfEdges: buildRfEdges(state.workflow.edges, state.workflow.nodes),
        }));
      },
    }),
    {
      partialize: (state) => ({
        nodes: state.workflow.nodes,
        edges: state.workflow.edges,
      }),
      equality: (pastState, currentState) =>
        pastState.nodes === currentState.nodes &&
        pastState.edges === currentState.edges,
      limit: 100,
    },
  ),
);
