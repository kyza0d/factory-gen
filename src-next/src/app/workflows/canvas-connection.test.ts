import { describe, it, expect } from "vitest";
import { connectionReducer, ConnectionState, ConnectionAction } from "./canvas-connection";

// This module doesn't exist yet — this file drives its implementation.
// It encapsulates the port-click-to-connect state machine as a pure reducer
// so the logic can be tested independently of React and the canvas DOM.

const idle: ConnectionState = { status: "idle" };

describe("connectionReducer", () => {
  // ─── Starting a connection ─────────────────────────────────────────────

  it("transitions from idle to connecting when an output port is clicked", () => {
    const next = connectionReducer(idle, {
      type: "START",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    });

    expect(next).toEqual({
      status: "connecting",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    });
  });

  it("replaces an in-progress connection when a new output port is clicked", () => {
    const connecting: ConnectionState = {
      status: "connecting",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    };

    const next = connectionReducer(connecting, {
      type: "START",
      sourcePortId: "out-port-2",
      sourceNodeId: "node-2",
    });

    expect(next).toEqual({
      status: "connecting",
      sourcePortId: "out-port-2",
      sourceNodeId: "node-2",
    });
  });

  // ─── Cancelling ────────────────────────────────────────────────────────

  it("returns to idle when CANCEL is dispatched from connecting state", () => {
    const connecting: ConnectionState = {
      status: "connecting",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    };

    const next = connectionReducer(connecting, { type: "CANCEL" });

    expect(next).toEqual({ status: "idle" });
  });

  it("stays idle when CANCEL is dispatched from idle state", () => {
    const next = connectionReducer(idle, { type: "CANCEL" });
    expect(next).toEqual({ status: "idle" });
  });

  // ─── Completing a connection ───────────────────────────────────────────

  it("returns to idle with a completed edge when a valid target input port is clicked", () => {
    const connecting: ConnectionState = {
      status: "connecting",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    };

    const next = connectionReducer(connecting, {
      type: "COMPLETE",
      targetPortId: "in-port-1",
      targetNodeId: "node-2",
    });

    expect(next).toEqual({
      status: "idle",
      completedEdge: {
        sourcePortId: "out-port-1",
        sourceNodeId: "node-1",
        targetPortId: "in-port-1",
        targetNodeId: "node-2",
      },
    });
  });

  it("stays idle (no-op) when COMPLETE is dispatched from idle state", () => {
    const next = connectionReducer(idle, {
      type: "COMPLETE",
      targetPortId: "in-port-1",
      targetNodeId: "node-2",
    });

    expect(next).toEqual({ status: "idle" });
  });

  // ─── Self-connection guard ─────────────────────────────────────────────

  it("returns to idle with a validation error when source and target are the same node", () => {
    const connecting: ConnectionState = {
      status: "connecting",
      sourcePortId: "out-port-1",
      sourceNodeId: "node-1",
    };

    const next = connectionReducer(connecting, {
      type: "COMPLETE",
      targetPortId: "in-port-1",
      targetNodeId: "node-1", // same node
    });

    expect(next).toEqual({
      status: "idle",
      error: "Cannot connect a node to itself",
    });
  });

  // ─── Clearing completed / error state ─────────────────────────────────

  it("clears completedEdge and error when CLEAR is dispatched", () => {
    const withCompleted: ConnectionState = {
      status: "idle",
      completedEdge: {
        sourcePortId: "out-port-1",
        sourceNodeId: "node-1",
        targetPortId: "in-port-1",
        targetNodeId: "node-2",
      },
    };

    const next = connectionReducer(withCompleted, { type: "CLEAR" });
    expect(next).toEqual({ status: "idle" });
  });

  it("clears error when CLEAR is dispatched", () => {
    const withError: ConnectionState = {
      status: "idle",
      error: "Cannot connect a node to itself",
    };

    const next = connectionReducer(withError, { type: "CLEAR" });
    expect(next).toEqual({ status: "idle" });
  });
});
