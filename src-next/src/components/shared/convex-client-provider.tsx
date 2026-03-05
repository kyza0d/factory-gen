"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { AppProvider } from "./app-context";
import { SidebarProvider } from "./sidebar/sidebar-context";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <SidebarProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </SidebarProvider>
    </ConvexProvider>
  );
}
