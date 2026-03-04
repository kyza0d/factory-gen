import { InputNode } from "./Input";
import { AINode } from "./AI";
import { OutputNode } from "./Output";
import { NodeDefinition } from "./types";

export * from "./types";

export const ALL_NODES: NodeDefinition[] = [
  InputNode,
  AINode,
  OutputNode,
];

export const NodeRegistry: Record<string, NodeDefinition> = ALL_NODES.reduce(
  (acc, node) => ({ ...acc, [node.type]: node }),
  {}
);
