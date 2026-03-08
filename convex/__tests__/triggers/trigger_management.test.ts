import { describe, it, expect, vi } from "vitest";
import {
  createTriggerHandler,
  updateTriggerHandler,
  getTriggerHandler,
  getTriggersByWorkflowHandler,
  activateTriggerHandler,
  deleteTriggerHandler,
} from "../../triggers";
import { MutationCtx } from "../../_generated/server";

// ─── createTriggerHandler ─────────────────────────────────────────────────────

describe("createTriggerHandler", () => {
  it("creates a webhook trigger and auto-generates a webhookId", async () => {
    const mockCtx = {
      db: {
        insert: vi.fn().mockResolvedValue("trigger-db-1"),
      },
    } as unknown as MutationCtx;

    const result = await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "webhook",
      config: {},
    });

    expect(result).toBe("trigger-db-1");
    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        workflowId: "wf-1",
        nodeId: "node-1",
        type: "webhook",
        enabled: true,
        triggerCount: 0,
        webhookId: expect.any(String),
      })
    );
  });

  it("uses provided webhookId if given", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("trigger-db-2") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "webhook",
      config: { webhookId: "my-hook-id", webhookSecret: "secret123" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        webhookId: "my-hook-id",
        webhookSecret: "secret123",
      })
    );
  });

  it("creates a cron trigger with expression and timezone", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("trigger-db-3") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-2",
      type: "cron",
      config: { cronExpression: "0 9 * * *", timezone: "America/New_York" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        type: "cron",
        cronExpression: "0 9 * * *",
        timezone: "America/New_York",
      })
    );
  });

  it("creates a cron trigger with default timezone UTC", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("trigger-db-4") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-2",
      type: "cron",
      config: { cronExpression: "*/15 * * * *" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({ timezone: "UTC" })
    );
  });

  it("creates a fileChange trigger with watch config", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("trigger-db-5") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-3",
      type: "fileChange",
      config: { watchPath: "/home/user/uploads", filePattern: "*.csv", changeType: "created" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        type: "fileChange",
        watchPath: "/home/user/uploads",
        filePattern: "*.csv",
        changeType: "created",
      })
    );
  });

  it("creates an httpRequest trigger with method", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("trigger-db-6") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-4",
      type: "httpRequest",
      config: { method: "GET" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        type: "httpRequest",
        httpMethod: "GET",
      })
    );
  });
});

// ─── getTriggerHandler ────────────────────────────────────────────────────────

describe("getTriggerHandler", () => {
  it("returns a trigger by triggerId", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "webhook" };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
      },
    } as unknown as MutationCtx;

    const result = await getTriggerHandler(mockCtx, { triggerId: "trigger-db-1" });

    expect(result).toEqual(trigger);
  });

  it("returns null when trigger not found", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    } as unknown as MutationCtx;

    const result = await getTriggerHandler(mockCtx, { triggerId: "nonexistent" });

    expect(result).toBeNull();
  });
});

// ─── getTriggersByWorkflowHandler ─────────────────────────────────────────────

describe("getTriggersByWorkflowHandler", () => {
  it("returns all triggers for a workflow", async () => {
    const triggers = [
      { _id: "t1", workflowId: "wf-1", type: "webhook" },
      { _id: "t2", workflowId: "wf-1", type: "cron" },
    ];
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue(triggers),
          }),
        }),
      },
    } as unknown as MutationCtx;

    const result = await getTriggersByWorkflowHandler(mockCtx, { workflowId: "wf-1" });

    expect(result).toEqual(triggers);
    expect(result).toHaveLength(2);
  });

  it("returns empty array when workflow has no triggers", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          withIndex: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([]),
          }),
        }),
      },
    } as unknown as MutationCtx;

    const result = await getTriggersByWorkflowHandler(mockCtx, { workflowId: "wf-empty" });

    expect(result).toEqual([]);
  });
});

// ─── updateTriggerHandler ─────────────────────────────────────────────────────

