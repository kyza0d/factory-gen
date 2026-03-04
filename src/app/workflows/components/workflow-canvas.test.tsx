import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkflowCanvas } from './workflow-canvas';

// Create the mock functions directly here using vi.hoisted to ensure they're available
// inside the vi.mock factory call which is hoisted to the top.
const { mockUseQuery, mockUseMutation } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(() => vi.fn()),
}));

// Mock the 'convex/react' module with our locally defined mock functions
vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}));

// Mock the 'Node' component to simplify testing of WorkflowCanvas
vi.mock('./node', () => ({
  Node: vi.fn(() => <div>Mocked Node</div>),
}));

describe('workflow-canvas', () => {
  const mockWorkflowId = 'test-workflow-id';
  const mockNodeStatuses = {};
  const mockNodeResults = {};

  beforeEach(() => {
    vi.resetAllMocks(); // This resets all mocks, including implementations

    // Set default mock implementations for each test
    // This ensures that for tests where mockImplementation is not used,
    // useQuery defaults to undefined (loading).
    mockUseQuery.mockImplementation(() => undefined);
    mockUseMutation.mockImplementation(() => vi.fn()); // Default mutation function

    // Mock the 'Node' component to simplify testing of WorkflowCanvas
    // We need to re-apply this because resetAllMocks might clear it if it was mocked with a factory
  });

  it('renders "Fetching Nodes..." when nodes and edges are loading', async () => {
    render(
      <WorkflowCanvas
        workflowId={mockWorkflowId}
        nodeStatuses={mockNodeStatuses}
        nodeResults={mockNodeResults}
      />
    );
    expect(screen.getByText('Fetching Nodes...')).toBeInTheDocument();
  });

  it('renders "No Nodes Found" when no nodes or edges are available', async () => {
    // Mock the useQuery calls to return empty arrays immediately
    mockUseQuery.mockReturnValue([]);

    render(
      <WorkflowCanvas
        workflowId={mockWorkflowId}
        nodeStatuses={mockNodeStatuses}
        nodeResults={mockNodeResults}
      />
    );

    expect(screen.getByText('No Nodes Found')).toBeInTheDocument();
    expect(screen.queryByText('Fetching Nodes...')).not.toBeInTheDocument();
  });

  it('renders nodes when data is available', async () => {
    const nodes = [
      { _id: 'node1', id: 'node1', type: 'Input', position: { x: 0, y: 0 } },
      { _id: 'node2', id: 'node2', type: 'AI', position: { x: 100, y: 100 } },
    ];
    const edges = [
      { id: 'edge1', source: 'node1', target: 'node2', sourceHandle: 'out1', targetHandle: 'in1' },
    ];

    // Mock the useQuery calls using a counter to handle multiple calls per render
    // Since proxy identity is unstable, we rely on the order of calls in WorkflowCanvas:
    // 1. nodes = useQuery(api.nodes.getNodesByWorkflow, ...)
    // 2. edges = useQuery(api.nodes.getEdgesByWorkflow, ...)
    let callCount = 0;
    mockUseQuery.mockImplementation(() => {
      const result = callCount % 2 === 0 ? nodes : edges;
      callCount++;
      return result;
    });

    render(
      <WorkflowCanvas
        workflowId={mockWorkflowId}
        nodeStatuses={mockNodeStatuses}
        nodeResults={mockNodeResults}
      />
    );

    // Wait for nodes to be rendered
    await waitFor(() => expect(screen.getAllByText('Mocked Node')).toHaveLength(nodes.length));
    expect(screen.queryByText('Fetching Nodes...')).not.toBeInTheDocument();
    expect(screen.queryByText('No Nodes Found')).not.toBeInTheDocument();
  });
});
