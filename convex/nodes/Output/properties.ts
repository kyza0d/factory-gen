import { IOParam } from "../../schema/nodes";

export const OutputProperties: {
  inputs: IOParam[];
  outputs: IOParam[];
  parameters: IOParam[];
} = {
  inputs: [
    {
      id: "output-input-1",
      name: "content",
      type: "string",
      description: "The content to display",
      defaultValue: null,
      options: null,
    },
  ],
  outputs: [],
  parameters: [],
};
