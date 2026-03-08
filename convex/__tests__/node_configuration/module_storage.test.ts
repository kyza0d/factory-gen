import { describe, it, expect, vi } from "vitest";
import {
  addNodeModuleHandler as addNodeModule,
  updateNodeModuleHandler as updateNodeModule,
  removeNodeModuleHandler as removeNodeModule,
  getNodeModulesHandler as getNodeModules,
} from "../../node_configuration";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { NodeModule } from "@registry/types";

/**
 * Test Setup: Node with Modules
 */
const testNodeWithModules = {
  _id: "node-db-1",
  id: "test-node-1",
  type: "Input",
  label: "Input Node",
  inputs: [],
  outputs: [],
  parameters: [],
  modules: [
    {
      id: "module-text-1",
      type: "text",
      label: "User Input Text",
      value: "Hello, world!",
      enabled: true,
    },
  ] as NodeModule[],
  position: { x: 0, y: 0 },
};

const testNodeWithTwoModules = {
  ...testNodeWithModules,
  modules: [
    {
      id: "module-text-1",
      type: "text",
      label: "First Module",
      value: "First content",
      enabled: true,
    },
    {
      id: "module-text-2",
      type: "text",
      label: "Second Module",
      value: "Second content",
      enabled: true,
    },
  ] as NodeModule[],
};

