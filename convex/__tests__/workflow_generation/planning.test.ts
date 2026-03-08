import { describe, it, expect, vi, beforeEach } from "vitest";
import { MutationCtx } from "../../_generated/server";
import {
  createWorkflowGenerationHandler,
  createGenerationStepsHandler,
  updateGenerationStatusHandler,
  sortPlanSteps,
  type GenerationPlanStep,
} from "../../workflow_generation";

// ─── Planning Phase ────────────────────────────────────────────────────────────
//
// When a user submits a prompt, Phase 1 (planning) creates a generation record
// and one step record per planned node. The frontend subscribes to these records
// and shows the step list immediately while Phase 2 generates each node.

describe("sortPlanSteps", () => {
  it("sorts Input -> AI -> Output correctly", () => {
    const steps: GenerationPlanStep[] = [
      { title: "Out", description: "", nodeType: "Output", suggestedLabel: "" },
      { title: "Mid", description: "", nodeType: "AI", suggestedLabel: "" },
      { title: "In", description: "", nodeType: "Input", suggestedLabel: "" },
    ];
    
    const sorted = sortPlanSteps(steps);
    
    expect(sorted.map(s => s.nodeType)).toEqual(["Input", "AI", "Output"]);
  });

  it("handles Trigger as Input equivalent", () => {
    const steps: GenerationPlanStep[] = [
      { title: "Mid", description: "", nodeType: "AI", suggestedLabel: "" },
      { title: "Trig", description: "", nodeType: "Trigger", suggestedLabel: "" },
    ];
    
    const sorted = sortPlanSteps(steps);
    
    expect(sorted.map(s => s.nodeType)).toEqual(["Trigger", "AI"]);
  });

  it("preserves relative order of same-type nodes (stable sort)", () => {
    const steps: GenerationPlanStep[] = [
      { title: "AI 2", description: "", nodeType: "AI", suggestedLabel: "2" },
      { title: "In", description: "", nodeType: "Input", suggestedLabel: "" },
      { title: "AI 1", description: "", nodeType: "AI", suggestedLabel: "1" },
    ];
    
    // Stable sort is not guaranteed by standard JS sort in all engines, but V8 does it.
    // However, our implementation uses native sort.
    // If the input was [AI 2, Input, AI 1], sorting puts Input first.
    // The relative order of AI 2 and AI 1 should be preserved?
    // Wait, [AI 2, AI 1] were in that order. So they should remain [AI 2, AI 1].
    
    const sorted = sortPlanSteps(steps);
    
    expect(sorted[0].nodeType).toBe("Input");
    expect(sorted[1].suggestedLabel).toBe("2");
    expect(sorted[2].suggestedLabel).toBe("1");
  });

  it("handles empty array", () => {
    expect(sortPlanSteps([])).toEqual([]);
  });
});

describe("createWorkflowGenerationHandler", () => {
  let mockCtx: MutationCtx;

  beforeEach(() => {
    mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("gen-1") },
    } as unknown as MutationCtx;
  });

  it("inserts a workflowGenerations record with status 'generating'", async () => {
    await createWorkflowGenerationHandler(mockCtx, {
      workflowId: "wf-1",
      prompt: "Build a summarization workflow",
      totalSteps: 3,
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "workflowGenerations",
      expect.objectContaining({
        workflowId: "wf-1",
        status: "generating",
        totalSteps: 3,
        completedSteps: 0,
        prompt: "Build a summarization workflow",
      })
    );
  });

  it("returns the id of the inserted record", async () => {
    const id = await createWorkflowGenerationHandler(mockCtx, {
      workflowId: "wf-1",
      prompt: "test",
      totalSteps: 2,
    });

    expect(id).toBe("gen-1");
  });

  it("starts with zero completed steps regardless of totalSteps", async () => {
    await createWorkflowGenerationHandler(mockCtx, {
      workflowId: "wf-1",
      prompt: "test",
      totalSteps: 10,
    });

    const inserted = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(inserted.completedSteps).toBe(0);
  });
});

describe("createGenerationStepsHandler", () => {
  let mockCtx: MutationCtx;

  beforeEach(() => {
    mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("step-id") },
    } as unknown as MutationCtx;
  });

  const baseSteps: GenerationPlanStep[] = [
    { title: "Input Node", description: "Receives user text", nodeType: "Input", suggestedLabel: "User Input" },
    { title: "AI Processing", description: "Summarizes the text", nodeType: "AI", suggestedLabel: "Summarizer" },
    { title: "Output Node", description: "Displays the summary", nodeType: "Output", suggestedLabel: "Result" },
  ];

  it("inserts one record per step", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: baseSteps,
    });

    expect(mockCtx.db.insert).toHaveBeenCalledTimes(3);
  });

  it("sets each step status to 'pending'", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: baseSteps,
    });

    const calls = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls;
    calls.forEach((call) => {
      expect(call[1]).toMatchObject({ status: "pending" });
    });
  });

  it("preserves stepIndex ordering", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: baseSteps,
    });

    const calls = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls;
    calls.forEach((call, idx) => {
      expect(call[1].stepIndex).toBe(idx);
    });
  });

  it("stores title, description, nodeType, suggestedLabel on each step", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: baseSteps,
    });

    const calls = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls[0][1]).toMatchObject({
      title: "Input Node",
      description: "Receives user text",
      nodeType: "Input",
      suggestedLabel: "User Input",
    });
    expect(calls[1][1]).toMatchObject({ nodeType: "AI" });
    expect(calls[2][1]).toMatchObject({ nodeType: "Output" });
  });

  it("stores generationId and workflowId on each step", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: baseSteps,
    });

    const calls = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls;
    calls.forEach((call) => {
      expect(call[1]).toMatchObject({ generationId: "gen-1", workflowId: "wf-1" });
    });
  });

  it("handles empty steps array gracefully", async () => {
    await createGenerationStepsHandler(mockCtx, {
      generationId: "gen-1",
      workflowId: "wf-1",
      steps: [],
    });

    expect(mockCtx.db.insert).not.toHaveBeenCalled();
  });
});

describe("updateGenerationStatusHandler", () => {
  it("patches status and error fields", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ _id: "gen-1", workflowId: "wf-1" }),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateGenerationStatusHandler(mockCtx, {
      generationId: "gen-1",
      status: "failed",
      error: "LLM timeout",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "gen-1",
      expect.objectContaining({ status: "failed", error: "LLM timeout" })
    );
  });

  it("can mark generation as completed without error", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ _id: "gen-1" }),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateGenerationStatusHandler(mockCtx, {
      generationId: "gen-1",
      status: "completed",
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "gen-1",
      expect.objectContaining({ status: "completed" })
    );
  });
});
