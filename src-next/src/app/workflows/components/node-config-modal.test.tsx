import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodeConfigModal } from "./node-config-modal";
import { UINode } from "@registry/types";

// NodeConfigModal doesn't exist yet — this file drives its implementation.
// It opens when the user wants to edit a node's parameters and emits
// onSave with updated param values or onClose when dismissed.

const makeNode = (overrides: Partial<UINode> = {}): UINode => ({
  id: "node-1",
  type: "AI",
  label: "My AI Node",
  inputs: [],
  outputs: [],
  agentDefinitionId: null,
  uiComponent: null,
  position: { x: 0, y: 0 },
  modules: null,
  parameters: [
    {
      id: "param-model",
      name: "model",
      type: "string",
      description: "AI model to use",
      defaultValue: "gpt-4",
      options: ["gpt-4", "gpt-3.5-turbo"],
    },
    {
      id: "param-prompt",
      name: "prompt",
      type: "string",
      description: "Prompt template",
      defaultValue: "Summarize: {{input}}",
      options: null,
    },
  ],
  ...overrides,
});

describe("NodeConfigModal", () => {
  it("renders the node label as the modal title", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByText("My AI Node")).toBeInTheDocument();
  });

  it("renders a field for each parameter", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/prompt/i)).toBeInTheDocument();
  });

  it("pre-fills each field with the parameter's current defaultValue", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    const promptField = screen.getByLabelText(/prompt/i) as HTMLInputElement;
    expect(promptField.value).toBe("Summarize: {{input}}");
  });

  it("calls onSave with all parameter id→value pairs when Save is clicked", async () => {
    const onSave = vi.fn();
    render(
      <NodeConfigModal node={makeNode()} onSave={onSave} onClose={vi.fn()} />
    );

    const promptField = screen.getByLabelText(/prompt/i);
    fireEvent.change(promptField, { target: { value: "New prompt" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        "param-model": "gpt-4",
        "param-prompt": "New prompt",
      });
    });
  });

  it("calls onClose without calling onSave when Cancel is clicked", () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <NodeConfigModal node={makeNode()} onSave={onSave} onClose={onClose} />
    );

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("renders a select/dropdown for parameters that have options", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    // "model" has options — should render a <select> or combobox
    const modelSelect = screen.getByRole("combobox", { name: /model/i });
    expect(modelSelect).toBeInTheDocument();
  });

  it("renders a text input for parameters without options", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    // "prompt" has no options — should render a plain text input
    const promptInput = screen.getByRole("textbox", { name: /prompt/i });
    expect(promptInput).toBeInTheDocument();
  });

  it("renders nothing when node is null (modal is closed)", () => {
    const { container } = render(
      <NodeConfigModal node={null} onSave={vi.fn()} onClose={vi.fn()} />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
