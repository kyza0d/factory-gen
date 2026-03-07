"use client"
import React, { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { FaPlus, FaTrash } from 'react-icons/fa6';
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

export const WorkspaceSwitcher = React.memo(function WorkspaceSwitcher() {
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
      <div className="px-2 flex items-center space-x-3">
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
        <Button
          variant="ghost"
          title="New workspace"
          onPress={handleCreate}
          className="w-7 h-7 p-0 rounded-sm text-foreground-400 hover:text-foreground-50 hover:bg-background-700"
        >
          <FaPlus size={12} />
        </Button>
      </div>
    </div>
  );
});
