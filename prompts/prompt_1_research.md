Your task is to conduct comprehensive research for the 'Factory' project, focusing on backend design for generating Zod-safe JSON to render UI nodes. The goal is to produce a detailed research report in '.reports/AGENTIC_UI_GENERATION_RESEARCH.md' that will serve as a foundational guide for subsequent implementation, minimizing potential for hallucinations.

Follow these steps:

1.  **Understand Project Context:** Read and internalize the project's 'overview.md' document located at the root of the current project directory to understand the application's vision, core functionality, and technology stack.

2.  **Analyze Reference Project:** Investigate the provided reference project (which uses `ai` library version v5) to understand the advanced usage of 'convex' and 'ai' libraries, particularly concerning tools and processing. Note that the 'Factory' project uses `ai` library version v6. Access the following directories:
    *   `~/Projects/pomotea.com/app/convex/ai/processing/`
    *   `~/Projects/pomotea.com/app/convex/ai/tools/`
    Analyze relevant files to identify patterns, common practices, and specific implementations that facilitate agent interactions and tool usage. Focus on how these libraries are leveraged to define inputs, outputs, and parameters for AI-driven processes.

3.  **Perform Web Research:** Conduct targeted web searches for 'Convex' and 'AI' libraries, with a specific emphasis on:
    *   **Core Technologies and Methods:** Identify key features, APIs, and patterns used for defining and executing AI workflows, especially in the context of backend processing and data handling (e.g., Convex functions, mutations, queries, Convex search, Convex relationships, `ai` library's `createAI`, `readStreamableValue`, `render`, `z` for Zod schema integration).
        *   **Helpful links:**
            *   https://ai-sdk.dev/docs/foundations/tools
            *   https://ai-sdk.dev/docs/agents/overview
            *   https://ai-sdk.dev/docs/agents/workflows
    *   **UI Generation for Deterministic Nodes:** Research methods and best practices for dynamically generating UI structures (specifically for nodes) that have well-defined inputs, outputs, and parameters. Look for examples or documentation related to representing these structures in a schema-driven way (e.g., Zod schemas).
    *   **Zod-safe JSON Generation:** Focus on how Zod can be used to define and validate JSON schemas, and how to programmatically generate JSON that adheres to these schemas, particularly for UI components.

4.  **Compile Research Report:** Create a new markdown file at '.reports/AGENTIC_UI_GENERATION_RESEARCH.md' in the project root. Structure the report with the following sections:
    *   **Introduction:** Briefly state the purpose of the research.
    *   **Project Context Summary:** A concise overview of the 'Factory' project relevant to this task.
    *   **Convex & AI Library Insights from Reference Project:** Document key findings, code patterns, and architectural insights gained from analyzing `~/Projects/pomotea.com` directories. Include specific file paths and code snippets where relevant.
    *   **Convex Key Features for AI Workflows:** Detail relevant Convex features (e.g., mutations, queries, functions, background tasks, data modeling) that will be crucial for the 'Factory' backend.
    *   **AI Library Key Features for Agent Interaction:** Detail relevant 'ai' library features (e.g., `createAI`, `streamUI`, `readStreamableValue`, `render`) that enable agent as a tool paradigm.
    *   **Zod-safe JSON for UI Node Generation:** Discuss how Zod can be leveraged to define schemas for UI nodes (inputs, outputs, parameters) and strategies for generating JSON payloads that are type-safe and validated by Zod.
    *   **Proposed Data Structures for UI Nodes:** Based on your research, propose initial Zod schemas or TypeScript interfaces for representing UI nodes, their inputs, outputs, and parameters.
    *   **Architectural Considerations for Backend Generation:** Outline high-level ideas on how the Convex backend will orchestrate the generation of these Zod-safe UI node JSONs, potentially involving AI models.
    *   **Key Learnings and Recommendations:** Summarize critical takeaways and provide recommendations for the implementation phase.
