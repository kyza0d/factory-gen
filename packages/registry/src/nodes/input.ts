import { NodeMetadata } from "../types";

export const InputMetadata: NodeMetadata = {
  type: "Input",
  label: "User Input",
  description: "Captures input from the user.",
  uiComponent: "Input",
  inputs: [],
  outputs: [
    {
      id: "output-1",
      name: "input",
      type: "string",
      description: "The user input text",
      defaultValue: null,
      options: null,
    },
  ],
  parameters: [
    {
      id: "param-1",
      name: "value",
      type: "string",
      description: "Default value if no input is provided",
      defaultValue: "Default User Input",
      options: null,
    },
  ],
  modules: [
    {
      type: "text",
      label: "User Input",
      value: "Default User Input",
    },
  ],
};
