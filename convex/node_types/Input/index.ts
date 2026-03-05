import { ActionCtx } from "../../_generated/server";
import { NodeDefinition } from "../types";
import { InputProperties } from "./properties";
import { InputModules } from "./modules";

export const InputNode: NodeDefinition = {
  type: "Input",
  label: "User Input",
  description: "Captures input from the user.",
  uiComponent: "Input",
  ...InputProperties,
  modules: InputModules,
  execute: async (_ctx: ActionCtx, { params, modules }) => {
    const textModule = modules.find((m) => m.type === "text");
    return textModule?.value || params["value"] || "Default User Input";
  },
};
