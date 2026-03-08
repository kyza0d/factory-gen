import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodeConfigModal } from "./node-config-modal";
import { NodeModule, UINode } from "@registry/types";

// Mock Convex hooks
const { mockUseMutation } = vi.hoisted(() => ({
  mockUseMutation: vi.fn(() => vi.fn().mockResolvedValue({})),
}));

vi.mock("convex/react", () => ({
  useMutation: mockUseMutation,
  useQuery: vi.fn(),
}));

vi.mock("@convex/_generated/api", () => ({
  api: {
    node_configuration: {
      updateNodeParameterPublic: "updateNodeParameterPublic",
      addNodeModulePublic: "addNodeModulePublic",
      updateNodeModulePublic: "updateNodeModulePublic",
      removeNodeModulePublic: "removeNodeModulePublic",
    },
  },
}));

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
      id: "param-provider",
      name: "provider",
      type: "string",
      description: "Model provider",
      defaultValue: "openai",
      options: ["openai", "anthropic", "google", "openrouter"],
      enabled: true,
    },
    {
      id: "param-model",
      name: "model",
      type: "string",
      description: "AI model to use",
      defaultValue: "gpt-5",
      options: ["gpt-5", "gpt-5-mini", "claude-sonnet-4-5", "gemini-2.5-flash", "openai/gpt-5"],
      enabled: true,
    },
    {
      id: "param-prompt",
      name: "prompt",
      type: "string",
      description: "Prompt template",
      defaultValue: "Summarize: {{input}}",
      options: null,
      enabled: true,
    },
  ],
  ...overrides,
});

const makeModule = (overrides: Partial<NodeModule> = {}): NodeModule => ({
  id: "module-1",
  type: "text",
  label: "Summary",
  value: "Generated summary",
  enabled: true,
  ...overrides,
});

describe("NodeConfigModal", () => {
  it("renders the node type label and node label in the modal title", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    expect(screen.getByRole("heading", { name: "My AI Node" })).toBeInTheDocument();
    expect(screen.getByText("AI Processing")).toBeInTheDocument();
  });

  it("supports overriding modal and tab titles through copy config", () => {
    render(
      <NodeConfigModal
        node={makeNode()}
        onSave={vi.fn()}
        onClose={vi.fn()}
        copy={{
          parametersTabTitle: "Settings",
          modulesTabTitle: "Outputs",
          formatModalTitle: (node, typeLabel) => `${node.label} (${typeLabel})`,
          formatIdentityBadgeLabel: () => "Configured Node",
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "My AI Node (AI Processing)" })).toBeInTheDocument();
    expect(screen.getByText("Configured Node")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /settings \(3\)/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /outputs \(0\)/i })).toBeInTheDocument();
  });

  it("renders a field for each parameter", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    // The label is one element, the description is another. Target the label specifically.
    expect(screen.getByText(/model/i, { selector: 'label' })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /prompt/i })).toBeInTheDocument();
  });

  it("pre-fills each field with the parameter's current defaultValue", () => {
    render(
      <NodeConfigModal node={makeNode()} onSave={vi.fn()} onClose={vi.fn()} />
    );

    const promptField = screen.getByRole("textbox", { name: /prompt/i }) as HTMLInputElement;
    expect(promptField.value).toBe("Summarize: {{input}}");
  });

  it("calls onSave with all parameter id→value pairs when Save is clicked", async () => {
    const onSave = vi.fn();
    render(
      <NodeConfigModal node={makeNode()} onSave={onSave} onClose={vi.fn()} />
    );

    const promptField = screen.getByRole("textbox", { name: /prompt/i });
    fireEvent.change(promptField, { target: { value: "New prompt" } });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith({
        "param-provider": "openai",
        "param-model": "gpt-5",
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

    // The UI library renders this as a button with the current value as its name.
    const providerSelect = screen.getByRole("button", { name: /openai/i });
    const modelSelect = screen.getByRole("button", { name: /gpt-5/i });
    expect(providerSelect).toBeInTheDocument();
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

  it("shows the module type as the primary title and the module label as secondary metadata", async () => {
    render(
      <NodeConfigModal
        node={makeNode({ modules: [makeModule()] })}
        onSave={vi.fn()}
        onClose={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("tab", { name: /modules \(1\)/i }));

    await waitFor(() => {
      expect(screen.getByText("Text")).toBeInTheDocument();
      expect(screen.getByText("Summary")).toBeInTheDocument();
    });
  });
});
