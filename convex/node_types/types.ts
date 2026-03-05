import { NodeMetadata, NodeModule } from "@registry/types";
import { ActionCtx } from "../_generated/server";

export interface NodeDefinition extends NodeMetadata {
  execute: (
    ctx: ActionCtx,
    args: {
      inputs: Record<string, any>;
      params: Record<string, any>;
      modules: NodeModule[];
    }
  ) => Promise<any>;
}
