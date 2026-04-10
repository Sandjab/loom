import type { NodeConfig, NodeType, NodeTypeDefinition } from '@/types/workflow';

const nodeTypes = new Map<NodeType, NodeTypeDefinition>();

export function registerNodeType<T extends NodeConfig>(def: NodeTypeDefinition<T>): void {
  nodeTypes.set(def.type, def as unknown as NodeTypeDefinition);
}

export function getNodeType(type: NodeType): NodeTypeDefinition | undefined {
  return nodeTypes.get(type);
}

export function getAllNodeTypes(): NodeTypeDefinition[] {
  return Array.from(nodeTypes.values());
}
