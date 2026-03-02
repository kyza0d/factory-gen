# Project Overview: Factory

## Application Vision
Factory is an innovative platform designed to empower users to build sophisticated AI workflows through a visual node-based interface. Leveraging the "Agent as a Tool" paradigm, Factory allows users to define custom AI agents as modular nodes, each specifying expected inputs, outputs, and configurable parameters. This enables the creation of complex, interconnected AI systems that can automate tasks, process information, and generate creative content. The core idea is to provide a meta-AI environment where users can essentially "program" AI agents by combining pre-defined and custom nodes, fostering a new era of AI-driven automation and creativity.

## Core Functionality
The Factory application will provide the following core functionalities:

1.  **Node-based Workflow Editor:** A drag-and-drop interface for building AI workflows by connecting nodes.
2.  **Custom Node Definition:** Users can define and configure their own AI agent nodes, specifying input types, output types, and parameters. This will involve integrating with "meta-AI" capabilities to assist in node development.
3.  **Pre-built Node Library:** A curated collection of common AI tasks and integrations available as ready-to-use nodes.
4.  **Workflow Execution:** The ability to run defined workflows, with clear visualization of data flow and execution status.
5.  **Persistence and Sharing:** Users can save, load, and share their created workflows and custom nodes.
6.  **Background Processing:** Support for long-running or asynchronous AI tasks, managed efficiently by the backend.

## Technology Stack
Factory will utilize a modern and robust technology stack to ensure scalability, performance, and a rich user experience:

*   **Frontend:** **Next.js** (React Framework) for building a fast, interactive, and server-rendered user interface. This choice provides excellent developer experience, performance optimizations, and a flexible component model.
*   **Backend & Database:** **Convex** will serve as the backend, handling data storage, real-time updates, and critical background processes. Convex's serverless functions and built-in real-time capabilities are ideal for managing dynamic workflows and agent execution.

## Initial Architectural Approach & Hardest Parts

### Architectural Approach
The architecture will be client-server based, with Next.js handling the user interface and Convex managing backend logic and data.

*   **Frontend (Next.js):**
    *   **Workflow Editor Component:** This will be the central piece, responsible for rendering nodes, connections, and handling user interactions (drag, drop, connect, configure).
    *   **Node Configuration Panels:** Dynamic UI components that appear when a node is selected, allowing users to define parameters, inputs, and outputs.
    *   **Real-time Updates:** Leveraging Convex's real-time capabilities to provide immediate feedback on workflow status, agent execution, and data flow.
*   **Backend (Convex):**
    *   **Data Models:** Define schema for workflows, nodes, agent configurations, and execution logs.
    *   **Workflow Engine:** Functions to parse, validate, and execute workflows. This will likely involve a state machine or similar pattern to manage complex sequences.
    *   **Agent Execution Layer:** Functions responsible for invoking the actual "meta-AI" or external AI services based on node definitions.
    *   **Background Tasks:** Utilizing Convex's background processing features for long-running AI computations, ensuring the frontend remains responsive.

### Hardest Parts

1.  **Real-time Node Editor Complexity:** Building a fluid and robust drag-and-drop node editor with complex connection logic, undo/redo, and dynamic UI for node configuration will be challenging. Ensuring performance with many nodes and connections is crucial.
2.  **"Agent as a Tool" Integration:** Designing a flexible and secure mechanism to allow users to define arbitrary AI agents and their inputs/outputs, potentially integrating with various "meta-AI" services or APIs. This involves dynamic schema generation and validation.
3.  **Workflow Execution Engine:** Implementing a resilient and fault-tolerant workflow execution engine that can handle complex branching, loops, and asynchronous operations, especially with background processing. Error handling and logging for AI agent failures will be critical.
4.  **Scalability of AI Invocations:** Managing and orchestrating numerous AI calls, especially for long-running tasks, while maintaining responsiveness and cost-efficiency.
5.  **User Experience for AI Configuration:** Abstracting the complexity of AI model parameters into an intuitive user interface for node configuration will require careful design.

## Backend Implementation Progress

### Phase 1: Zod-safe UI Node Generation
The core backend infrastructure for generating and managing Zod-safe UI nodes has been implemented.

*   **Zod Schemas:** Defined robust schemas for UI nodes, inputs, outputs, and parameters in `convex/schema/nodes.ts`. These schemas ensure deterministic and type-safe JSON structures for the "Agent as a Tool" paradigm.
*   **Database Schema:** Established Convex tables for `nodes`, `workflows`, and `edges` in `convex/schema.ts`, including appropriate indexing for efficient retrieval.
*   **Node Management:** Implemented Convex mutations and queries in `convex/nodes.ts` for creating, retrieving, updating, and deleting UI nodes.
*   **AI-Driven Generation:** Created a Convex Action in `convex/ai.ts` that leverages the Vercel AI SDK (`generateObject`) and OpenAI's models to dynamically generate valid UI node configurations from user prompts, strictly adhering to the Zod schemas.
*   **Validation & Testing:** 
    *   Unit tests for Zod schemas in `convex/schema/nodes.test.ts`.
    *   Mocked unit tests for the AI generation logic in `convex/ai.test.ts`.
    *   All tests verified with `vitest`.

Here is an organized set of tasks to guide the development of Factory:

1.  **Project Setup & Basic Structure:**
    *   Initialize Next.js project.
    *   Integrate Convex client library and set up basic backend.
    *   Establish initial styling setup (e.g., Tailwind CSS).
2.  **Core Node Editor Development:**
    *   Implement basic canvas for drag-and-drop.
    *   Develop core `Node` and `Edge` components.
    *   Enable connecting nodes with edges.
3.  **Node Definition & Configuration:**
    *   Create a generic node configuration panel.
    *   Develop a system for users to define input/output schemas for custom nodes.
    *   Implement UI for parameter input (text, dropdowns, etc.).
4.  **Convex Backend Integration - Data Models:**
    *   Define Convex tables for `Workflows`, `Nodes`, `Edges`, `AgentDefinitions`.
    *   Implement Convex functions for saving and loading workflows.
5.  **Workflow Execution Engine (Frontend & Backend):**
    *   Develop frontend logic to trigger workflow execution.
    *   Implement Convex functions to process a workflow graph.
    *   Integrate with external AI services/APIs for agent execution within Convex functions.
    *   Handle asynchronous task management using Convex background functions.
6.  **Real-time Feedback & Monitoring:**
    *   Display workflow execution status in real-time on the frontend.
    *   Show node-specific outputs and logs during execution.
7.  **User Authentication & Authorization (Future Consideration):**
    *   (Not in initial scope, but important for sharing) Implement user authentication and authorization.
8.  **Pre-built Node Library:**
    *   Design and implement a few initial pre-built AI nodes (e.g., "Text Summarizer", "Image Generator").
9.  **Error Handling & Logging:**
    *   Implement robust error handling throughout the application.
    *   Set up comprehensive logging for debugging and monitoring.
10. **Persistence and Sharing Features:**
    *   Allow users to save, retrieve, and version their workflows.
    *   Implement mechanisms for sharing workflows with other users.
