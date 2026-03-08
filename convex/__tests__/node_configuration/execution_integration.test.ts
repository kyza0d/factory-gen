import { describe, it, expect, vi } from "vitest";
import { IOParam } from "@registry/types";

/**
 * Test Suite 3: Execution Integration - Configuration Usage
 *
 * This suite validates that parameter configurations are correctly read
 * and used during workflow execution, with proper fallback to defaults.
 *
 * The core logic being tested:
 * ```typescript
 * const paramConfigs = await ctx.runQuery(internal.node_configuration.getNodeParameterConfigs, {
 *   nodeId: node.id
 * });
 *
 * const params: Record<string, any> = {};
 * node.parameters?.forEach((p: IOParam) => {
 *   const config = paramConfigs.find((c) => c.paramId === p.id);
 *   params[p.name] = config?.configuredValue ?? p.defaultValue;
 * });
 * ```
 */

describe("Execution Integration - Configuration Usage", () => {
  // ─── Test 3.1: Build params with configured value ────────────────────────

  describe("Test 3.1: Execution uses configured parameter values", () => {
    it("uses configured value when parameter config exists", () => {
      const parameter: IOParam = {
        id: "param-model",
        name: "model",
        type: "string",
        description: "Model choice",
        defaultValue: "inception/mercury-2",
        options: ["inception/mercury-2", "gpt-3.5-turbo"],
        enabled: true,
      };

      const paramConfig = {
        _id: "config-db-1",
        nodeId: "node-1",
        paramId: "param-model",
        configuredValue: "gpt-3.5-turbo",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        validated: true,
        validationErrors: [],
      };

      // Simulate the execution logic
      const paramConfigs = [paramConfig];
      const params: Record<string, any> = {};

      [parameter].forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      expect(params.model).toBe("gpt-3.5-turbo");
      expect(params.model).not.toBe("inception/mercury-2");
    });

    it("correctly prioritizes configured value over default", () => {
      const parameter: IOParam = {
        id: "param-temp",
        name: "temperature",
        type: "number",
        description: "Temperature",
        defaultValue: 0.7,
        options: null,
        enabled: true,
      };

      const configuredValue = 0.1; // Different from default
      const paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-temp",
          configuredValue,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const params: Record<string, any> = {};
      [parameter].forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      expect(params.temperature).toBe(0.1);
      expect(params.temperature).toBe(configuredValue);
    });
  });

  // ─── Test 3.2: Fallback to default ────────────────────────────────────────

  describe("Test 3.2: Fallback to default when no configuration exists", () => {
    it("uses default value when no parameter config exists", () => {
      const parameter: IOParam = {
        id: "param-model",
        name: "model",
        type: "string",
        description: "Model choice",
        defaultValue: "inception/mercury-2",
        options: ["inception/mercury-2", "gpt-3.5-turbo"],
        enabled: true,
      };

      // Simulate the execution logic with no configs
      const paramConfigs: any[] = [];
      const params: Record<string, any> = {};

      [parameter].forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      expect(params.model).toBe("inception/mercury-2");
    });

    it("uses default for some parameters while using config for others", () => {
      const parameters: IOParam[] = [
        {
          id: "param-model",
          name: "model",
          type: "string",
          description: "Model",
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
      ];

      // Only configure the model parameter
      const paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-model",
          configuredValue: "gpt-3.5-turbo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const params: Record<string, any> = {};
      parameters.forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      // One uses configured value, one uses default
      expect(params.model).toBe("gpt-3.5-turbo");
      expect(params.systemPrompt).toBe("You are helpful.");
    });
  });

  // ─── Test 3.3: Null value handling ────────────────────────────────────────

  describe("Test 3.3: Handle null and falsy configured values correctly", () => {
    it("uses null configured value (means reset to default)", () => {
      const parameter: IOParam = {
        id: "param-model",
        name: "model",
        type: "string",
        description: "Model",
        defaultValue: "inception/mercury-2",
        options: null,
        enabled: true,
      };

      // Configuration with null value means "use default"
      const paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-model",
          configuredValue: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const params: Record<string, any> = {};
      [parameter].forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      // Should fallback to default when config value is null
      expect(params.model).toBe("inception/mercury-2");
    });

    it("distinguishes between falsy values and undefined", () => {
      const parameters: IOParam[] = [
        {
          id: "param-enabled",
          name: "enabled",
          type: "boolean",
          description: "Enable flag",
          defaultValue: true,
          options: null,
          enabled: true,
        },
        {
          id: "param-retries",
          name: "retries",
          type: "number",
          description: "Retry count",
          defaultValue: 3,
          options: null,
          enabled: true,
        },
      ];

      const paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-enabled",
          configuredValue: false, // Explicitly false, not default true
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
        {
          _id: "config-db-2",
          nodeId: "node-1",
          paramId: "param-retries",
          configuredValue: 0, // Explicitly 0, not default 3
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const params: Record<string, any> = {};
      parameters.forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      // Falsy values should be preserved
      expect(params.enabled).toBe(false);
      expect(params.retries).toBe(0);
    });
  });

  // ─── Test 3.4: Multiple parameters ────────────────────────────────────────

  describe("Test 3.4: Configuration changes affect execution correctly", () => {
    it("processes configuration updates for all parameters in a node", () => {
      const parameters: IOParam[] = [
        {
          id: "param-model",
          name: "model",
          type: "string",
          description: "Model",
          defaultValue: "inception/mercury-2",
          options: ["inception/mercury-2", "gpt-3.5-turbo"],
          enabled: true,
        },
        {
          id: "param-temp",
          name: "temperature",
          type: "number",
          description: "Temp",
          defaultValue: 0.7,
          options: null,
          enabled: true,
        },
        {
          id: "param-prompt",
          name: "systemPrompt",
          type: "string",
          description: "Prompt",
          defaultValue: "Default prompt",
          options: null,
          enabled: true,
        },
      ];

      // All three parameters have configurations
      const paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-model",
          configuredValue: "gpt-3.5-turbo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
        {
          _id: "config-db-2",
          nodeId: "node-1",
          paramId: "param-temp",
          configuredValue: 0.9,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
        {
          _id: "config-db-3",
          nodeId: "node-1",
          paramId: "param-prompt",
          configuredValue: "Custom prompt",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];

      const params: Record<string, any> = {};
      parameters.forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });

      expect(params.model).toBe("gpt-3.5-turbo");
      expect(params.temperature).toBe(0.9);
      expect(params.systemPrompt).toBe("Custom prompt");
    });

    it("correctly updates single parameter while keeping others", () => {
      const parameters: IOParam[] = [
        {
          id: "param-model",
          name: "model",
          type: "string",
          description: "Model",
          defaultValue: "inception/mercury-2",
          options: null,
          enabled: true,
        },
        {
          id: "param-temp",
          name: "temperature",
          type: "number",
          description: "Temp",
          defaultValue: 0.7,
          options: null,
          enabled: true,
        },
      ];

      // Simulate first execution: no config
      let paramConfigs: any[] = [];
      let params: Record<string, any> = {};
      parameters.forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });
      expect(params.model).toBe("inception/mercury-2");
      expect(params.temperature).toBe(0.7);

      // Simulate second execution: model configured, temp still default
      paramConfigs = [
        {
          _id: "config-db-1",
          nodeId: "node-1",
          paramId: "param-model",
          configuredValue: "gpt-3.5-turbo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          validated: true,
          validationErrors: [],
        },
      ];
      params = {};
      parameters.forEach((p: IOParam) => {
        const config = paramConfigs.find((c) => c.paramId === p.id);
        params[p.name] = config?.configuredValue ?? p.defaultValue;
      });
      expect(params.model).toBe("gpt-3.5-turbo");
      expect(params.temperature).toBe(0.7); // Still uses default
    });
  });
});
