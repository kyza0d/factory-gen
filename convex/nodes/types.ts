import { ActionCtx } from "../_generated/server";
import { IOParam } from "../schema/nodes";

export interface NodeModule {
  id?: string;
  type: string;
  label: string;
  value?: string | null;
}

export interface NodeDefinition {
  type: string;
  label: string;
  description?: string;
  inputs?: IOParam[];
  outputs?: IOParam[];
  parameters?: IOParam[];
  modules?: NodeModule[];
  uiComponent?: string;
  execute: (
    ctx: ActionCtx,
    args: {
      inputs: Record<string, any>;
      params: Record<string, any>;
      modules: NodeModule[];
    }
  ) => Promise<any>;
}