describe("updateTriggerHandler", () => {
  it("patches the trigger with provided config fields", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "cron", cronExpression: "0 9 * * *" };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "trigger-db-1",
      config: { cronExpression: "*/30 * * * *", timezone: "UTC" },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "trigger-db-1",
      expect.objectContaining({
        cronExpression: "*/30 * * * *",
        timezone: "UTC",
        updatedAt: expect.any(Number),
      })
    );
  });

  it("can update trigger type", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "webhook" };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "trigger-db-1",
      config: { type: "cron", cronExpression: "0 0 * * *" },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "trigger-db-1",
      expect.objectContaining({
        type: "cron",
        cronExpression: "0 0 * * *",
      })
    );
  });

  it("throws when trigger not found", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    } as unknown as MutationCtx;

    await expect(
      updateTriggerHandler(mockCtx, { triggerId: "nonexistent", config: {} })
    ).rejects.toThrow("Trigger not found");
  });

  it("can toggle enabled status", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "webhook", enabled: true };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "trigger-db-1",
      config: { enabled: false },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "trigger-db-1",
      expect.objectContaining({ enabled: false })
    );
  });
});

// ─── activateTriggerHandler ───────────────────────────────────────────────────

describe("activateTriggerHandler", () => {
  it("creates an execution record and updates trigger stats", async () => {
    const trigger = {
      _id: "trigger-db-1",
      workflowId: "wf-1",
      type: "webhook",
      enabled: true,
      triggerCount: 5,
    };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        insert: vi.fn().mockResolvedValue("exec-db-1"),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    const payload = { body: { order_id: "12345" }, triggerType: "webhook" };
    const result = await activateTriggerHandler(mockCtx, {
      triggerId: "trigger-db-1",
      payload,
    });

    expect(result).toBe("exec-db-1");
    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggerExecutions",
      expect.objectContaining({
        triggerId: "trigger-db-1",
        workflowId: "wf-1",
        payload,
        executionStatus: "pending",
        timestamp: expect.any(String),
        createdAt: expect.any(Number),
      })
    );
    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "trigger-db-1",
      expect.objectContaining({
        lastTriggeredAt: expect.any(Number),
        triggerCount: 6,
      })
    );
  });

  it("throws when trigger not found", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    } as unknown as MutationCtx;

    await expect(
      activateTriggerHandler(mockCtx, { triggerId: "nonexistent", payload: {} })
    ).rejects.toThrow("Trigger not found");
  });

  it("throws when trigger is disabled", async () => {
    const trigger = {
      _id: "trigger-db-1",
      workflowId: "wf-1",
      type: "webhook",
      enabled: false,
      triggerCount: 0,
    };
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
      },
    } as unknown as MutationCtx;

    await expect(
      activateTriggerHandler(mockCtx, { triggerId: "trigger-db-1", payload: {} })
    ).rejects.toThrow("Trigger is disabled");
  });
});

// ─── deleteTriggerHandler ─────────────────────────────────────────────────────

describe("deleteTriggerHandler", () => {
  it("deletes trigger and all its executions", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "webhook" };
    const executions = [
      { _id: "exec-db-1", triggerId: "trigger-db-1" },
      { _id: "exec-db-2", triggerId: "trigger-db-1" },
    ];

    const mockCtx = {
      db: {
        query: vi.fn().mockImplementation((table: string) => {
          if (table === "triggers") {
            return {
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(trigger),
              }),
            };
          }
          if (table === "triggerExecutions") {
            return {
              withIndex: vi.fn().mockReturnValue({
                collect: vi.fn().mockResolvedValue(executions),
              }),
            };
          }
          return {};
        }),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    await deleteTriggerHandler(mockCtx, { triggerId: "trigger-db-1" });

    expect(mockCtx.db.delete).toHaveBeenCalledWith("exec-db-1");
    expect(mockCtx.db.delete).toHaveBeenCalledWith("exec-db-2");
    expect(mockCtx.db.delete).toHaveBeenCalledWith("trigger-db-1");
    expect(mockCtx.db.delete).toHaveBeenCalledTimes(3);
  });

  it("deletes trigger with no executions", async () => {
    const trigger = { _id: "trigger-db-1", workflowId: "wf-1", type: "cron" };

    const mockCtx = {
      db: {
        query: vi.fn().mockImplementation((table: string) => {
          if (table === "triggers") {
            return {
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(trigger),
              }),
            };
          }
          return {
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue([]),
            }),
          };
        }),
        delete: vi.fn(),
      },
    } as unknown as MutationCtx;

    await deleteTriggerHandler(mockCtx, { triggerId: "trigger-db-1" });

    expect(mockCtx.db.delete).toHaveBeenCalledWith("trigger-db-1");
    expect(mockCtx.db.delete).toHaveBeenCalledTimes(1);
  });

  it("throws when trigger not found", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(null),
          }),
        }),
      },
    } as unknown as MutationCtx;

    await expect(
      deleteTriggerHandler(mockCtx, { triggerId: "nonexistent" })
    ).rejects.toThrow("Trigger not found");
  });
});
