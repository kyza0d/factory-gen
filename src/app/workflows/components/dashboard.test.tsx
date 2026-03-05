import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useQuery } from "convex/react";
import { Dashboard } from "./dashboard";

// Mock the Convex useQuery hook
vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("convex/react")>();
  return {
    ...actual,
    useQuery: vi.fn(),
  };
});

describe("Dashboard", () => {
  it("renders loading state", () => {
    // @ts-ignore
    useQuery.mockReturnValue(undefined);
    render(<Dashboard />);
    expect(screen.getByText("Loading workflows...")).toBeInTheDocument();
  });

  it("renders empty state when no workflows are found", () => {
    // @ts-ignore
    useQuery.mockReturnValue([]);
    render(<Dashboard />);
    expect(screen.getByText("No workflows found.")).toBeInTheDocument();
  });

  it("renders workflows when data is available", () => {
    // @ts-ignore
    useQuery.mockReturnValue([
      { _id: "1", id: "wf1-uuid", name: "My First Workflow", status: "completed", description: "First desc" },
      { _id: "2", id: "wf2-uuid", name: "Another Workflow", status: "running", description: "Second desc" },
    ]);
    render(<Dashboard />);
    expect(screen.getByText("My First Workflow")).toBeInTheDocument();
    expect(screen.getByText("completed")).toBeInTheDocument();
    expect(screen.getByText("Another Workflow")).toBeInTheDocument();
    expect(screen.getByText("running")).toBeInTheDocument();
  });
});
