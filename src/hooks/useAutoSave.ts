import { useEffect, useRef } from 'react';
import { useWorkflowStore } from '@/store/useWorkflowStore';
import { buildWorkflowJSON } from '@/utils/export-json';
import type { Workflow } from '@/types/workflow';

const RECENT_KEY = 'loom-recent';
const WORKFLOW_PREFIX = 'loom-workflow-';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 500;

export interface RecentEntry {
  name: string;
  nodeCount: number;
}

export function getRecentList(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentList(list: RecentEntry[]): void {
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
}

function updateRecentEntry(name: string, nodeCount: number): void {
  const list = getRecentList().filter((e) => e.name !== name);
  list.unshift({ name, nodeCount });
  saveRecentList(list);
}

function saveWorkflow(workflow: Workflow): void {
  localStorage.setItem(WORKFLOW_PREFIX + workflow.name, buildWorkflowJSON(workflow));
  updateRecentEntry(workflow.name, workflow.nodes.length);
}

export function saveCurrentWorkflow(): void {
  const { workflow } = useWorkflowStore.getState();
  saveWorkflow(workflow);
}

export function loadWorkflowByName(name: string): boolean {
  const raw = localStorage.getItem(WORKFLOW_PREFIX + name);
  if (!raw) return false;
  try {
    const workflow: Workflow = JSON.parse(raw);
    useWorkflowStore.getState().loadWorkflow(workflow);
    return true;
  } catch {
    return false;
  }
}

export function loadFromLocalStorage(): boolean {
  const recent = getRecentList();
  if (recent.length > 0) {
    return loadWorkflowByName(recent[0].name);
  }
  return false;
}

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevRef = useRef<{ nodes: unknown; edges: unknown; name: unknown }>({
    nodes: null,
    edges: null,
    name: null,
  });

  useEffect(() => {
    const unsubscribe = useWorkflowStore.subscribe((state) => {
      const { workflow } = state;
      if (
        workflow.nodes === prevRef.current.nodes &&
        workflow.edges === prevRef.current.edges &&
        workflow.name === prevRef.current.name
      ) {
        return;
      }
      prevRef.current = { nodes: workflow.nodes, edges: workflow.edges, name: workflow.name };

      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        saveWorkflow(workflow);
      }, DEBOUNCE_MS);
    });
    return () => {
      clearTimeout(timerRef.current);
      unsubscribe();
    };
  }, []);
}
