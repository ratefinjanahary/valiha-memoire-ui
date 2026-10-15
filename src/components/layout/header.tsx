"use client";

import { Menu } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/button";

export function Header() {
  const { toggleSidebar } = useUiStore();

  return (
    <header className="h-16 border-b bg-background flex items-center px-6 shrink-0">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mr-2">
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
    </header>
  );
}
