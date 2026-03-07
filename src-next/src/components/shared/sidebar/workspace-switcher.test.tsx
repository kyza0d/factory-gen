import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useQuery, useMutation } from "convex/react";
import { WorkspaceSwitcher } from "./workspace-switcher";

// ─── Module Mocks ─────────────────────────────────────────────────────────────

vi.mock("convex/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("convex/react")>();
  return {
    ...actual,
    useQuery: vi.fn(),
    useMutation: vi.fn(() => vi.fn()),
  };
});

vi.mock("../app-context", () => ({
  useApp: vi.fn(() => ({
    activeWorkspaceId: null,
    setActiveWorkspaceId: vi.fn(),
  })),
}));

// The convex generated API is mocked at the module level so tests don't need
// a real Convex deployment. Values are arbitrary identifiers.
vi.mock("@convex/_generated/api", () => ({
  api: {
    workspaces: {
      getWorkspaces: "workspaces:getWorkspaces",
      createWorkspace: "workspaces:createWorkspace",
      renameWorkspace: "workspaces:renameWorkspace",
      deleteWorkspace: "workspaces:deleteWorkspace",
    },
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

import { useApp } from "../app-context";

const DEFAULT_WS = { _id: "ws-db-1", id: "ws-uuid-1", name: "Default", isDefault: true };
const ALPHA_WS = { _id: "ws-db-2", id: "ws-uuid-2", name: "Project Alpha", isDefault: false };

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkspaceSwitcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(vi.fn());
  });

  // ── Loading / Empty states ─────────────────────────────────────────────────

  it("renders a loading state while workspaces are being fetched", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue(undefined);

    render(<WorkspaceSwitcher />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders workspace names when data is available", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);

    render(<WorkspaceSwitcher />);

    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  // ── Active workspace ───────────────────────────────────────────────────────

  it("marks the active workspace with data-active='true'", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-2",
      setActiveWorkspaceId: vi.fn(),
    });

    render(<WorkspaceSwitcher />);

    const activeItem = screen.getByText("Project Alpha").closest("[data-active]");
    expect(activeItem).toHaveAttribute("data-active", "true");
  });

  it("does not mark non-active workspaces with data-active='true'", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-2",
      setActiveWorkspaceId: vi.fn(),
    });

    render(<WorkspaceSwitcher />);

    const inactiveItem = screen.getByText("Default").closest("[data-active]");
    expect(inactiveItem).not.toHaveAttribute("data-active", "true");
  });

  // ── Switching workspace ────────────────────────────────────────────────────

  it("calls setActiveWorkspaceId with the correct id when a workspace is clicked", () => {
    const mockSetActiveWorkspaceId = vi.fn();
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-1",
      setActiveWorkspaceId: mockSetActiveWorkspaceId,
    });

    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByText("Project Alpha"));

    expect(mockSetActiveWorkspaceId).toHaveBeenCalledWith("ws-uuid-2");
  });

  // ── Creating a workspace ───────────────────────────────────────────────────

  it("renders a button to create a new workspace", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS]);

    render(<WorkspaceSwitcher />);

    expect(screen.getByTitle(/new workspace/i)).toBeInTheDocument();
  });

  it("calls the createWorkspace mutation when the new-workspace button is clicked", () => {
    const mockCreate = vi.fn().mockResolvedValue("ws-new-uuid");
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS]);
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockCreate);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-1",
      setActiveWorkspaceId: vi.fn(),
    });

    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByTitle(/new workspace/i));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ name: expect.any(String) })
    );
  });

  // ── Deleting a workspace ───────────────────────────────────────────────────

  it("does not render a delete button for the default workspace", () => {
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-1",
      setActiveWorkspaceId: vi.fn(),
    });

    render(<WorkspaceSwitcher />);

    // Non-default workspace has a delete affordance; default does not
    expect(screen.queryByLabelText(/delete Default/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/delete Project Alpha/i)).toBeInTheDocument();
  });

  it("calls the deleteWorkspace mutation with the correct id", () => {
    const mockDelete = vi.fn();
    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-1",
      setActiveWorkspaceId: vi.fn(),
    });
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockDelete);

    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByLabelText(/delete Project Alpha/i));

    expect(mockDelete).toHaveBeenCalledWith({ id: "ws-uuid-2" });
  });

  // ── Switching after deletion ───────────────────────────────────────────────

  it("calls setActiveWorkspaceId with the default workspace id when the active workspace is deleted", () => {
    const mockSetActiveWorkspaceId = vi.fn();
    const mockDelete = vi.fn();

    (useQuery as ReturnType<typeof vi.fn>).mockReturnValue([DEFAULT_WS, ALPHA_WS]);
    // User is currently viewing Project Alpha
    (useApp as ReturnType<typeof vi.fn>).mockReturnValue({
      activeWorkspaceId: "ws-uuid-2",
      setActiveWorkspaceId: mockSetActiveWorkspaceId,
    });
    (useMutation as ReturnType<typeof vi.fn>).mockReturnValue(mockDelete);

    render(<WorkspaceSwitcher />);
    fireEvent.click(screen.getByLabelText(/delete Project Alpha/i));

    // After deletion of the active workspace, should fall back to default
    expect(mockSetActiveWorkspaceId).toHaveBeenCalledWith("ws-uuid-1");
  });
});
