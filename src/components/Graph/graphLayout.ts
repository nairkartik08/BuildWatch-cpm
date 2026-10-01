import dagre from 'dagre';
import type { Node, Edge } from '@xyflow/react';
import type { Task, CPMProjectResult } from '../../engine/types';
import type { BlastRadiusResult } from '../../engine/blast';
import type { TaskNodeData } from './TaskNode';

const nodeWidth = 230;
const nodeHeight = 110;

/**
 * Computes Dagre hierarchical layout for task nodes and dependency edges.
 */
export function getLayoutedElements(
  tasks: Task[],
  cpmResult: CPMProjectResult,
  selectedTaskId: string | null,
  blastRadius: BlastRadiusResult | null,
  onSelectTask: (id: string) => void,
  direction: 'LR' | 'TB' = 'LR'
): { nodes: Node<TaskNodeData>[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 70,
  });

  const nodes: Node<TaskNodeData>[] = [];
  const edges: Edge[] = [];

  // Register nodes with dagre
  for (const task of tasks) {
    dagreGraph.setNode(task.id, { width: nodeWidth, height: nodeHeight });

    const cpm = cpmResult.tasks[task.id];
    const isSelected = selectedTaskId === task.id;
    const blastImpact = blastRadius?.affectedTasks[task.id];

    nodes.push({
      id: task.id,
      type: 'taskNode',
      position: { x: 0, y: 0 },
      data: {
        task,
        cpm,
        isSelected,
        blastImpact,
        onClick: onSelectTask,
      },
    });
  }

  // Register edges with dagre
  for (const task of tasks) {
    for (const predId of task.predecessors) {
      dagreGraph.setEdge(predId, task.id);

      const predRes = cpmResult.tasks[predId];
      const taskRes = cpmResult.tasks[task.id];
      const isCriticalEdge = predRes?.critical && taskRes?.critical;

      edges.push({
        id: `e-${predId}->${task.id}`,
        source: predId,
        target: task.id,
        animated: isCriticalEdge,
        style: {
          stroke: isCriticalEdge ? '#ff4d4d' : 'rgba(255, 255, 255, 0.25)',
          strokeWidth: isCriticalEdge ? 2.5 : 1.5,
        },
      });
    }
  }

  // Calculate layout
  dagre.layout(dagreGraph);

  // Position nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
