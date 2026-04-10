import { nanoid } from 'nanoid';

export function createNodeId(): string {
  return `node_${nanoid(8)}`;
}

export function createEdgeId(): string {
  return `edge_${nanoid(8)}`;
}

export function createWorkflowId(): string {
  return `wf_${nanoid(8)}`;
}
