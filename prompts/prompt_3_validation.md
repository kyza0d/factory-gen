# Validation and Integration of Zod-safe UI Node Generation

This prompt outlines the next steps for a new agent to validate the recently implemented backend logic for Zod-safe UI node generation. The focus is purely on backend functionality, ensuring that the Convex functions and AI integration work as expected. Frontend integration is explicitly out of scope for this phase.

## Objective
The primary objective is to demonstrate and verify the end-to-end functionality of generating, validating, storing, and retrieving a Zod-safe UI node configuration using the Convex backend and AI SDK. Debug logs should be used extensively to provide insight into each step of the process.

## Background Context
The following components have been implemented:
*   **Zod Schemas:** Defined in `convex/schema/nodes.ts` (`UINodeSchema`, `IOParamSchema`, etc.).
*   **Convex Schema:** Tables for `nodes`, `workflows`, and `edges` defined in `convex/schema.ts`.
*   **Convex Node Operations:** Mutations (`createNode`, `updateNode`, `deleteNode`) and queries (`getNode`, `getNodesByWorkflow`) for managing UI nodes in `convex/nodes.ts`.
*   **AI Node Generation:** A Convex Action `generateNode` in `convex/ai.ts` that uses the Vercel AI SDK and an OpenAI model to generate Zod-safe UI node JSON from a natural language prompt.
*   **Tests:** Unit tests exist for Zod schemas (`convex/schema/nodes.test.ts`) and the AI generation logic (`convex/ai.test.ts`).

## Task for the Next Agent

The next agent should perform the following steps, focusing on providing clear debug output at each stage:

1.  **Call `generateNode` Convex Action:**
    *   Invoke the `generateNode` Convex action with a sample prompt, e.g., "Generate a UI node for converting text to speech with 'text input' and 'audio output'".
    *   **Debug Output:** Log the input prompt and the raw JSON output received from the `generateNode` action.

2.  **Validate Generated Node (Zod):**
    *   Using the `UINodeSchema` from `convex/schema/nodes.ts`, perform a `safeParse` operation on the JSON output received from `generateNode`.
    *   **Debug Output:** Log whether the validation was successful or not, and if not, log the validation errors.

3.  **Store the Generated Node (Convex Mutation):**
    *   If Zod validation is successful, call the `createNode` Convex mutation (from `convex/nodes.ts`) to store the validated UI node in the Convex database. Ensure a `workflowId` is provided (you can use a placeholder UUID for now, as workflow creation is not yet a focus).
    *   **Debug Output:** Log the result of the `createNode` mutation (e.g., the Convex document ID).

4.  **Retrieve the Stored Node (Convex Query):**
    *   Using the `id` of the newly created node, call the `getNode` Convex query (from `convex/nodes.ts`) to retrieve the node from the database.
    *   **Debug Output:** Log the retrieved node object to verify it matches the initially generated and stored node.

5.  **Clean Up (Optional but Recommended for tests):**
    *   Consider adding a step to delete the created node after validation and retrieval to keep the database clean, especially if this were part of an automated test suite. For this initial validation, it's optional.

## Expected Output
The final output should be a clear series of debug logs demonstrating:
*   The prompt used for AI generation.
*   The AI-generated JSON node.
*   The result of Zod validation (success/failure and any errors).
*   Confirmation of successful storage in Convex.
*   The node successfully retrieved from Convex, matching the generated structure.

This will confirm that the core backend logic for Zod-safe UI node generation and persistence is functioning correctly.
