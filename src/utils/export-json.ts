import type { Workflow } from '@/types/workflow';

export function exportWorkflowJSON(workflow: Workflow): string {
  const exported = {
    version: workflow.version,
    name: workflow.name,
    nodes: workflow.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      name: n.name,
      config: n.config,
    })),
    edges: workflow.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
    })),
  };
  return JSON.stringify(exported, null, 2);
}

export function buildWorkflowJSON(workflow: Workflow): string {
  return JSON.stringify(workflow, null, 2);
}
