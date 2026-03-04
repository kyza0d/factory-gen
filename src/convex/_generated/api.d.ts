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
import type * as node_types_AI_index from "../node_types/AI/index.js";
import type * as node_types_AI_modules from "../node_types/AI/modules.js";
import type * as node_types_AI_properties from "../node_types/AI/properties.js";
import type * as node_types_Input_index from "../node_types/Input/index.js";
import type * as node_types_Input_modules from "../node_types/Input/modules.js";
import type * as node_types_Input_properties from "../node_types/Input/properties.js";
import type * as node_types_Output_index from "../node_types/Output/index.js";
import type * as node_types_Output_modules from "../node_types/Output/modules.js";
import type * as node_types_Output_properties from "../node_types/Output/properties.js";
import type * as node_types_types from "../node_types/types.js";
import type * as nodes from "../nodes.js";
import type * as schema_nodes from "../schema/nodes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  ai: typeof ai;
  files: typeof files;
  "node_types/AI/index": typeof node_types_AI_index;
  "node_types/AI/modules": typeof node_types_AI_modules;
  "node_types/AI/properties": typeof node_types_AI_properties;
  "node_types/Input/index": typeof node_types_Input_index;
  "node_types/Input/modules": typeof node_types_Input_modules;
  "node_types/Input/properties": typeof node_types_Input_properties;
  "node_types/Output/index": typeof node_types_Output_index;
  "node_types/Output/modules": typeof node_types_Output_modules;
  "node_types/Output/properties": typeof node_types_Output_properties;
  "node_types/types": typeof node_types_types;
  nodes: typeof nodes;
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
