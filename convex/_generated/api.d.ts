/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as node_configuration from "../node_configuration.js";
import type * as node_types_AI_index from "../node_types/AI/index.js";
import type * as node_types_Input_index from "../node_types/Input/index.js";
import type * as node_types_Output_index from "../node_types/Output/index.js";
import type * as node_types_Trigger_index from "../node_types/Trigger/index.js";
import type * as node_types_types from "../node_types/types.js";
import type * as nodes from "../nodes.js";
import type * as schema_nodes from "../schema/nodes.js";
import type * as triggers from "../triggers.js";
import type * as workflow_actions from "../workflow_actions.js";
import type * as workflow_generation from "../workflow_generation.js";
import type * as workspaces from "../workspaces.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  files: typeof files;
  http: typeof http;
  node_configuration: typeof node_configuration;
  "node_types/AI/index": typeof node_types_AI_index;
  "node_types/Input/index": typeof node_types_Input_index;
  "node_types/Output/index": typeof node_types_Output_index;
  "node_types/Trigger/index": typeof node_types_Trigger_index;
  "node_types/types": typeof node_types_types;
  nodes: typeof nodes;
  "schema/nodes": typeof schema_nodes;
  triggers: typeof triggers;
  workflow_actions: typeof workflow_actions;
  workflow_generation: typeof workflow_generation;
  workspaces: typeof workspaces;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
