Your task is to implement the backend logic for generating Zod-safe JSON to render UI nodes, based on the research documented in '.reports/AGENTIC_UI_GENERATION_RESEARCH.md'.

Follow these steps:

1.  **Review Research Report:** Thoroughly read and understand the contents of '.reports/AGENTIC_UI_GENERATION_RESEARCH.md' to ensure all implementation decisions are guided by the research findings.

2.  **Define Zod Schemas for UI Nodes:**
    *   Create Zod schemas for the core components of a UI node: its overall structure, input definitions, output definitions, and parameter definitions. These schemas should be robust and reflect the 'deterministic node' requirement.
    *   Consider placing these schemas in a dedicated directory within the Convex backend (e.g., `convex/schema/nodes.ts` or similar).

3.  **Implement Convex Backend Functions:**
    *   Create Convex functions (mutations or queries as appropriate) that will be responsible for defining, storing, and retrieving UI node configurations.
    *   Implement a Convex function that, given certain inputs (e.g., a prompt from a user, or a type of AI agent), generates a Zod-safe JSON representation of a UI node. This function should leverage the `ai` library for meta-AI capabilities as researched.
    *   Ensure the generated JSON strictly adheres to the Zod schemas defined in step 2. Implement validation logic using Zod.

4.  **Integrate with AI Library:**
    *   Use the `ai` library within Convex functions to interact with AI models for generating node ideas, parameter suggestions, or even full node structures.
    *   Focus on ensuring the AI output can be transformed into the Zod-safe JSON format.

5.  **Create Test Cases:**
    *   Develop unit tests for the Zod schemas to ensure they correctly validate valid and invalid node structures.
    *   Write tests for the Convex functions that generate UI nodes, verifying that the output is indeed Zod-safe JSON and logically correct based on inputs.

6.  **Update 'overview.md':** Briefly update the 'overview.md' document in the project root under a new 'Backend Implementation Progress' section, detailing the completion of this phase, the implemented components, and their location.
