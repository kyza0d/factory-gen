"use client"
import React, { useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { FaPlus, FaTrash } from 'react-icons/fa6';
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
    <div className="w-full px-2 py-1">
      <div className="flex justify-end">
        <button
          title="New workspace"
          onClick={handleCreate}
          className="w-7 h-7 p-0 rounded-sm text-foreground-400 hover:text-foreground-50 hover:bg-background-700 flex items-center justify-center"
        >
          <FaPlus size={12} />
        </button>
      </div>
      {workspaces.map((ws: Workspace) => (
        <div
          key={ws.id}
          data-active={ws.id === activeWorkspaceId ? "true" : "false"}
          onClick={() => setActiveWorkspaceId(ws.id)}
          className={`group flex items-center justify-between h-9 px-3 rounded-sm cursor-pointer text-xs font-medium ${
            ws.id === activeWorkspaceId
              ? 'bg-background-900 text-foreground-100'
              : 'text-foreground-400 hover:text-foreground-50 hover:bg-background-900'
          }`}
        >
          <span>{ws.name}</span>
          {!ws.isDefault && (
            <button
              aria-label={`delete ${ws.name}`}
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(ws);
              }}
              className="opacity-0 group-hover:opacity-100 w-7 h-7 p-0 rounded-sm text-foreground-400 hover:text-foreground-50 hover:bg-background-700 flex items-center justify-center"
            >
              <FaTrash size={11} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
});
