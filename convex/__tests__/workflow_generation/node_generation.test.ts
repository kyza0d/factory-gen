import { describe, it, expect, vi, beforeEach } from "vitest";
import { MutationCtx } from "../../_generated/server";
import {
  updateStepStatusHandler,
  computeNodePosition,
  checkAndFinalizeGenerationHandler,
  type StepStatus,
} from "../../workflow_generation";

// ─── Node Generation Phase ─────────────────────────────────────────────────────
//
// For each planned step, a Convex internalAction:
//   1. Sets step status to "generating"
//   2. Calls LLM to generate a full UINode
//   3. Inserts the node to the DB
//   4. Sets step status to "completed" (or "failed")
//   5. Checks if all steps are done → triggers edge generation
//
// These tests cover the pure logic and mutation handlers used in that flow.

describe("computeNodePosition", () => {
  it("places step 0 at x:50, y:150", () => {
    expect(computeNodePosition(0)).toEqual({ x: 50, y: 150 });
  });

  it("offsets each subsequent step by 300px on x-axis", () => {
    expect(computeNodePosition(1)).toEqual({ x: 350, y: 150 });
    expect(computeNodePosition(2)).toEqual({ x: 650, y: 150 });
    expect(computeNodePosition(3)).toEqual({ x: 950, y: 150 });
  });

  it("keeps y constant for linear workflows", () => {
    for (let i = 0; i < 5; i++) {
      expect(computeNodePosition(i).y).toBe(150);
    }
  });

  it("snaps x to 25px grid", () => {
    // x = 50 + stepIndex * 300; all are already multiples of 25
    const pos = computeNodePosition(0);
    expect(pos.x % 25).toBe(0);
    expect(pos.y % 25).toBe(0);
  });
});

describe("updateStepStatusHandler", () => {
  let baseStep: { _id: string; generationId: string; workflowId: string; stepIndex: number; status: StepStatus };

  beforeEach(() => {
    baseStep = {
      _id: "step-1",
      generationId: "gen-1",
      workflowId: "wf-1",
      stepIndex: 0,
      status: "pending",
    };
  });

  it("transitions step from 'pending' to 'generating'", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(baseStep),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateStepStatusHandler(mockCtx, {
      stepId: "step-1",
      status: "generating",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "step-1",
      expect.objectContaining({ status: "generating" })
    );
  });

  it("stores nodeId when transitioning to 'completed'", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ ...baseStep, status: "generating" }),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateStepStatusHandler(mockCtx, {
      stepId: "step-1",
      status: "completed",
      nodeId: "node-abc",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "step-1",
      expect.objectContaining({ status: "completed", nodeId: "node-abc" })
    );
  });

  it("stores error message when transitioning to 'failed'", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ ...baseStep, status: "generating" }),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateStepStatusHandler(mockCtx, {
      stepId: "step-1",
      status: "failed",
      error: "LLM returned invalid JSON",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "step-1",
      expect.objectContaining({ status: "failed", error: "LLM returned invalid JSON" })
    );
  });

  it("throws if step not found", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await expect(
      updateStepStatusHandler(mockCtx, { stepId: "missing", status: "generating" })
    ).rejects.toThrow("Step not found: missing");
  });
});

describe("checkAndFinalizeGenerationHandler", () => {
  it("increments completedSteps and marks generation 'completed' when all steps done", async () => {
    const generation = { _id: "gen-1", workflowId: "wf-1", totalSteps: 3, completedSteps: 2, status: "generating" };
    const steps = [
      { _id: "s-1", status: "completed" },
      { _id: "s-2", status: "completed" },
      { _id: "s-3", status: "completed" },
    ];

    const mockCtx = {
      db: {
        query: vi.fn().mockImplementation((table: string) => ({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(generation),
            collect: vi.fn().mockResolvedValue(steps),
          }),
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(steps),
          }),
        })),
        patch: vi.fn(),
      },
      scheduler: { runAfter: vi.fn() },
    } as unknown as MutationCtx;

    await checkAndFinalizeGenerationHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "gen-1",
      expect.objectContaining({ completedSteps: 3, status: "completed" })
    );
  });

  it("does not mark completed if steps are still pending", async () => {
    const generation = { _id: "gen-1", workflowId: "wf-1", totalSteps: 3, completedSteps: 1, status: "generating" };
    const steps = [
      { _id: "s-1", status: "completed" },
      { _id: "s-2", status: "generating" },
      { _id: "s-3", status: "pending" },
    ];

    const mockCtx = {
      db: {
        query: vi.fn().mockImplementation(() => ({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(generation),
            collect: vi.fn().mockResolvedValue(steps),
          }),
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(steps),
          }),
        })),
        patch: vi.fn(),
      },
      scheduler: { runAfter: vi.fn() },
    } as unknown as MutationCtx;

    await checkAndFinalizeGenerationHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
    });

    // Should only update completedSteps count, not mark as completed
    const patchCall = (mockCtx.db.patch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(patchCall[1].status).not.toBe("completed");
  });

  it("schedules edge generation when all steps complete", async () => {
    const generation = { _id: "gen-1", workflowId: "wf-1", totalSteps: 2, completedSteps: 1, status: "generating" };
    const steps = [
      { _id: "s-1", status: "completed" },
      { _id: "s-2", status: "completed" },
    ];

    const mockCtx = {
      db: {
        query: vi.fn().mockImplementation(() => ({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(generation),
          }),
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(steps),
          }),
        })),
        patch: vi.fn(),
      },
      scheduler: { runAfter: vi.fn() },
    } as unknown as MutationCtx;

    await checkAndFinalizeGenerationHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
    });

    expect(mockCtx.scheduler.runAfter).toHaveBeenCalledWith(
      0,
      expect.anything(), // internal function reference
      { generationId: "gen-1", workflowId: "wf-1" }
    );
  });
});
