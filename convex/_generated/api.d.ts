/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as ai from "../ai.js";
import type * as files from "../files.js";
import type * as node_operations from "../node_operations.js";
import type * as nodes_AI_index from "../nodes/AI/index.js";
import type * as nodes_AI_modules from "../nodes/AI/modules.js";
import type * as nodes_AI_properties from "../nodes/AI/properties.js";
import type * as nodes_Input_index from "../nodes/Input/index.js";
import type * as nodes_Input_modules from "../nodes/Input/modules.js";
import type * as nodes_Input_properties from "../nodes/Input/properties.js";
import type * as nodes_Output_index from "../nodes/Output/index.js";
import type * as nodes_Output_modules from "../nodes/Output/modules.js";
import type * as nodes_Output_properties from "../nodes/Output/properties.js";
import type * as nodes_index from "../nodes/index.js";
import type * as nodes_types from "../nodes/types.js";
import type * as schema_nodes from "../schema/nodes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  files: typeof files;
  node_operations: typeof node_operations;
  "nodes/AI/index": typeof nodes_AI_index;
  "nodes/AI/modules": typeof nodes_AI_modules;
  "nodes/AI/properties": typeof nodes_AI_properties;
  "nodes/Input/index": typeof nodes_Input_index;
  "nodes/Input/modules": typeof nodes_Input_modules;
  "nodes/Input/properties": typeof nodes_Input_properties;
  "nodes/Output/index": typeof nodes_Output_index;
  "nodes/Output/modules": typeof nodes_Output_modules;
  "nodes/Output/properties": typeof nodes_Output_properties;
  "nodes/index": typeof nodes_index;
  "nodes/types": typeof nodes_types;
  "schema/nodes": typeof schema_nodes;
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
