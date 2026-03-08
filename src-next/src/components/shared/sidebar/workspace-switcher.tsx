"use client"
import React, { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { FaPlus, FaTrash, FaMagnifyingGlass } from 'react-icons/fa6';
import { Select, Button } from 'ui-lab-components';
import { api } from "@convex/_generated/api";
import { useApp } from '../app-context';

type Workspace = {
  _id: string;
  id: string;
  name: string;
  isDefault: boolean;
  description?: string;
};

type WorkspaceSwitcherProps = {
  isSearchOpen: boolean;
  toggleSearch: () => void;
}

export const WorkspaceSwitcher = React.memo(function WorkspaceSwitcher({ isSearchOpen, toggleSearch }: WorkspaceSwitcherProps) {
  const { activeWorkspaceId, setActiveWorkspaceId } = useApp();
  const workspaces = useQuery((api as any).workspaces.getWorkspaces);
  const createWorkspace = useMutation((api as any).workspaces.createWorkspace);
  const deleteWorkspace = useMutation((api as any).workspaces.deleteWorkspace);

  const handleCreate = useCallback(async () => {
    const name = `Workspace ${(workspaces?.length ?? 0) + 1}`;
    const id = await createWorkspace({ name });
    setActiveWorkspaceId(id);
  }, [createWorkspace, setActiveWorkspaceId, workspaces]);

  const handleDelete = useCallback((ws: Workspace) => {
    // Fall back to default synchronously so the UI responds immediately
    if (activeWorkspaceId === ws.id) {
      const defaultWs = workspaces?.find((w: Workspace) => w.isDefault);
      if (defaultWs) setActiveWorkspaceId(defaultWs.id);
    }
    deleteWorkspace({ id: ws.id });
  }, [deleteWorkspace, activeWorkspaceId, workspaces, setActiveWorkspaceId]);

  if (workspaces === undefined) {
    return <div className="p-2 text-xs text-foreground-500">Loading...</div>;
  }

  return (
    <div className="w-full flex-col">
      <div className="flex items-center space-x-2">
        <Select
          selectedKey={activeWorkspaceId}
          onSelectionChange={(key) => setActiveWorkspaceId(key as string)}
        >
          <Select.Trigger className="w-full rounded-sm">
            <Select.Value placeholder="Select workspace" />
          </Select.Trigger>
          <Select.Content>
            {workspaces.map((ws: Workspace) => (
              <Select.Item key={ws.id} value={ws.id} textValue={ws.name}>
                <div
                  className="flex items-center justify-between w-full"
                  data-active={activeWorkspaceId === ws.id ? "true" : "false"}
                >
                  <span>{ws.name}</span>
                  {!ws.isDefault && (
                    <button
                      aria-label={`delete ${ws.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(ws);
                      }}
                      className="ml-2 text-foreground-400 hover:text-foreground-50 flex items-center justify-center"
                    >
                      <FaTrash size={11} />
                    </button>
                  )}
                </div>
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <button
          title="New workspace"
          onClick={handleCreate}
          className="w-8 h-8 aspect-square flex items-center justify-center rounded-xs text-foreground-400 hover:bg-background-900 hover:text-foreground-50 focus:outline-none focus:ring-2 focus:ring-accent-500/30"
        >
          <FaPlus size={12} />
        </button>
      </div>
    </div>
  );
});
