import { AIMetadata } from "./ai";
import { InputMetadata } from "./input";
import { OutputMetadata } from "./output";
import { TriggerMetadata } from "./trigger";
import { NodeMetadata } from "../types";

export * from "./ai";
export * from "./input";
export * from "./output";
export * from "./trigger";

export const ALL_NODES_METADATA: NodeMetadata[] = [
  TriggerMetadata,
  InputMetadata,
  AIMetadata,
  OutputMetadata,
];

export const NodeMetadataRegistry: Record<string, NodeMetadata> = ALL_NODES_METADATA.reduce(
  (acc, node) => ({ ...acc, [node.type]: node }),
  {}
);
