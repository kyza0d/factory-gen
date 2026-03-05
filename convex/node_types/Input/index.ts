import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { InputMetadata } from "@registry/nodes/input";

export const InputNode: NodeDefinition = {
  ...InputMetadata,
  execute: async (_ctx: ActionCtx, { modules }) => {
    const textModule = modules.find((m) => m.type === "text");
    return textModule?.value || "Default User Input";
  },
};
