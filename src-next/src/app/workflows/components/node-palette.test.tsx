import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { NodePalette } from "./node-palette";

// NodePalette doesn't exist yet — this file drives its implementation.
// It renders a panel of available node types and emits a callback
// when the user selects one to insert onto the canvas.

const { mockMetadata } = vi.hoisted(() => ({
  mockMetadata: [
    { type: "Input", label: "Input", description: "Accepts user text" },
    { type: "AI", label: "AI", description: "Runs an AI model" },
    { type: "Output", label: "Output", description: "Displays results" },
    { type: "Trigger", label: "Trigger", description: "Starts the workflow" },
  ],
}));

vi.mock("@registry/nodes", () => ({
  ALL_NODES_METADATA: mockMetadata,
}));

describe("NodePalette", () => {
  it("renders a card for each available node type", () => {
    render(<NodePalette onAddNode={vi.fn()} />);

    for (const meta of mockMetadata) {
      expect(screen.getByText(meta.label)).toBeInTheDocument();
    }
  });

  it("calls onAddNode with the node type when a card is clicked", () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);

    fireEvent.click(screen.getByText("AI"));

    expect(onAddNode).toHaveBeenCalledWith("AI");
    expect(onAddNode).toHaveBeenCalledTimes(1);
  });

  it("renders descriptions for each node type", () => {
    render(<NodePalette onAddNode={vi.fn()} />);

    expect(screen.getByText("Accepts user text")).toBeInTheDocument();
    expect(screen.getByText("Runs an AI model")).toBeInTheDocument();
  });

  it("does not call onAddNode when no interaction occurs", () => {
    const onAddNode = vi.fn();
    render(<NodePalette onAddNode={onAddNode} />);

    expect(onAddNode).not.toHaveBeenCalled();
  });
});
