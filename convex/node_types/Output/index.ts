import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { OutputMetadata } from "@registry/nodes/output";

export const OutputNode: NodeDefinition = {
  ...OutputMetadata,
  execute: async (_ctx: ActionCtx, { inputs }) => {
    return inputs["content"] || inputs["default"] || null;
  },
};