describe("Node Module Configuration", () => {
  // ─── Test 2.1: Add a module to a node ───────────────────────────────────

  describe("Test 2.1: Add a module to a node instance", () => {
    it("adds a module to a node", async () => {
      const nodeId = "test-node-1";
      const newModule: NodeModule = {
        id: "module-text-1",
        type: "text",
        label: "User Input Text",
        value: "Hello, world!",
        enabled: true,
      };

      const nodeWithoutModules = {
        ...testNodeWithModules,
        modules: [],
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(nodeWithoutModules),
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      await addNodeModule(mockCtx, {
        nodeId,
        module: newModule,
      });

      // Verify patch was called with the new module
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        nodeWithoutModules._id,
        expect.objectContaining({
          modules: expect.arrayContaining([newModule]),
        })
      );
    });

    it("throws error when adding duplicate module ID", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithModules),
            }),
          }),
        },
      } as unknown as MutationCtx;

      const duplicateModule: NodeModule = {
        id: "module-text-1", // Already exists
        type: "text",
        label: "Duplicate",
        value: "Duplicate content",
        enabled: true,
      };

      await expect(
        addNodeModule(mockCtx, {
          nodeId: "test-node-1",
          module: duplicateModule,
        })
      ).rejects.toThrow("already exists");
    });
  });

  // ─── Test 2.2: Update an existing module's value ──────────────────────

  describe("Test 2.2: Update an existing module's value", () => {
    it("updates module value without duplicating", async () => {
      const nodeId = "test-node-1";
      const moduleId = "module-text-1";
      const newValue = "Updated text content";

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithModules),
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      await updateNodeModule(mockCtx, {
        nodeId,
        moduleId,
        value: newValue,
      });

      // Verify patch was called with updated module
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        testNodeWithModules._id,
        expect.objectContaining({
          modules: expect.arrayContaining([
            expect.objectContaining({
              id: moduleId,
              value: newValue,
            }),
          ]),
        })
      );
    });

    it("throws error when updating non-existent module", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithModules),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        updateNodeModule(mockCtx, {
          nodeId: "test-node-1",
          moduleId: "does-not-exist",
          value: "New value",
        })
      ).rejects.toThrow("Module not found");
    });
  });

  // ─── Test 2.3: Remove a module from a node ──────────────────────────────

  describe("Test 2.3: Remove a module from a node", () => {
    it("removes a module from a node", async () => {
      const nodeId = "test-node-1";
      const moduleId = "module-text-1";

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithTwoModules),
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      await removeNodeModule(mockCtx, { nodeId, moduleId });

      // Verify patch was called with filtered modules
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        testNodeWithTwoModules._id,
        expect.objectContaining({
          modules: expect.arrayContaining([
            expect.objectContaining({
              id: "module-text-2",
            }),
          ]),
        })
      );

      // Verify the removed module is not in the result
      const patchCall = (mockCtx.db.patch as any).mock.calls[0];
      const patchedModules = patchCall[1].modules;
      expect(patchedModules.some((m: NodeModule) => m.id === moduleId)).toBe(false);
    });

    it("throws error when removing non-existent module", async () => {
      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithModules),
            }),
          }),
        },
      } as unknown as MutationCtx;

      await expect(
        removeNodeModule(mockCtx, {
          nodeId: "test-node-1",
          moduleId: "does-not-exist",
        })
      ).rejects.toThrow("Module not found");
    });
  });

  // ─── Test 2.4: Module null value handling ────────────────────────────────

  describe("Test 2.4: Module null value handling", () => {
    it("preserves null values in modules", async () => {
      const nodeId = "test-node-1";
      const moduleWithNull: NodeModule = {
        id: "module-empty",
        type: "text",
        label: "Optional Content",
        value: null,
        enabled: true,
      };

      const nodeWithoutModules = {
        ...testNodeWithModules,
        modules: [],
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(nodeWithoutModules),
            }),
          }),
          patch: vi.fn(),
        },
      } as unknown as MutationCtx;

      await addNodeModule(mockCtx, { nodeId, module: moduleWithNull });

      // Verify the module with null value was added
      expect(mockCtx.db.patch).toHaveBeenCalledWith(
        nodeWithoutModules._id,
        expect.objectContaining({
          modules: expect.arrayContaining([moduleWithNull]),
        })
      );
    });

    it("distinguishes null from empty string", async () => {
      const nodeId = "test-node-1";

      const moduleNull: NodeModule = {
        id: "module-null",
        type: "text",
        label: "Null Module",
        value: null,
        enabled: true,
      };

      const moduleEmpty: NodeModule = {
        id: "module-empty",
        type: "text",
        label: "Empty String Module",
        value: "",
        enabled: true,
      };

      const nodeWithBothModules = {
        ...testNodeWithModules,
        modules: [moduleNull, moduleEmpty],
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(nodeWithBothModules),
            }),
          }),
        },
      } as unknown as QueryCtx;

      const modules = await getNodeModules(mockCtx, { nodeId });

      const nullModule = modules.find((m) => m.id === "module-null");
      const emptyModule = modules.find((m) => m.id === "module-empty");

      expect(nullModule?.value).toBeNull();
      expect(emptyModule?.value).toBe("");
      expect(nullModule?.value).not.toBe(emptyModule?.value);
    });
  });

  // ─── Test 2.5: Get modules query ────────────────────────────────────────

  describe("Test 2.5: Get modules for a node", () => {
    it("retrieves all modules for a node", async () => {
      const nodeId = "test-node-1";

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(testNodeWithTwoModules),
            }),
          }),
        },
      } as unknown as QueryCtx;

      const modules = await getNodeModules(mockCtx, { nodeId });

      expect(modules).toHaveLength(2);
      expect(modules[0]).toEqual(testNodeWithTwoModules.modules[0]);
      expect(modules[1]).toEqual(testNodeWithTwoModules.modules[1]);
    });

    it("returns empty array when node has no modules", async () => {
      const nodeId = "test-node-1";

      const nodeWithoutModules = {
        ...testNodeWithModules,
        modules: [],
      };

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(nodeWithoutModules),
            }),
          }),
        },
      } as unknown as QueryCtx;

      const modules = await getNodeModules(mockCtx, { nodeId });

      expect(modules).toEqual([]);
    });

    it("throws error when node not found", async () => {
      const nodeId = "does-not-exist";

      const mockCtx = {
        db: {
          query: vi.fn().mockReturnValue({
            filter: vi.fn().mockReturnValue({
              first: vi.fn().mockResolvedValue(null),
            }),
          }),
        },
      } as unknown as QueryCtx;

      await expect(getNodeModules(mockCtx, { nodeId })).rejects.toThrow(
        "Node not found"
      );
    });
  });
});
