import type { WorkflowNode, WorkflowEdge, ValidationError } from '@/types/workflow';
import { getNodeType } from '@/nodes/registry';

export function validateWorkflow(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): ValidationError[] {
  const errors: ValidationError[] = [];
  const incomingEdges = new Map<string, WorkflowEdge[]>();
  const outgoingEdges = new Map<string, WorkflowEdge[]>();

  for (const edge of edges) {
    const inc = incomingEdges.get(edge.target) ?? [];
    inc.push(edge);
    incomingEdges.set(edge.target, inc);

    const out = outgoingEdges.get(edge.source) ?? [];
    out.push(edge);
    outgoingEdges.set(edge.source, out);
  }

  // Check each node
  const hasInput = nodes.some((n) => n.type === 'input');
  const hasOutput = nodes.some((n) => n.type === 'output');

  if (!hasInput && nodes.length > 0) {
    errors.push({ type: 'no-input', severity: 'error', nodeId: '', message: 'Workflow has no Input node' });
  }
  if (!hasOutput && nodes.length > 0) {
    errors.push({ type: 'no-output', severity: 'error', nodeId: '', message: 'Workflow has no Output node' });
  }

  for (const node of nodes) {
    const incoming = incomingEdges.get(node.id) ?? [];
    const outgoing = outgoingEdges.get(node.id) ?? [];

    // Disconnected node checks
    if (node.type !== 'input' && incoming.length === 0) {
      errors.push({ type: 'disconnected', severity: 'warning', nodeId: node.id, message: `"${node.name}" has no incoming connections` });
    }
    if (node.type !== 'output' && outgoing.length === 0) {
      errors.push({ type: 'disconnected', severity: 'warning', nodeId: node.id, message: `"${node.name}" has no outgoing connections` });
    }

    // Per-type validation
    const def = getNodeType(node.type);
    if (def) {
      errors.push(...def.validate(node.config, node.id, node.name));
    }
  }

  // Broken variable references: find {{name.output}} patterns and check upstream
  for (const node of nodes) {
    const configStr = JSON.stringify(node.config);
    const varRefs = [...configStr.matchAll(/\{\{(\w+)\.\w+\}\}/g)];
    for (const match of varRefs) {
      const refName = match[1];
      const refNode = nodes.find((n) => n.name === refName);
      if (!refNode) {
        errors.push({
          type: 'broken-ref',
          severity: 'error',
          nodeId: node.id,
          message: `"${node.name}" references "{{${refName}...}}" but no node named "${refName}" exists`,
        });
      }
    }
  }

  // Cycle detection (DFS)
  const visited = new Set<string>();
  const inStack = new Set<string>();
  function hasCycle(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    inStack.add(nodeId);
    for (const edge of outgoingEdges.get(nodeId) ?? []) {
      if (hasCycle(edge.target)) return true;
    }
    inStack.delete(nodeId);
    return false;
  }
  for (const node of nodes) {
    if (hasCycle(node.id)) {
      errors.push({ type: 'circular-ref', severity: 'error', nodeId: node.id, message: `Circular reference detected involving "${node.name}"` });
      break;
    }
  }

  return errors;
}
