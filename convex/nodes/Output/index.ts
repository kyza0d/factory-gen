import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { OutputProperties } from "./properties";
import { OutputModules } from "./modules";

export const OutputNode: NodeDefinition = {
  type: "Output",
  label: "Preview Output",
  description: "Displays the final result of the workflow.",
  uiComponent: "Output",
  ...OutputProperties,
  modules: OutputModules,
  execute: async (_ctx: ActionCtx, { inputs }) => {
    return inputs["content"] || inputs["default"] || null;
  },
};
