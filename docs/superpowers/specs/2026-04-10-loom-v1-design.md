# Loom v1 — Visual LLM Workflow Designer

## Purpose

Loom is a visual tool for designing LLM call chain workflows. Users draw a directed graph of nodes on a canvas, where each node represents an LLM call, a Claude CLI invocation, a conditional branch, or a data entry/exit point. Edges define the execution flow between nodes. Data passes between nodes via variable interpolation (`{{node_name.output}}`).

v1 is a **designer only** — no workflow execution. Users design workflows visually and export them as JSON for later execution by a separate runtime.

## Tech Stack

Same as Tabloid (reference UI project at `../Tabloid`):

- **React 19** + **TypeScript** + **Vite**
- **@xyflow/react** (React Flow successor) — SVG-based graph canvas
- **Zustand** + **Zundo** — state management with undo/redo
- **Tailwind CSS v4** — styling with Oklch design tokens
- **shadcn/ui** — component library (button, dialog, dropdown, input, popover, tooltip)
- **@dagrejs/dagre** — automatic graph layout
- **Lucide React** — icons
- **next-themes** — dark/light mode
- **nanoid** — ID generation

## Node Types

Five node types, managed via a node type registry:

### LLM Call (`llm-call`)
Generic LLM API call. Config:
- `systemPrompt: string`
- `userPromptTemplate: string` — supports `{{variable}}` interpolation
- `model: string` — model identifier
- `temperature: number` — 0-1
- `maxTokens: number`

Color: purple `#7c3aed`. Icon: brain.

### Claude CLI (`claude-cli`)
Headless invocation of `claude -p`. Config:
- `prompt: string` — supports `{{variable}}` interpolation
- `systemPrompt: string`
- `model: 'opus' | 'sonnet' | 'haiku'`
- `mcpServers: McpServerConfig[]` — MCP server configurations (`{ name: string; command: string; args: string[]; env?: Record<string, string> }`)
- `allowedTools: string[]` — tool allowlist
- `maxTurns: number`
- `outputFormat: 'text' | 'json' | 'stream-json'`
- `appendSystemPrompt: string`
- `permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions'`

Color: amber `#d97706`. Icon: terminal/command.

### Condition (`condition`)
If/else branching. Has two output handles: `true` (green) and `false` (red). Config:
- `expression: string` — e.g., `{{prev.output.length}} > 500`

Color: yellow `#f59e0b`. Icon: git-branch.

### Input (`input`)
Workflow entry point. No incoming edges. Config:
- `variables: { name: string; defaultValue: string }[]`

Color: green `#10b981`. Icon: play.

### Output (`output`)
Workflow exit point. No outgoing edges. Config:
- `template: string` — output format with `{{variable}}` references

Color: blue `#3b82f6`. Icon: square (stop).

## Node Type Registry

Each type registers a `NodeTypeDefinition`:

```typescript
interface NodeTypeDefinition<T extends NodeConfig = NodeConfig> {
  type: NodeType;
  label: string;
  icon: LucideIcon;
  color: string;
  defaultConfig: () => T;
  validate: (config: T) => ValidationError[];
  ConfigPanel: React.FC<{ config: T; onChange: (c: T) => void }>;
  NodePreview: React.FC<{ config: T }>;
  getOutputHandles: (config: T) => HandleDef[];
  getInputHandles: (config: T) => HandleDef[];
}
```

Adding a new node type = one file that exports a `NodeTypeDefinition` + registering it. The canvas, side panel, toolbar, validation, and serialization all work generically against the registry.

## Data Model

```typescript
interface Workflow {
  id: string;
  name: string;
  version: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowNode {
  id: string;
  type: NodeType;  // 'llm-call' | 'claude-cli' | 'condition' | 'input' | 'output'
  name: string;
  position: { x: number; y: number };
  config: NodeConfig;
  collapsed: boolean;
}

type NodeConfig = LlmCallConfig | ClaudeCliConfig | ConditionConfig | InputConfig | OutputConfig;

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;  // For condition: 'true' | 'false'
}
```

## Data Flow

Variable interpolation: downstream nodes reference upstream outputs via `{{node_name.output}}` in their prompt templates and config fields. Data mapping is configured in the target node's side panel, not on edges.

Edges are simple directional arrows with no metadata.

## Visual Design

### Node Appearance (Hybrid Collapsible)
- **Collapsed** (default): compact card with colored left border, icon, name, and optional model badge
- **Expanded** (selected node): shows key config preview — model, temperature, truncated prompt
- Toggle via chevron or by selecting the node

### Canvas
- Dark background with dot grid pattern
- SVG-based rendering via @xyflow/react
- Pan/zoom with configurable min/max zoom
- Double-click canvas to create a node (type picker)
- Right-click context menu: add node, select all, auto-layout, fit view
- Connection handles (colored circles) on node sides for edge creation

### App Layout
- **Toolbar** (top): workflow name, undo/redo, auto-layout, validate, save, export, theme toggle
- **Canvas** (center): main workspace with nodes and edges
- **Side Panel** (right, conditional): appears when a node is selected, shows full config form
- **Minimap** (bottom-right of canvas): pannable/zoomable navigation overview
- **Status Bar** (bottom): node/edge counts, validation status, zoom level

