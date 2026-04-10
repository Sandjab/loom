import { memo } from 'react';
import { getSmoothStepPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

function FlowEdgeInner({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  return (
    <>
      {/* Invisible wider path for easier selection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        className="react-flow__edge-interaction"
      />
      {/* Visible path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? 'var(--edge-color-selected, #6366f1)' : 'var(--edge-color, #94a3b8)'}
        strokeWidth={selected ? 2 : 1.5}
        markerEnd={markerEnd}
        className="react-flow__edge-path"
      />
    </>
  );
}

export const FlowEdge = memo(FlowEdgeInner);
