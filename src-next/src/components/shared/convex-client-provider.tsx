"use client";

import { ConvexProvider, ConvexReactClient, useQuery, useMutation } from "convex/react";
import { ReactNode, useEffect } from "react";
import { AppProvider, useApp } from "./app-context";
import { SidebarProvider } from "./sidebar/sidebar-context";
import { api } from "@convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function WorkspaceInitializer() {
  const { activeWorkspaceId, setActiveWorkspaceId } = useApp();
  const ensureDefaultWorkspace = useMutation((api as any).workspaces.ensureDefaultWorkspace);
  const workspaces = useQuery((api as any).workspaces.getWorkspaces);

  useEffect(() => {
    ensureDefaultWorkspace({});
  }, []);

  useEffect(() => {
    if (activeWorkspaceId === null && workspaces) {
      const defaultWs = workspaces.find((w: { isDefault: boolean; id: string }) => w.isDefault);
      if (defaultWs) setActiveWorkspaceId(defaultWs.id);
    }
  }, [workspaces, activeWorkspaceId]);

  return null;
}

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <SidebarProvider>
        <AppProvider>
          <WorkspaceInitializer />
          {children}
        </AppProvider>
      </SidebarProvider>
    </ConvexProvider>
  );
}
