import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Node } from './node';
import React from 'react';

// Mock react-draggable
vi.mock('react-draggable', () => {
  return {
    default: vi.fn(({ children, grid }) => (
      <div data-testid="draggable-mock" data-grid={JSON.stringify(grid)}>
        {children}
      </div>
    )),
  };
});

// Mock UI components from ui-lab-components
vi.mock('ui-lab-components', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: () => <input />,
  Select: Object.assign(
    ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    {
      Trigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Value: ({ placeholder }: { placeholder: string }) => <div>{placeholder}</div>,
      Content: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      Item: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    }
  ),
}));

// Mock DebouncedInput
vi.mock('../../../components/ui/debounced-input', () => ({
  DebouncedInput: () => <input />,
}));

import { UINode } from '@registry/types';

describe('Node component', () => {
  const mockNode: Partial<UINode> = {
    id: 'node1',
    type: 'AI',
    label: 'AI Node',
    position: { x: 100, y: 100 },
    inputs: [],
    outputs: [],
    parameters: [],
    modules: [],
  };

  it('passes grid=[25, 25] to Draggable component', () => {
    const { getByTestId } = render(
      <Node
        node={mockNode as UINode}
        onModuleValueChange={vi.fn()}
        onParameterValueChange={vi.fn()}
        onPositionChange={vi.fn()}
      />
    );

    const draggable = getByTestId('draggable-mock');
    expect(draggable.getAttribute('data-grid')).toBe(JSON.stringify([25, 25]));
  });
});
