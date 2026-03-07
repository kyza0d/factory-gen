import { render, screen, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { AppProvider, useApp } from "./app-context";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal consumer that exposes workspace state for inspection */
function WorkspaceConsumer() {
  const { activeWorkspaceId, setActiveWorkspaceId } = useApp();
  return (
    <div>
      <span data-testid="workspace-id">{activeWorkspaceId ?? "none"}</span>
      <button onClick={() => setActiveWorkspaceId("ws-abc")}>Set Workspace</button>
      <button onClick={() => setActiveWorkspaceId(null)}>Clear Workspace</button>
    </div>
  );
}

/** Consumer that exposes the full context shape for shape-checking */
function ContextShapeConsumer() {
  const ctx = useApp();
  return (
    <div>
      <span data-testid="has-workspace-id">{String("activeWorkspaceId" in ctx)}</span>
      <span data-testid="has-setter">{String(typeof ctx.setActiveWorkspaceId === "function")}</span>
    </div>
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AppContext – workspace state", () => {
  it("exposes activeWorkspaceId on the context", () => {
    render(
      <AppProvider>
        <ContextShapeConsumer />
      </AppProvider>
    );
    expect(screen.getByTestId("has-workspace-id").textContent).toBe("true");
  });

  it("exposes setActiveWorkspaceId as a function on the context", () => {
    render(
      <AppProvider>
        <ContextShapeConsumer />
      </AppProvider>
    );
    expect(screen.getByTestId("has-setter").textContent).toBe("true");
  });

  it("provides activeWorkspaceId as null by default", () => {
    render(
      <AppProvider>
        <WorkspaceConsumer />
      </AppProvider>
    );
    expect(screen.getByTestId("workspace-id").textContent).toBe("none");
  });

  it("setActiveWorkspaceId updates activeWorkspaceId", () => {
    render(
      <AppProvider>
        <WorkspaceConsumer />
      </AppProvider>
    );
    fireEvent.click(screen.getByText("Set Workspace"));
    expect(screen.getByTestId("workspace-id").textContent).toBe("ws-abc");
  });

  it("setActiveWorkspaceId can be reset back to null", () => {
    render(
      <AppProvider>
        <WorkspaceConsumer />
      </AppProvider>
    );
    fireEvent.click(screen.getByText("Set Workspace"));
    expect(screen.getByTestId("workspace-id").textContent).toBe("ws-abc");

    fireEvent.click(screen.getByText("Clear Workspace"));
    expect(screen.getByTestId("workspace-id").textContent).toBe("none");
  });

  it("multiple children share the same workspace state", () => {
    function AnotherConsumer() {
      const { activeWorkspaceId } = useApp();
      return <span data-testid="sibling-workspace-id">{activeWorkspaceId ?? "none"}</span>;
    }

    render(
      <AppProvider>
        <WorkspaceConsumer />
        <AnotherConsumer />
      </AppProvider>
    );

    fireEvent.click(screen.getByText("Set Workspace"));

    expect(screen.getByTestId("workspace-id").textContent).toBe("ws-abc");
    expect(screen.getByTestId("sibling-workspace-id").textContent).toBe("ws-abc");
  });

  it("useApp throws when used outside AppProvider", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<WorkspaceConsumer />)).toThrow(
      "useApp must be used within an AppProvider"
    );
    consoleSpy.mockRestore();
  });
});
