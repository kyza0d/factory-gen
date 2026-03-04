"use client"
import dynamic from 'next/dynamic';

export const Sidebar = dynamic(() => import('./sidebar-content').then((mod) => mod.SidebarContent), { ssr: true });
