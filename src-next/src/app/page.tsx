"use client";

import Link from "next/link";
import { Github, BookOpen } from "lucide-react";
import Logo from "@/components/shared/logo";
import { Button } from "ui-lab-components";

export default function Home() {
  const shortcuts = [
    { command: "New Workflow", key: "Ctrl+N" },
    { command: "Search", key: "Ctrl+P" },
    { command: "Open Workflows", key: "Ctrl+O" },
    { command: "Settings", key: "Ctrl+," },
    { command: "Save", key: "Ctrl+S" },
    { command: "Quick Help", key: "?" },
  ];

  return (
    <div className="flex flex-col items-center justify-center flex-1 h-full bg-background-950 text-foreground-50 px-6 py-12">
      {/* Logo */}
      <div className="mb-16 w-24 h-24">
        <Logo className="w-full h-full text-foreground-400 opacity-40" />
      </div>

      {/* Shortcuts Grid */}
      <div className="mb-16 w-full max-w-xs">
        <div className="grid grid-cols-1 gap-3">
          {shortcuts.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-foreground-300">{item.command}</span>
              <span className="text-foreground-500 font-mono text-xs bg-background-900 px-2.5 py-1.5 rounded border border-background-800">
                {item.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