### Design Tokens
Follow Tabloid's Oklch color space approach with warm dark theme and light mode support. Reuse Geist Variable font.

## State Management

Single Zustand store wrapped with Zundo for undo/redo:

```typescript
interface WorkflowState {
  workflow: Workflow;
  rfNodes: Node[];           // Derived React Flow nodes
  rfEdges: Edge[];           // Derived React Flow edges
  selectedNodeId: string | null;  // UI state (not in undo history)

  // Node CRUD
  addNode: (type: NodeType, position: { x: number; y: number }) => string;
  removeNodes: (ids: string[]) => void;
  updateNodeConfig: (id: string, config: Partial<NodeConfig>) => void;
  updateNodeName: (id: string, name: string) => void;
  updateNodePosition: (id: string, position: { x: number; y: number }) => void;
  toggleNodeCollapse: (id: string) => void;

  // Edge CRUD
  addEdge: (source: string, target: string, sourceHandle?: string) => void;
  removeEdges: (ids: string[]) => void;

  // Workflow operations
  loadWorkflow: (workflow: Workflow) => void;
  newWorkflow: () => void;
  validate: () => ValidationError[];
  rebuildRfNodes: () => void;
  rebuildRfEdges: () => void;
}
```

Only `workflow.nodes` and `workflow.edges` are tracked in undo history. `rfNodes`/`rfEdges` are derived and rebuilt on changes. `selectedNodeId` is UI-only state.

## Persistence

Same approach as Tabloid:
- **Auto-save** to localStorage every 500ms (debounced)
- **Save/Open** JSON files via file picker
- **Recent workflows** list in localStorage (max 5)
- **Copy/paste** workflow JSON via clipboard

localStorage keys: `loom-recent`, `loom-workflow-{name}`, `loom-theme`.

## Validation

Errors highlighted on canvas (red ring) and listed in status bar:

1. **Disconnected nodes** — no edges (except Input: no incoming; Output: no outgoing)
2. **Missing required config** — empty prompt, model, expression
3. **Broken variable references** — `{{foo.output}}` where `foo` doesn't exist upstream
4. **Circular references** — cycle detection
5. **No Input node** — workflow has no entry point
6. **No Output node** — workflow has no exit point

Each node type contributes its own validation via `NodeTypeDefinition.validate()`.

## Export

JSON export format (layout metadata stripped):

```json
{
  "version": 1,
  "name": "Workflow name",
  "nodes": [
    {
      "id": "node_1",
      "type": "llm-call",
      "name": "Summarize",
      "config": { ... }
    }
  ],
  "edges": [
    { "id": "edge_1", "source": "node_0", "target": "node_1" }
  ]
}
```

## Keyboard Shortcuts

Adapted from Tabloid:
- `Ctrl+Z` / `Ctrl+Shift+Z` — undo/redo
- `Ctrl+S` — save to file
- `Ctrl+O` — open file
- `Ctrl+A` — select all
- `Delete` — remove selected nodes/edges
- `Ctrl+D` — duplicate selected nodes
- `Ctrl+F` — search nodes
- `Ctrl+=` / `Ctrl+-` — zoom in/out
- `Ctrl+0` — fit view
- Platform-aware: Cmd on Mac, Ctrl on Windows

## Project Structure

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── components/
│   ├── Canvas/Canvas.tsx
│   ├── WorkflowNode/WorkflowNode.tsx
│   ├── FlowEdge/FlowEdge.tsx
│   ├── Toolbar/Toolbar.tsx
│   ├── SidePanel/SidePanel.tsx
│   ├── StatusBar/StatusBar.tsx
│   └── ui/  (shadcn primitives)
├── nodes/
│   ├── registry.ts
│   ├── llm-call.tsx
│   ├── claude-cli.tsx
│   ├── condition.tsx
│   ├── input.tsx
│   └── output.tsx
├── store/useWorkflowStore.ts
├── types/workflow.ts
├── hooks/
│   ├── useAutoSave.ts
│   ├── useUndoRedo.ts
│   ├── useTheme.ts
│   └── useKeyboardShortcuts.ts
└── utils/
    ├── id.ts
    ├── auto-layout.ts
    ├── validate.ts
    ├── export-json.ts
    └── platform.ts
```

## Reuse from Tabloid

Direct adaptation (same patterns, different domain):
- `Canvas.tsx` — pan/zoom, minimap, keyboard shortcuts, context menu, double-click to create
- `useAutoSave.ts` — localStorage persistence with debounce
- `useUndoRedo.ts` — Zundo temporal wrapper
- `useTheme.ts` — dark/light toggle with system preference
- `useKeyboardShortcuts.ts` — hotkey bindings
- `auto-layout.ts` — Dagre auto-layout
- `id.ts` — nanoid generation
- `platform.ts` — Mac/Windows detection
- `index.css` — Oklch design tokens, dark/light theme variables
- `ui/` — shadcn component set
- Store patterns: `temporal()`, `pause()`/`resume()`, derived state rebuilding
