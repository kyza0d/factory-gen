import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { TriggerMetadata } from "@registry/nodes/trigger";

export const TriggerNode: NodeDefinition = {
  ...TriggerMetadata,
  execute: async (_ctx: ActionCtx, { params }) => {
    // The trigger node's payload and timestamp are injected at activation time.
    // When executed in a workflow, they come from the trigger's stored payload.
    const config = JSON.parse((params.configuration as string) ?? "{}");
    return {
      payload: config.payload ?? null,
      timestamp: config.timestamp ?? new Date().toISOString(),
    };
  },
};
