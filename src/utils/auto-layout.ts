import dagre from '@dagrejs/dagre';
import type { WorkflowNode, WorkflowEdge } from '@/types/workflow';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 60;

/**
 * Detect edges that go back to a Loop node, forming an intentional cycle.
 * A "loop back-edge" is an edge whose target is a Loop node AND whose source
 * is reachable from that Loop node (i.e., it actually closes a cycle).
 */
export function detectBackEdges(nodes: WorkflowNode[], edges: WorkflowEdge[]): Set<string> {
  const backEdgeIds = new Set<string>();
  const adj = new Map<string, WorkflowEdge[]>();
  for (const e of edges) {
    const list = adj.get(e.source) ?? [];
    list.push(e);
    adj.set(e.source, list);
  }

  // For each edge targeting a Loop node, check if the source is reachable from that Loop node
  const loopIds = new Set(nodes.filter((n) => n.type === 'loop').map((n) => n.id));
  const candidateEdges = edges.filter((e) => loopIds.has(e.target));

  for (const edge of candidateEdges) {
    // BFS/DFS from the loop node to see if we can reach edge.source (without using this edge)
    const visited = new Set<string>();
    const stack = [edge.target];
    visited.add(edge.target);
    let found = false;
    while (stack.length > 0 && !found) {
      const current = stack.pop()!;
      for (const outEdge of adj.get(current) ?? []) {
        if (outEdge.id === edge.id) continue; // skip the candidate edge itself
        if (outEdge.target === edge.source) { found = true; break; }
        if (!visited.has(outEdge.target)) {
          visited.add(outEdge.target);
          stack.push(outEdge.target);
        }
      }
    }
    if (found) backEdgeIds.add(edge.id);
  }

  return backEdgeIds;
}

export function computeAutoLayout(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  direction: 'TB' | 'LR' = 'LR',
): Map<string, { x: number; y: number }> {
  // Exclude back-edges so Dagre operates on a DAG
  const backEdgeIds = detectBackEdges(nodes, edges);
  const dagEdges = edges.filter((e) => !backEdgeIds.has(e.id));

  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 100 });
  g.setDefaultEdgeLabel(() => ({}));

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of dagEdges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const positions = new Map<string, { x: number; y: number }>();
  for (const node of nodes) {
    const dagreNode = g.node(node.id);
    if (dagreNode) {
      positions.set(node.id, {
        x: dagreNode.x - NODE_WIDTH / 2,
        y: dagreNode.y - (dagreNode.height ?? NODE_HEIGHT) / 2,
      });
    }
  }
  return positions;
}
