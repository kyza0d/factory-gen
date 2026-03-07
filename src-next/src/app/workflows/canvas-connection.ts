export type CompletedEdge = {
  sourcePortId: string;
  sourceNodeId: string;
  targetPortId: string;
  targetNodeId: string;
};

export type ConnectionState =
  | { status: "idle"; completedEdge?: CompletedEdge; error?: string }
  | { status: "connecting"; sourcePortId: string; sourceNodeId: string };

export type ConnectionAction =
  | { type: "START"; sourcePortId: string; sourceNodeId: string }
  | { type: "COMPLETE"; targetPortId: string; targetNodeId: string }
  | { type: "CANCEL" }
  | { type: "CLEAR" };

export function connectionReducer(
  state: ConnectionState,
  action: ConnectionAction
): ConnectionState {
  switch (action.type) {
    case "START":
      return {
        status: "connecting",
        sourcePortId: action.sourcePortId,
        sourceNodeId: action.sourceNodeId,
      };

    case "CANCEL":
      return { status: "idle" };

    case "COMPLETE": {
      if (state.status !== "connecting") {
        return { status: "idle" };
      }
      if (state.sourceNodeId === action.targetNodeId) {
        return { status: "idle", error: "Cannot connect a node to itself" };
      }
      return {
        status: "idle",
        completedEdge: {
          sourcePortId: state.sourcePortId,
          sourceNodeId: state.sourceNodeId,
          targetPortId: action.targetPortId,
          targetNodeId: action.targetNodeId,
        },
      };
    }

    case "CLEAR":
      return { status: "idle" };

    default:
      return state;
  }
}
