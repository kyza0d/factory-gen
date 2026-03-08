import { describe, it, expect, vi } from "vitest";
import {
  createTriggerHandler,
  updateTriggerHandler,
  activateTriggerHandler,
} from "../../triggers";
import { MutationCtx } from "../../_generated/server";

// ─── HTTP Request Trigger ─────────────────────────────────────────────────────
//
// Parameters for a useful HTTP Request trigger:
//   httpMethod     - GET | POST | PUT | PATCH | DELETE
//   httpAuthSecret - optional bearer token to protect the endpoint
//
// Payload shape when activated:
//   { method, headers, body, query }

describe("HTTP Request Trigger — createTriggerHandler", () => {
  it("defaults to POST when no method is provided", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-1") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: {},
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({ httpMethod: "POST" })
    );
  });

  it("stores PUT method", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-2") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: { method: "PUT" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({ type: "httpRequest", httpMethod: "PUT" })
    );
  });

  it("stores PATCH method", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-3") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: { method: "PATCH" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({ httpMethod: "PATCH" })
    );
  });

  it("stores DELETE method", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-4") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: { method: "DELETE" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({ httpMethod: "DELETE" })
    );
  });

  it("stores httpAuthSecret when provided", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-5") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: { method: "POST", authSecret: "my-secret-token" },
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggers",
      expect.objectContaining({
        httpMethod: "POST",
        httpAuthSecret: "my-secret-token",
      })
    );
  });

  it("omits httpAuthSecret when not provided", async () => {
    const mockCtx = {
      db: { insert: vi.fn().mockResolvedValue("t-6") },
    } as unknown as MutationCtx;

    await createTriggerHandler(mockCtx, {
      workflowId: "wf-1",
      nodeId: "node-1",
      type: "httpRequest",
      config: { method: "GET" },
    });

    const insertedData = (mockCtx.db.insert as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(insertedData).not.toHaveProperty("httpAuthSecret");
  });
});

describe("HTTP Request Trigger — updateTriggerHandler", () => {
  const baseTrigger = {
    _id: "t-existing",
    workflowId: "wf-1",
    type: "httpRequest",
    httpMethod: "POST",
    enabled: true,
  };

  it("updates httpMethod to PUT", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(baseTrigger),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "t-existing",
      config: { httpMethod: "PUT" },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "t-existing",
      expect.objectContaining({ httpMethod: "PUT" })
    );
  });

  it("updates httpAuthSecret", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(baseTrigger),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "t-existing",
      config: { httpAuthSecret: "new-secret" },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "t-existing",
      expect.objectContaining({ httpAuthSecret: "new-secret" })
    );
  });

  it("can clear httpAuthSecret by setting it to an empty string", async () => {
    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue({ ...baseTrigger, httpAuthSecret: "old-secret" }),
          }),
        }),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    await updateTriggerHandler(mockCtx, {
      triggerId: "t-existing",
      config: { httpAuthSecret: "" },
    });

    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "t-existing",
      expect.objectContaining({ httpAuthSecret: "" })
    );
  });
});

describe("HTTP Request Trigger — activateTriggerHandler with HTTP payload", () => {
  it("stores structured HTTP payload with method, headers, body, and query", async () => {
    const trigger = {
      _id: "t-http",
      workflowId: "wf-1",
      type: "httpRequest",
      httpMethod: "POST",
      enabled: true,
      triggerCount: 0,
    };

    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        insert: vi.fn().mockResolvedValue("exec-http-1"),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    const httpPayload = {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "abc123" },
      body: { orderId: "ORD-999", amount: 59.99 },
      query: {},
    };

    const result = await activateTriggerHandler(mockCtx, {
      triggerId: "t-http",
      payload: httpPayload,
    });

    expect(result).toBe("exec-http-1");
    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggerExecutions",
      expect.objectContaining({
        payload: httpPayload,
        executionStatus: "pending",
      })
    );
    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "t-http",
      expect.objectContaining({ triggerCount: 1 })
    );
  });

  it("stores GET payload with query parameters and empty body", async () => {
    const trigger = {
      _id: "t-http-get",
      workflowId: "wf-1",
      type: "httpRequest",
      httpMethod: "GET",
      enabled: true,
      triggerCount: 2,
    };

    const mockCtx = {
      db: {
        query: vi.fn().mockReturnValue({
          filter: vi.fn().mockReturnValue({
            first: vi.fn().mockResolvedValue(trigger),
          }),
        }),
        insert: vi.fn().mockResolvedValue("exec-http-2"),
        patch: vi.fn(),
      },
    } as unknown as MutationCtx;

    const getPayload = {
      method: "GET",
      headers: { accept: "application/json" },
      body: null,
      query: { userId: "u-42", format: "json" },
    };

    await activateTriggerHandler(mockCtx, {
      triggerId: "t-http-get",
      payload: getPayload,
    });

    expect(mockCtx.db.insert).toHaveBeenCalledWith(
      "triggerExecutions",
      expect.objectContaining({ payload: getPayload })
    );
    expect(mockCtx.db.patch).toHaveBeenCalledWith(
      "t-http-get",
      expect.objectContaining({ triggerCount: 3 })
    );
  });
});
