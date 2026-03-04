# Application Refinement Prompt

## Objective
Refine the Visual Workflow Editor to provide a more intuitive user experience by unifying the input mechanism and enabling workflow execution.

## Key Changes

### 1. Unified Prompt Input
- **Single Entry Point:** Replace the existing separate inputs for "Generate Node" and "Generate Workflow" with a single, intelligent prompt field.
- **Intent Detection:** Implement logic (either via a heuristic or a lightweight AI call) to determine if the user's prompt implies creating a single component (e.g., "Add a text input") or a full process (e.g., "Create a workflow to summarize articles").
- **Seamless Generation:** Based on the detected intent, call the appropriate backend function (`generateNode` or `generateWorkflow`) and update the canvas accordingly.

### 2. Workflow Execution
- **Execute Button:** Add a prominent "Run" or "Execute" button to the Workflow Canvas or the main UI header.
- **Execution Engine:** Implement a backend service (Convex action/mutation) that traverses the current workflow graph, processes data through each node's logic (e.g., calling AI models), and outputs the final result.
- **Visual Feedback:** Provide real-time visual cues on the canvas (e.g., highlighting nodes as they process) to show the execution progress.
- **Result Display:** Ensure the output of the "Output" node (or the final node in the chain) is clearly displayed to the user after execution.

## Success Criteria
- Users can type any workflow-related request into one box and see the correct result (single node or full graph).
- A generated workflow can be triggered to run, producing a tangible output based on the provided inputs.
- The UI remains clean, responsive, and visually consistent with the existing design.
