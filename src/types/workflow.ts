import type { LucideIcon } from 'lucide-react';
import type { Node } from '@xyflow/react';

export type NodeType = 'llm-call' | 'claude-cli' | 'condition' | 'input' | 'output' | 'loop';

export interface LlmCallConfig {
  type: 'llm-call';
  systemPrompt: string;
  userPromptTemplate: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ClaudeCliConfig {
  type: 'claude-cli';
  prompt: string;
  systemPrompt: string;
  model: 'opus' | 'sonnet' | 'haiku';
  mcpServers: McpServerConfig[];
  allowedTools: string[];
  maxTurns: number;
  outputFormat: 'text' | 'json' | 'stream-json';
  appendSystemPrompt: string;
  permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions';
}

export interface ConditionConfig {
  type: 'condition';
  expression: string;
}

export interface InputConfig {
  type: 'input';
  variables: { name: string; defaultValue: string }[];
}

export interface OutputConfig {
  type: 'output';
  template: string;
}

export interface LoopConfig {
  type: 'loop';
  iterableExpression: string;
  itemVariable: string;
  maxIterations: number;
}

export type NodeConfig = LlmCallConfig | ClaudeCliConfig | ConditionConfig | InputConfig | OutputConfig | LoopConfig;

export interface WorkflowNode {
  id: string;
  type: NodeType;
  name: string;
  position: { x: number; y: number };
  config: NodeConfig;
  collapsed: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNodeData extends Record<string, unknown> {
  node: WorkflowNode;
}

export type WorkflowFlowNode = Node<WorkflowNodeData>;

export interface ValidationError {
  type: string;
  severity: 'error' | 'warning';
  nodeId: string;
  message: string;
}

export interface HandleDef {
  id: string;
  label?: string;
  position: 'left' | 'right';
}

export interface NodeTypeDefinition<T extends NodeConfig = NodeConfig> {
  type: NodeType;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultConfig: () => T;
  validate: (config: T, nodeId: string, nodeName: string) => ValidationError[];
  ConfigPanel: React.FC<{ config: T; onChange: (config: T) => void }>;
  NodePreview: React.FC<{ config: T }>;
  getOutputHandles: (config: T) => HandleDef[];
  getInputHandles: (config: T) => HandleDef[];
}
