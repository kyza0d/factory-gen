"use client"
import dynamic from 'next/dynamic';

export const Sidebar = dynamic(() => import('./SidebarContent').then((mod) => mod.SidebarContent), { ssr: true });
