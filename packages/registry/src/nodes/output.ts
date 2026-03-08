import { NodeMetadata } from "../types";

export const OutputMetadata: NodeMetadata = {
  type: "Output",
  label: "Preview Output",
  description: "Displays the final result of the workflow.",
  icon: "FaRegEye",
  uiComponent: "Output",
  inputs: [
    {
      id: "output-input-1",
      name: "content",
      type: "string",
      description: "The content to display",
      defaultValue: null,
      options: null,
      enabled: true,
    },
  ],
  outputs: [],
  parameters: [],
  modules: [
    {
      type: "text",
      label: "Preview Result",
      value: null,
      enabled: true,
    },
  ],
};
