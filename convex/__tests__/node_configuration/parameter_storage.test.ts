import { describe, it, expect, vi } from "vitest";
import {
  updateNodeParameterHandler as updateNodeParameter,
  getNodeParameterConfigHandler as getNodeParameterConfig,
  getNodeParameterConfigsHandler as getNodeParameterConfigs,
  clearNodeParameterHandler as clearNodeParameter,
} from "../../node_configuration";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { IOParam } from "@registry/types";

/**
 * Test Setup: Node and Parameter Definitions
 */
const testNodeWithParams = {
  _id: "node-db-1",
  id: "test-node-1",
  type: "AI",
  label: "My AI Node",
  inputs: [],
  outputs: [],
  parameters: [
    {
      id: "param-model",
      name: "model",
      type: "string",
      description: "Model choice",
      defaultValue: "inception/mercury-2",
      options: ["inception/mercury-2", "gpt-3.5-turbo"],
      enabled: true,
    },
    {
      id: "param-prompt",
      name: "systemPrompt",
      type: "string",
      description: "System prompt",
      defaultValue: "You are helpful.",
      options: null,
      enabled: true,
    },
    {
      id: "param-count",
      name: "count",
      type: "number",
      description: "Count value",
      defaultValue: 5,
      options: null,
      enabled: true,
    },
  ],
  modules: [],
  position: { x: 0, y: 0 },
};

describe("Node Parameter Configuration Storage", () => {
  // ─── Test 1.1: Store parameter configuration ───────────────────────────

  describe("Test 1.1: Store parameter configuration for a new node", () => {
    it("stores parameter configuration for a node", async () => {
      const nodeId = "test-node-1";
      const paramId = "param-model";
      const configuredValue = "gpt-3.5-turbo";

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null), // No existing config
            }),
          }),
          insert: vi.fn().mockResolvedValue("config-db-1"),
        },
      } as unknown as MutationCtx;

      await updateNodeParameter(mockCtx, {
        nodeId,
        paramId,
        value: configuredValue,
      });

      // Verify insert was called with correct data
      expect(mockCtx.db.insert).toHaveBeenCalledWith(
        "node_parameter_configs",
        expect.objectContaining({
          nodeId,
          paramId,
          configuredValue,
          validated: true,
        })
      );
    });
  });

  // ─── Test 1.2: Retrieve all parameter configurations ───────────────────

  describe("Test 1.2: Retrieve configuration for multiple parameters", () => {
    it("retrieves all parameter configurations for a node", async () => {
      const nodeId = "test-node-1";

      const configs = [
        {
          _id: "config-db-1",
          nodeId,
          paramId: "param-model",
          configuredValue: "gpt-3.5-turbo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
        {
          _id: "config-db-2",
          nodeId,
          paramId: "param-prompt",
          configuredValue: "You are a code reviewer.",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              collect: vi.fn().mockResolvedValue(configs),
            }),
          }),
        },
      } as unknown as QueryCtx;

      const result = await getNodeParameterConfigs(mockCtx, { nodeId });

      expect(result).toHaveLength(2);
      expect(result.find((c) => c.paramId === "param-model")?.configuredValue).toBe("gpt-3.5-turbo");
      expect(result.find((c) => c.paramId === "param-prompt")?.configuredValue).toBe("You are a code reviewer.");
    });
  });

  // ─── Test 1.3: Update existing parameter configuration ──────────────────

  describe("Test 1.3: Update an existing parameter configuration", () => {
    it("updates parameter configuration without duplicating", async () => {
      const nodeId = "test-node-1";
      const paramId = "param-model";

      const existingConfig = {
        _id: "config-db-1",
        nodeId,
        paramId,
        configuredValue: "gpt-3.5-turbo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        validated: true,
        validationErrors: [],
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existingConfig), // Config already exists
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      // Update existing configuration
      await updateNodeParameter(mockCtx, { nodeId, paramId, value: "gpt-3.5-turbo" });

      // Verify patch was called (not insert)
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        existingConfig._id,
        expect.objectContaining({
          configuredValue: "gpt-3.5-turbo",
          validated: true,
        })
      );
    });
  });

  // ─── Test 1.4: Clear parameter configuration ──────────────────────────

  describe("Test 1.4: Clear a parameter configuration (reset to default)", () => {
    it("clears parameter configuration back to metadata default", async () => {
      const nodeId = "test-node-1";
      const paramId = "param-model";

      const existingConfig = {
        _id: "config-db-1",
        nodeId,
        paramId,
        configuredValue: "gpt-3.5-turbo",
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(existingConfig),
            }),
          }),
          insert: vi.fn(),
          patch: vi.fn(),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      // Clear the configuration
      await clearNodeParameter(mockCtx, { nodeId, paramId });

      // Verify delete was called
      expect(mockCtx.db.delete).toHaveBeenCalledWith(existingConfig._id);
    });

    it("handles clearing a non-existent configuration gracefully", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null), // No existing config
            }),
          }),
          delete: vi.fn(),
        },
      } as unknown as MutationCtx;

      // Should not throw
      await clearNodeParameter(mockCtx, { nodeId: "test-node-1", paramId: "param-model" });

      // Delete should not be called
      expect(mockCtx.db.delete).not.toHaveBeenCalled();
    });
  });

  // ─── Test 1.5: Handle invalid node/parameter IDs ────────────────────────

  describe("Test 1.5: Handle invalid node or parameter IDs gracefully", () => {
    it("throws error for non-existent node", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null), // Node not found
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeParameter(mockCtx, {
          nodeId: "does-not-exist",
          paramId: "param-model",
          value: "gpt-3.5-turbo",
        })
      ).rejects.toThrow("Node not found");
    });

    it("throws error for non-existent parameter", async () => {
      const nodeWithoutParam = {
        ...testNodeWithParams,
        parameters: [], // No parameters
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(nodeWithoutParam),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeParameter(mockCtx, {
          nodeId: "test-node-1",
          paramId: "does-not-exist",
          value: "gpt-3.5-turbo",
        })
      ).rejects.toThrow("Parameter not found");
    });
  });

  // ─── Test 1.5b: Type validation ──────────────────────────────────────────

  describe("Test 1.5b: Validation of parameter types and values", () => {
    it("throws error for string parameter with wrong type", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeParameter(mockCtx, {
          nodeId: "test-node-1",
          paramId: "param-model",
          value: 123, // Should be string
        })
      ).rejects.toThrow("must be a string");
    });

    it("throws error for number parameter with wrong type", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeParameter(mockCtx, {
          nodeId: "test-node-1",
          paramId: "param-count",
          value: "not-a-number",
        })
      ).rejects.toThrow("must be a number");
    });

    it("throws error for parameter value not in options list", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeParameter(mockCtx, {
          nodeId: "test-node-1",
          paramId: "param-model",
          value: "claude-3", // Not in options
        })
      ).rejects.toThrow("must be one of");
    });

    it("allows null value to clear configuration", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithParams),
            }),
            withIndex: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
          insert: vi.fn().mockResolvedValue("config-db-1"),
        },
      } as unknown as MutationCtx;

      // Should not throw
      await updateNodeParameter(mockCtx, {
        nodeId: "test-node-1",
        paramId: "param-model",
        value: null,
      });

      expect(mockCtx.db.insert).toHaveBeenCalled();
    });
  });
});
