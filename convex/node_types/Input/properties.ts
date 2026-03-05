import { IOParam } from "../../schema/nodes";

export const InputProperties: {
  inputs: IOParam[];
  outputs: IOParam[];
  parameters: IOParam[];
} = {
  inputs: [],
  outputs: [
    {
      id: "output-1",
      // For definitions, we describe the shape. 
      // When instantiating, we generate IDs.
      // But the IOParam schema requires an ID. 
      // Let's use static IDs for the definition templates.
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
};
